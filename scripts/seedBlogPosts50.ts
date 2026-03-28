import { PrismaClient } from '@prisma/client'
import { posts as posts1 } from './blog-content-1'
import { posts as posts2 } from './blog-content-2'
import { posts as posts3 } from './blog-content-3'
import { posts as posts4 } from './blog-content-4'
import { posts as posts5 } from './blog-content-5'

const prisma = new PrismaClient()
const allPosts = [...posts1, ...posts2, ...posts3, ...posts4, ...posts5]

async function main() {
  let added = 0
  for (const post of allPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    })
    added++
    console.log(`${added}/${allPosts.length}: ${post.slug}`)
  }
  console.log('✅ Done:', added, 'posts imported')
}

main().catch(console.error).finally(() => prisma.$disconnect())
