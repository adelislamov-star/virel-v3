const { Client } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function main() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  // Узнаём реальное название колонки
  const colRes = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' ORDER BY ordinal_position
  `)
  console.log('Columns in users table:', colRes.rows.map(r => r.column_name).join(', '))

  const password = process.env.ADMIN_PASSWORD || 'virel2026'
  const email = process.env.ADMIN_EMAIL || 'admin@virel.com'
  const hash = await bcrypt.hash(password, 12)

  // Определяем колонку для пароля
  const cols = colRes.rows.map(r => r.column_name)
  const passCol = cols.find(c => c.toLowerCase().includes('password')) || 'passwordHash'
  console.log('Using password column:', passCol)

  const userRes = await client.query(`
    INSERT INTO users (id, email, name, "${passCol}", status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, 'Admin', $2, 'active', now(), now())
    ON CONFLICT (email) DO UPDATE SET "${passCol}" = $2, "updatedAt" = now()
    RETURNING id, email
  `, [email, hash])

  const userId = userRes.rows[0].id
  console.log('✅ User:', userRes.rows[0].email)

  // Role
  const roleRes = await client.query(`
    INSERT INTO roles (id, code, name)
    VALUES (gen_random_uuid(), 'OWNER', 'Owner')
    ON CONFLICT (code) DO UPDATE SET name = 'Owner'
    RETURNING id
  `)
  const roleId = roleRes.rows[0].id

  // UserRole — проверяем названия колонок
  const urCols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'user_roles'
  `)
  console.log('user_roles columns:', urCols.rows.map(r => r.column_name).join(', '))

  const urColNames = urCols.rows.map(r => r.column_name)
  const userIdCol = urColNames.find(c => c.toLowerCase().includes('user')) || 'userId'
  const roleIdCol = urColNames.find(c => c.toLowerCase().includes('role')) || 'roleId'

  await client.query(`
    INSERT INTO user_roles ("${userIdCol}", "${roleIdCol}")
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [userId, roleId])

  console.log('✅ Role assigned: OWNER')
  console.log(`\n🔑 Login: ${email} / ${password}`)
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
