// Everything in the app is UTC; pin the server process (and its workers) to UTC.
process.env.TZ = 'UTC'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set by the Dockerfile so self-hosted images ship a minimal standalone server.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // Native module and font-data dependencies must stay unbundled on the server.
  serverExternalPackages: ['better-sqlite3', 'pdfkit', 'nodemailer'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), publickey-credentials-get=(self), publickey-credentials-create=(self)',
          },
        ],
      },
    ]
  },
}

export default nextConfig
