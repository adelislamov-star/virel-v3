/**
 * audit-drive.ts
 * Read-only audit: checks Google Drive folders + Anthropic API
 * Does NOT create models, upload anything, or modify data
 * Run: npm run audit-drive
 */

import path from 'path'
const ROOT = path.resolve(__dirname, '..')
require('dotenv').config({ path: path.join(ROOT, '.env.drive') })
require('dotenv').config({ path: path.join(ROOT, '.env.production') })

import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'

// ─── 58 MODELS ───────────────────────────────────────────────────────────────
const MODEL_NAMES: string[] = [
  "Vega", "Zharra", "Derry", "Nahasia", "Ponita", "Vermonta",
  "Firmini", "Marsalina", "Gardenia", "Moire", "Nara", "Roderica",
  "Marzena", "Gamma", "Masyanna", "Pauletta", "Tetty", "Hanzelika",
  "Narzana", "Megrez", "Rahma", "Minilla", "Inciona", "Manori",
  "Copacabana", "Belva", "Milkyway", "Byrona", "Flokita", "Zambia",
  "Kameya", "Fenty", "Stimula", "Islay", "Generosa", "Triangle",
  "Kizomba", "Chasity", "Laonta", "Nitro", "Morava", "Dysis",
  "Rudolpha", "Trufana", "Erato", "Adjika", "Mikami", "Ferana",
  "Fadera", "Colenia", "Carmel", "Zion", "Juciara", "Kimberley",
  "Katarina", "Vaiga", "Culpa", "Adriana",
]

// ─── ПРЯМЫЕ ID ПАПОК (для тех, кто не находится поиском по имени) ────────────
const FOLDER_ID_OVERRIDES: Record<string, string> = {
  'Derry':     '1iOEvD1Qsu7qa2AF0qVX9XCiHyMj8TFHb',
  'Nahasia':   '1TKSrCBRnRQR9rEnpBTbDORv8vkaefDGv',
  'Ponita':    '1G6DbMSNZ_D_EOlNDHy0v4E4-0LK9I_qj',
  'Firmini':   '1YpNyhvjtlbw_O3jBiwai9u3dTM17dUPS',
  'Marsalina': '1rFaLtAk_-WEr_5mQx6oy7OaOvrWAwBia',
  'Gardenia':  '15PswusgKrpkGXYFYnS7RtpWJTf3YzYJb',
  'Roderica':  '1rbsdLU4EQxxFYOl1GG9OeAr28fGba2BC',
  'Marzena':   '1sChAaT14Yf6YwnyNy_yLHibk_poVLEJH',
  'Tetty':     '1KvxvPPHwexxVj5DirkquCZ3WMvVblNhX',
  'Hanzelika': '1lquB5gdLdNS7n4nQmc3bKllihX6mTK_c',
  'Narzana':   '1P5KiP4jZyOde2Wbb8dc5LbCcSeW15scX',
  'Minilla':   '1cRJaoSh57_ydsEQOh4B7JU9GvLgp-oNz',
  'Milkyway':  '1vxSqlrXK4SZLj5ZVPA61jD0oidUop4vz',
  'Zambia':    '1fUtlXLdLFsn6YOw4gKLFLeTUeX5qdx1b',
  'Fenty':     '1uxCVU-vWFriVPBGSENlDhL6EmiUDzC31',
  'Kizomba':   '1n57XYrjpL3SwmuMD-ojFXieo7W5pP22i',
  'Nitro':     '1XgvKG-CKE5tf7YD1vCzEC3irUofqM8yb',
  'Dysis':     '1AZZq3TL5ZVJi3KmbcS7eYW6jJzpJ_KNf',
  'Rudolpha':  '12PydqdRaMriFwxnmko87i6AvVEkQiqqR',
  'Mikami':    '1knvObC6c3gabQuol2YjPbWBnFWXPVyIB',
  'Carmel':    '1qg3cp4FIt5t0ky0WLJBNNy03zihfnu-3',
  'Juciara':   '1YMOouDv35jojmlWD38PdxKA9gzJ5MIA2',
  'Katarina':  '1AEhvEoRKogTWX8cwWktSRs9guNDjcsbG',
  'Vaiga':     '1_YpDu_2HzWCrk3dfpFZyBazyRDea299a',
  'Culpa':     '1s1UlskbBdYcCcl9u99Jr3-ekq7qWTwh5',
  'Vermonta':  '1cmm41Wk32DQHg3e7PRUw5-ebqsumeWAJ',
  'Kameya':    '1AHsoTjCxrELvzkkqqz0cFtUF5aT5YS4G',
  'Manori':    '1wm7wV3qaGZiDS7IjVLnmyn9GqAiEPKWb',
  'Generosa':  '1KIvC3rmdf7rdck5vMqkctVmLy5Daz1zy',
  'Trufana':   '12zcvlcF7UerLGSYrtFT1eWjmbnhvMGTK',
  'Adriana':   '1EwzSSAYtGzzaZFBjnQHJnar9BKAypBLk',
}

