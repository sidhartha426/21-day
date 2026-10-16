import fs from 'node:fs'
import path from 'node:path'

export type StoredDoc = { _id: string; _rev?: string }
export type Doc<T> = T & StoredDoc

export interface DocStore {
  get<T>(id: string): Promise<Doc<T> | null>
  put<T>(doc: Doc<T>): Promise<Doc<T>>
  /**
   * Applies `mutate` to the latest revision, retrying on conflicts. Never
   * recreates a missing doc; resolves to null if it doesn't exist.
   */
  update<T>(id: string, mutate: (doc: Doc<T>) => Doc<T>): Promise<Doc<T> | null>
  remove(id: string): Promise<void>
  listByPrefix<T>(prefix: string): Promise<Doc<T>[]>
  removeByPrefix(prefix: string): Promise<number>
}

export class StoreUnavailableError extends Error {}

/** Talks to Apache CouchDB over its HTTP API. */
class CouchStore implements DocStore {
  private readonly dbUrl: string
  private readonly authHeader: string | undefined
  private ready: Promise<void> | null = null

  constructor(serverUrl: string, dbName: string, user?: string, password?: string) {
    const url = new URL(serverUrl)
    const username = user ?? decodeURIComponent(url.username)
    const pass = password ?? decodeURIComponent(url.password)
    url.username = ''
    url.password = ''
    this.dbUrl = `${url.toString().replace(/\/$/, '')}/${encodeURIComponent(dbName)}`
    this.authHeader = username
      ? `Basic ${Buffer.from(`${username}:${pass}`).toString('base64')}`
      : undefined
  }

  private async request(pathname: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')
    if (this.authHeader) headers.set('Authorization', this.authHeader)
    try {
      return await fetch(`${this.dbUrl}${pathname}`, {
        ...init,
        headers,
        cache: 'no-store',
      })
    } catch (error) {
      throw new StoreUnavailableError(
        `CouchDB is unreachable: ${(error as Error).message}`,
      )
    }
  }

  private ensureDatabase() {
    this.ready ??= (async () => {
      const res = await this.request('', { method: 'PUT' })
      // 412 means the database already exists.
      if (!res.ok && res.status !== 412) {
        this.ready = null
        throw new StoreUnavailableError(
          `Could not create CouchDB database (${res.status})`,
        )
      }
    })()
    return this.ready
  }

  private docPath(id: string) {
    return `/${encodeURIComponent(id)}`
  }

  async get<T>(id: string) {
    await this.ensureDatabase()
    const res = await this.request(this.docPath(id))
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`CouchDB get failed (${res.status})`)
    return (await res.json()) as Doc<T>
  }

  async put<T>(doc: Doc<T>) {
    await this.ensureDatabase()
    let attempt = { ...doc }
    for (let tries = 0; tries < 3; tries++) {
      const res = await this.request(this.docPath(doc._id), {
        method: 'PUT',
        body: JSON.stringify(attempt),
      })
      if (res.ok) {
        const { rev } = (await res.json()) as { rev: string }
        return { ...attempt, _rev: rev }
      }
      if (res.status !== 409) throw new Error(`CouchDB put failed (${res.status})`)
      // Conflict: retry against the latest revision (last write wins per user doc).
      const latest = await this.get<T>(doc._id)
      // An update whose target was deleted concurrently must not resurrect it.
      if (doc._rev && !latest) throw new Error('CouchDB document was deleted concurrently')
      attempt = { ...doc, _rev: latest?._rev }
    }
    throw new Error('CouchDB put failed after retries')
  }

  async update<T>(id: string, mutate: (doc: Doc<T>) => Doc<T>) {
    await this.ensureDatabase()
    for (let tries = 0; tries < 5; tries++) {
      const current = await this.get<T>(id)
      if (!current) return null
      const next = { ...mutate(current), _id: id, _rev: current._rev }
      const res = await this.request(this.docPath(id), {
        method: 'PUT',
        body: JSON.stringify(next),
      })
      if (res.ok) {
        const { rev } = (await res.json()) as { rev: string }
        return { ...next, _rev: rev }
      }
      if (res.status !== 409) throw new Error(`CouchDB update failed (${res.status})`)
    }
    throw new Error('CouchDB update failed after retries')
  }

  async remove(id: string) {
    for (let tries = 0; tries < 5; tries++) {
      const existing = await this.get(id)
      if (!existing?._rev) return
      const res = await this.request(
        `${this.docPath(id)}?rev=${encodeURIComponent(existing._rev)}`,
        { method: 'DELETE' },
      )
      if (res.ok || res.status === 404) return
      // 409: a concurrent write bumped the revision; delete the newer one.
      if (res.status !== 409) throw new Error(`CouchDB delete failed (${res.status})`)
    }
    throw new Error('CouchDB delete failed after retries')
  }

  async listByPrefix<T>(prefix: string) {
    await this.ensureDatabase()
    const params = new URLSearchParams({
      startkey: JSON.stringify(prefix),
      endkey: JSON.stringify(`${prefix}\ufff0`),
      include_docs: 'true',
    })
    const res = await this.request(`/_all_docs?${params}`)
    if (!res.ok) throw new Error(`CouchDB list failed (${res.status})`)
    const body = (await res.json()) as { rows: { doc?: Doc<T> }[] }
    return body.rows.flatMap((row) => (row.doc ? [row.doc] : []))
  }

  async removeByPrefix(prefix: string) {
    const docs = await this.listByPrefix<Record<string, unknown>>(prefix)
    if (docs.length === 0) return 0
    const res = await this.request('/_bulk_docs', {
      method: 'POST',
      body: JSON.stringify({
        docs: docs.map((doc) => ({ _id: doc._id, _rev: doc._rev, _deleted: true })),
      }),
    })
    if (!res.ok) throw new Error(`CouchDB bulk delete failed (${res.status})`)
    return docs.length
  }
}

