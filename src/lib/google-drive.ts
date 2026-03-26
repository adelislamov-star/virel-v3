// Google Drive client for Virel Drive Import
// Uses Service Account authentication — no OAuth required

import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

// Sub-folder names to ignore (пересечка / overlap)
const IGNORED_FOLDER_PATTERNS = [
  'пересечк', 'peresechk', 'overlap', 'intersection', 'crossing',
]

function isIgnoredFolder(name: string): boolean {
  const lower = name.toLowerCase()
  return IGNORED_FOLDER_PATTERNS.some(p => lower.includes(p))
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set')
  const credentials = JSON.parse(raw)
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
}

function getDrive() {
  const auth = getAuth()
  return google.drive({ version: 'v3', auth })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
}

export interface DriveFolderContents {
  folderId: string
  folderName: string
  photos: DriveFile[]
  videos: DriveFile[]
  questionnaire: DriveFile | null  // Google Doc
  ignoredFolders: string[]
}

export type DriveScanResult =
  | { status: 'found'; contents: DriveFolderContents }
  | { status: 'notFound' }
  | { status: 'ambiguous'; folders: { id: string; name: string }[] }
  | { status: 'error'; message: string }

// ─── Search folder by exact name ──────────────────────────────────────────────

export async function findModelFolder(name: string): Promise<DriveScanResult> {
  try {
    const drive = getDrive()

    // Escape single quotes in name for Drive query
    const escapedName = name.replace(/'/g, "\\'")

    const res = await drive.files.list({
      q: `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 10,
    })

    const folders = res.data.files || []

    if (folders.length === 0) return { status: 'notFound' }
    if (folders.length > 1) {
      return {
        status: 'ambiguous',
        folders: folders.map(f => ({ id: f.id!, name: f.name! })),
      }
    }

    // Exactly one folder found — read its contents
    const folder = folders[0]
    const contents = await readFolderContents(folder.id!, folder.name!)
    return { status: 'found', contents }
  } catch (e: any) {
    return { status: 'error', message: e.message }
  }
}

// ─── Read folder contents ─────────────────────────────────────────────────────

async function readFolderContents(folderId: string, folderName: string): Promise<DriveFolderContents> {
  const drive = getDrive()

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
    pageSize: 100,
  })

  const files = res.data.files || []

  const photos: DriveFile[] = []
  const videos: DriveFile[] = []
  let questionnaire: DriveFile | null = null
  const ignoredFolders: string[] = []

  for (const f of files) {
    const mime = f.mimeType || ''
    const name = f.name || ''

    // Sub-folder check
    if (mime === 'application/vnd.google-apps.folder') {
      if (isIgnoredFolder(name)) {
        ignoredFolders.push(name)
      }
      // Skip all sub-folders (including non-ignored ones)
      continue
    }

    // Google Doc = questionnaire (take the first one found)
    if (mime === 'application/vnd.google-apps.document') {
      if (!questionnaire) {
        questionnaire = { id: f.id!, name, mimeType: mime }
      }
      continue
    }

    // Photos
    if (mime.startsWith('image/')) {
      photos.push({ id: f.id!, name, mimeType: mime, size: Number(f.size) || 0 })
      continue
    }

    // Videos
    if (mime.startsWith('video/')) {
      videos.push({ id: f.id!, name, mimeType: mime, size: Number(f.size) || 0 })
      continue
    }
  }

  return { folderId, folderName, photos, videos, questionnaire, ignoredFolders }
}

// ─── Download file as Buffer ───────────────────────────────────────────────────

export async function downloadFile(fileId: string, mimeType: string): Promise<Buffer> {
  const drive = getDrive()

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )

  return Buffer.from(res.data as ArrayBuffer)
}

// ─── Export Google Doc as plain text ──────────────────────────────────────────

export async function exportDocAsText(fileId: string): Promise<string> {
  const drive = getDrive()

  const res = await drive.files.export(
    { fileId, mimeType: 'text/plain' },
    { responseType: 'arraybuffer' }
  )

  return Buffer.from(res.data as ArrayBuffer).toString('utf-8')
}
