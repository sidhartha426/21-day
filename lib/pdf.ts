import PDFDocument from 'pdfkit'
import {
  CHALLENGE_DAYS,
  computeRows,
  formatDay,
  MAX_STARS,
  summarize,
  verdictFor,
  type ChallengeConfig,
  type DayRow,
} from '@/lib/challenge'

type ReportInput = {
  config: ChallengeConfig
  rows: DayRow[]
  ownerName: string
  completedAt?: string | null
}

const COLORS = {
  ink: '#1c1917',
  muted: '#78716c',
  accent: '#0f766e',
  headerFill: '#ccfbf1',
  zebra: '#f5f5f4',
  border: '#d6d3d1',
  star: '#f59e0b',
  starEmpty: '#e7e5e4',
}

function drawStar(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, fill: string) {
  const points: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45
    const angle = (Math.PI / 5) * i - Math.PI / 2
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  doc.save().polygon(...points).fill(fill).restore()
}

export function reportFilename(config: ChallengeConfig) {
  return `21-day-${config.startDate}.pdf`
}

export function renderChallengePdf({ config, rows, ownerName, completedAt }: ReportInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: '21-day report' } })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const summary = summarize(config, rows)
    const computed = computeRows(config, rows)
    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 80

    // ---- Title ----
    doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(20)
    doc.text('21-day report', 40, 40, { width: contentWidth, align: 'center' })
    doc.moveDown(0.3)
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10)
    const lastDate = rows[rows.length - 1]?.date ?? config.startDate
    doc.text(`${ownerName}  |  ${config.startDate} to ${lastDate}`, { width: contentWidth, align: 'center' })
    if (completedAt) {
      doc.text(`Completed ${completedAt.slice(0, 10)}`, { width: contentWidth, align: 'center' })
    }
    doc.moveDown(1)

    // ---- Summary cards ----
    const cards = [
      ['Ideal / day', String(config.idealPerDay)],
      ['Days done', `${summary.completedDays}/${CHALLENGE_DAYS}`],
      ['Total sessions', `${summary.totalSessions}/${summary.idealTotal}`],
      ['Score', `${summary.scorePct.toFixed(1)}%`],
    ]
    const gap = 10
    const cardWidth = (contentWidth - gap * (cards.length - 1)) / cards.length
    const cardY = doc.y
    cards.forEach(([label, value], i) => {
      const x = 40 + i * (cardWidth + gap)
      doc.save().roundedRect(x, cardY, cardWidth, 50, 6).fill(COLORS.zebra).restore()
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9)
      doc.text(label, x + 10, cardY + 10, { width: cardWidth - 20 })
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(14)
      doc.text(value, x + 10, cardY + 24, { width: cardWidth - 20 })
    })

    // ---- Stars + verdict ----
    let y = cardY + 70
    const starSize = 10
    const starsWidth = 5 * starSize * 2 + 4 * 6
    let starX = (pageWidth - starsWidth) / 2 + starSize
    for (let i = 0; i < MAX_STARS; i++) {
      const fill = Math.min(Math.max(summary.stars - i, 0), 1)
      drawStar(doc, starX, y + starSize, starSize, COLORS.starEmpty)
      if (fill > 0) {
        doc.save()
        doc.rect(starX - starSize, y, starSize * 2 * fill, starSize * 2).clip()
        drawStar(doc, starX, y + starSize, starSize, COLORS.star)
        doc.restore()
      }
      starX += starSize * 2 + 6
    }
    y += starSize * 2 + 10
    if (summary.isComplete) {
      const verdict = verdictFor(summary.stars)
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(12)
      doc.text(verdict.title, 40, y, { width: contentWidth, align: 'center' })
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10)
      doc.text(verdict.message, 80, doc.y + 2, { width: contentWidth - 80, align: 'center' })
      y = doc.y + 16
    } else {
      y += 8
    }

    // ---- Table ----
    const headers = ['Day', 'Date', 'Sessions', 'Cumulative', 'Cumulative % of ideal']
    const colWidths = [70, 100, 90, 100, 155]
    const tableWidth = colWidths.reduce((a, b) => a + b, 0)
    const tableX = (pageWidth - tableWidth) / 2
    const headerHeight = 22
    const rowHeight = 20

    const drawRowLines = (rowY: number, height: number) => {
      doc.strokeColor(COLORS.border).lineWidth(0.5)
      doc.rect(tableX, rowY, tableWidth, height).stroke()
      let vx = tableX
      for (let i = 0; i < colWidths.length - 1; i++) {
        vx += colWidths[i]
        doc.moveTo(vx, rowY).lineTo(vx, rowY + height).stroke()
      }
    }

    const drawHeader = () => {
      doc.save().rect(tableX, y, tableWidth, headerHeight).fill(COLORS.headerFill).restore()
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10)
      let x = tableX
      headers.forEach((header, i) => {
        doc.text(header, x + 6, y + 6, { width: colWidths[i] - 12, align: i >= 2 ? 'right' : 'left' })
        x += colWidths[i]
      })
      drawRowLines(y, headerHeight)
      y += headerHeight
    }

    drawHeader()
    doc.font('Helvetica').fontSize(10)
    computed.forEach((row, index) => {
      if (y + rowHeight > doc.page.height - 50) {
        doc.addPage()
        y = 50
        drawHeader()
        doc.font('Helvetica').fontSize(10)
      }
      if (index % 2 === 0) {
        doc.save().rect(tableX, y, tableWidth, rowHeight).fill(COLORS.zebra).restore()
      }
      const values = [
        formatDay(row.day),
        row.date,
        row.dayCompleted ? String(row.sessionsCompleted) : '-',
        row.cumulative === null ? '-' : String(row.cumulative),
        row.cumulativePct === null ? '-' : `${row.cumulativePct.toFixed(2)}%`,
      ]
      doc.fillColor(COLORS.ink)
      let x = tableX
      values.forEach((value, i) => {
        doc.text(value, x + 6, y + 5, { width: colWidths[i] - 12, align: i >= 2 ? 'right' : 'left' })
        x += colWidths[i]
      })
      drawRowLines(y, rowHeight)
      y += rowHeight
    })

    doc.fillColor(COLORS.muted).fontSize(8)
    doc.text(`Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, 40, y + 14, {
      width: contentWidth,
      align: 'center',
    })

    doc.end()
  })
}
