const { Client } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const password = process.env.ADMIN_PASSWORD || 'virel2026'
  const email = process.env.ADMIN_EMAIL || 'admin@virel.com'
  const hash = await bcrypt.hash(password, 12)

  // Upsert user
  const userRes = await client.query(`
    INSERT INTO users (id, email, name, password_hash, status, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, 'Admin', $2, 'active', now(), now())
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, updated_at = now()
    RETURNING id, email
  `, [email, hash])

  const userId = userRes.rows[0].id
  console.log('✅ User:', userRes.rows[0].email)

  // Upsert role
  const roleRes = await client.query(`
    INSERT INTO roles (id, code, name)
    VALUES (gen_random_uuid(), 'OWNER', 'Owner')
    ON CONFLICT (code) DO UPDATE SET name = 'Owner'
    RETURNING id
  `)
  const roleId = roleRes.rows[0].id

  // Assign role
  await client.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [userId, roleId])

  console.log('✅ Role assigned: OWNER')
  console.log(`\n🔑 Login: ${email} / ${password}`)
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
