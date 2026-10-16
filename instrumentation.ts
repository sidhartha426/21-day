export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // The app stores and renders every timestamp in UTC. Pin the Node process to UTC so
    // any Date API that reads the local timezone behaves the same on every host.
    process.env.TZ = 'UTC'
    const { runAuthMigrations } = await import('./lib/migrate')
    await runAuthMigrations()
  }
}
