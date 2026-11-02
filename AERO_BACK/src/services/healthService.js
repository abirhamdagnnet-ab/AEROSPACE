export function createHealthService(database) {
  return {
    async check() {
      await database.query('SELECT 1')
      return { status: 'ok' }
    },
  }
}
