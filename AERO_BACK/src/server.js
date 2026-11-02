import 'dotenv/config'
import app from './app.js'
import { connectDB, pool, safeDatabaseErrorMessage } from './config/db.js'
import { validateEnvironment } from './config/env.js'

try {
  const { port } = validateEnvironment()
  await connectDB()
  app.listen(port, '0.0.0.0', () => {
    console.log(JSON.stringify({ level: 'info', event: 'api_listening', port }))
  })
} catch (error) {
  console.error(JSON.stringify({
    level: 'error',
    event: 'api_start_failed',
    code: error.code || 'STARTUP_ERROR',
    message: safeDatabaseErrorMessage(error),
  }))
  await pool?.end()
  process.exit(1)
}
