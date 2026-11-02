import 'dotenv/config'
import { createInterface } from 'node:readline'
import { stdin, stdout } from 'node:process'
import bcrypt from 'bcryptjs'
import { pool, safeDatabaseErrorMessage } from '../config/db.js'

function readArgument(name) {
  const index = process.argv.indexOf(`--${name}`)
  return index < 0 ? '' : (process.argv[index + 1] || '').trim()
}

function askHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run this command in an interactive PowerShell terminal.'))
  }

  return new Promise((resolve, reject) => {
    let value = ''
    stdout.write(prompt)
    stdin.resume()
    stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    const cleanup = () => {
      stdin.removeListener('data', onData)
      stdin.setRawMode(false)
      stdout.write('\n')
    }
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup()
          reject(new Error('Administrator creation cancelled.'))
          return
        }
        if (character === '\r' || character === '\n') {
          cleanup()
          resolve(value)
          return
        }
        if (character === '\u007f' || character === '\b') {
          if (value.length) {
            value = value.slice(0, -1)
            stdout.write('\b \b')
          }
          continue
        }
        if (character >= ' ') {
          value += character
          stdout.write('*')
        }
      }
    }
    stdin.on('data', onData)
  })
}

async function createAdmin() {
  if (!pool) throw new Error('DATABASE_URL is required.')

  const name = readArgument('name')
  const email = readArgument('email').toLowerCase()
  if (name.length < 2 || name.length > 100) throw new Error('Provide --name with 2–100 characters.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Provide a valid --email address.')
  }

  const password = await askHidden('Administrator password (minimum 14 characters): ')
  const confirmation = await askHidden('Confirm password: ')
  if (password.length < 14 || password.length > 200) {
    throw new Error('Password must be between 14 and 200 characters.')
  }
  if (password !== confirmation) throw new Error('Passwords do not match.')

  const passwordHash = await bcrypt.hash(password, 12)
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, 'admin', TRUE)
     RETURNING id, name, email, role`,
    [name, email, passwordHash]
  )
  console.log(`Administrator created: ${rows[0].email} (id ${rows[0].id}).`)
}

try {
  await createAdmin()
} catch (error) {
  if (error.code === '23505') {
    console.error('An account already exists with that email address.')
  } else {
    console.error('Unable to create administrator:', safeDatabaseErrorMessage(error))
  }
  process.exitCode = 1
} finally {
  await pool?.end()
}