/**
 * JSON-file stand-in used only when COUCHDB_URL is not configured, so the
 * app still runs in environments without a CouchDB container (e.g. previews).
 */
class FileStore implements DocStore {
  private readonly filePath: string
  private docs: Map<string, Doc<Record<string, unknown>>>

  constructor(filePath: string) {
    this.filePath = filePath
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    this.docs = new Map()
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Doc<
        Record<string, unknown>
      >[]
      for (const doc of parsed) this.docs.set(doc._id, doc)
    }
  }

  private flush() {
    fs.writeFileSync(this.filePath, JSON.stringify([...this.docs.values()], null, 2))
  }

  async get<T>(id: string) {
    const doc = this.docs.get(id)
    return doc ? (structuredClone(doc) as Doc<T>) : null
  }

  async put<T>(doc: Doc<T>) {
    const current = this.docs.get(doc._id)
    const revNumber = current?._rev ? Number(current._rev.split('-')[0]) + 1 : 1
    const saved = { ...doc, _rev: `${revNumber}-local` }
    this.docs.set(doc._id, structuredClone(saved) as Doc<Record<string, unknown>>)
    this.flush()
    return saved
  }

  async update<T>(id: string, mutate: (doc: Doc<T>) => Doc<T>) {
    const current = await this.get<T>(id)
    if (!current) return null
    return this.put<T>({ ...mutate(current), _id: id })
  }

  async remove(id: string) {
    if (this.docs.delete(id)) this.flush()
  }

  async listByPrefix<T>(prefix: string) {
    return [...this.docs.values()]
      .filter((doc) => doc._id.startsWith(prefix))
      .sort((a, b) => a._id.localeCompare(b._id))
      .map((doc) => structuredClone(doc) as Doc<T>)
  }

  async removeByPrefix(prefix: string) {
    let removed = 0
    for (const id of [...this.docs.keys()]) {
      if (id.startsWith(prefix)) {
        this.docs.delete(id)
        removed++
      }
    }
    if (removed) this.flush()
    return removed
  }
}

const globalForStore = globalThis as unknown as { docStore?: DocStore }

function createStore(): DocStore {
  const couchUrl = process.env.COUCHDB_URL
  if (couchUrl) {
    return new CouchStore(
      couchUrl,
      process.env.COUCHDB_DB ?? 'challenge_tracker',
      process.env.COUCHDB_USER,
      process.env.COUCHDB_PASSWORD,
    )
  }
  console.warn(
    '[store] COUCHDB_URL is not set. Falling back to a local JSON file store (data/progress.json). Run `pnpm couch:up` and set COUCHDB_URL to use CouchDB.',
  )
  return new FileStore(path.join(process.cwd(), 'data', 'progress.json'))
}

export const store: DocStore = globalForStore.docStore ?? createStore()

if (process.env.NODE_ENV !== 'production') globalForStore.docStore = store

export const storeBackend = process.env.COUCHDB_URL ? 'couchdb' : 'file'
