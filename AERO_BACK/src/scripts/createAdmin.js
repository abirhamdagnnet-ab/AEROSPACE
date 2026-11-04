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

  
  const passwordHash = await bcrypt.hash(password, 12)

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Update the existing administrator (ID 2)
    const { rows } = await client.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           password_hash = $3,
           role = 'admin',
           must_change_password = FALSE
       WHERE id = 2
       RETURNING id, name, email, role`,
      [name, email, passwordHash]
    )

    if (rows.length === 0) {
      throw new Error('Administrator with ID 2 was not found.')
    }

    // Invalidate existing administrator sessions
    await client.query(
      'DELETE FROM admin_sessions WHERE user_id = $1',
      [rows[0].id]
    )

    await client.query('COMMIT')

    console.log(
      `Administrator updated successfully: ${rows[0].email}`
    )
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
