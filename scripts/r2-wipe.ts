import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.drive' })

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function main() {
  let deleted = 0
  let token: string | undefined
  do {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      Prefix: 'models/',
      ContinuationToken: token,
    }))
    const objects = list.Contents || []
    if (objects.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Delete: { Objects: objects.map(o => ({ Key: o.Key! })) },
      }))
      deleted += objects.length
      console.log(`Deleted ${deleted} files...`)
    }
    token = list.NextContinuationToken
  } while (token)
  console.log(`\n✅ R2 clean. Total deleted: ${deleted}`)
}

main().catch(e => { console.error(e); process.exit(1) })