interface AuditResult {
  name: string
  found: boolean
  photos: number
  videos: number
  hasAnketa: boolean
  ambiguous?: number
}

async function main() {
  // ─── 1. Check Anthropic API ──────────────────────────────────────────────
  console.log('═'.repeat(55))
  console.log('AUDIT — Google Drive + Anthropic API')
  console.log('═'.repeat(55))

  let anthropicOk = false
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.log('\n[ANTHROPIC] ❌ ANTHROPIC_API_KEY not set')
  } else {
    try {
      const client = new Anthropic({ apiKey })
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Say OK' }],
      })
      const text = res.content[0].type === 'text' ? res.content[0].text : ''
      console.log(`\n[ANTHROPIC] ✅ API works (response: "${text.trim()}")`)
      anthropicOk = true
    } catch (e: any) {
      console.log(`\n[ANTHROPIC] ❌ API error: ${e.message}`)
    }
  }

  // ─── 2. Google Drive auth ────────────────────────────────────────────────
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!saJson) {
    console.log('\n[DRIVE] ❌ GOOGLE_SERVICE_ACCOUNT_JSON not set in .env.drive')
    console.log('Cannot audit Drive folders without credentials.\n')
    printReport([], anthropicOk)
    return
  }

  const SA_JSON = JSON.parse(saJson)
  const driveAuth = new google.auth.GoogleAuth({
    credentials: SA_JSON,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth: driveAuth })
  console.log('[DRIVE] ✅ Authenticated\n')

  // ─── 3. Scan each model folder ──────────────────────────────────────────
  const results: AuditResult[] = []

  for (const modelName of MODEL_NAMES) {
    process.stdout.write(`[${modelName.padEnd(15)}] `)

    try {
      // Find folder — сначала override, потом поиск по имени
      let folderId: string
      if (FOLDER_ID_OVERRIDES[modelName]) {
        folderId = FOLDER_ID_OVERRIDES[modelName]
        process.stdout.write('(override) ')
      } else {
        const search = await drive.files.list({
          q: `name = '${modelName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        })
        const folders = search.data.files || []

        if (folders.length === 0) {
          console.log('❌ not found')
          results.push({ name: modelName, found: false, photos: 0, videos: 0, hasAnketa: false })
          continue
        }

        if (folders.length > 1) {
          console.log(`⚠ ambiguous (${folders.length} folders)`)
          results.push({ name: modelName, found: true, photos: 0, videos: 0, hasAnketa: false, ambiguous: folders.length })
          continue
        }

        folderId = folders[0].id!
      }

      // List contents
      const list = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 200,
      })
      const files = list.data.files || []
      const photos = files.filter(f => f.mimeType?.startsWith('image/')).length
      const videos = files.filter(f => f.mimeType?.startsWith('video/')).length
      const hasAnketa = files.some(f => f.mimeType === 'application/vnd.google-apps.document')

      console.log(`✅ ${photos} photos, ${videos} videos${hasAnketa ? ', anketa ✓' : ', ⚠ NO anketa'}`)
      results.push({ name: modelName, found: true, photos, videos, hasAnketa })

    } catch (e: any) {
      console.log(`❌ error: ${e.message}`)
      results.push({ name: modelName, found: false, photos: 0, videos: 0, hasAnketa: false })
    }
  }

  printReport(results, anthropicOk)
}

function printReport(results: AuditResult[], anthropicOk: boolean) {
  const found = results.filter(r => r.found)
  const notFound = results.filter(r => !r.found)
  const noAnketa = results.filter(r => r.found && !r.hasAnketa)
  const ambiguous = results.filter(r => r.ambiguous)
  const totalPhotos = results.reduce((s, r) => s + r.photos, 0)
  const totalVideos = results.reduce((s, r) => s + r.videos, 0)

  console.log('\n' + '═'.repeat(55))
  console.log('AUDIT REPORT')
  console.log('═'.repeat(55))
  console.log(`Total models:       ${MODEL_NAMES.length}`)
  console.log(`Folders found:      ${found.length} / ${MODEL_NAMES.length}`)
  console.log(`Folders NOT found:  ${notFound.length}`)
  if (ambiguous.length > 0) {
    console.log(`Ambiguous:          ${ambiguous.length}`)
  }
  console.log(`Total photos:       ${totalPhotos}`)
  console.log(`Total videos:       ${totalVideos}`)
  console.log(`Missing anketa:     ${noAnketa.length}`)
  console.log(`Anthropic API:      ${anthropicOk ? '✅ working' : '❌ not working'}`)

  if (notFound.length > 0) {
    console.log(`\n── Not found (${notFound.length}): ──`)
    notFound.forEach(r => console.log(`  - ${r.name}`))
  }

  if (noAnketa.length > 0) {
    console.log(`\n── No anketa (${noAnketa.length}): ──`)
    noAnketa.forEach(r => console.log(`  - ${r.name}`))
  }

  console.log('\n' + '═'.repeat(55))
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
