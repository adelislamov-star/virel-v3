// Seed script — run: npx tsx src/scripts/seedBlogPosts.ts

import { PrismaClient } from '@prisma/client';
import { blogPosts } from '../../data/blog-posts';
import { blogContent } from '../../data/blog-content';

const prisma = new PrismaClient();

function sectionsToHtml(sections: { heading?: string; body: string[] }[]): string {
  return sections
    .map(
      (s) =>
        (s.heading ? `<h2>${s.heading}</h2>` : '') +
        s.body.map((p) => `<p>${p}</p>`).join(''),
    )
    .join('');
}

async function main() {
  console.log(`Seeding ${blogPosts.length} blog posts...`);

  for (const post of blogPosts) {
    const html = blogContent[post.slug] ?? sectionsToHtml(post.content);

    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.description,
        content: html,
        category: post.category,
        publishedAt: new Date(post.publishedAt),
        isPublished: true,
        authorName: 'Vaurel',
      },
      update: {
        title: post.title,
        excerpt: post.description,
        content: html,
        category: post.category,
        publishedAt: new Date(post.publishedAt),
        isPublished: true,
        authorName: 'Vaurel',
      },
    });

    console.log(`  ✓ ${post.slug}`);
  }

  console.log('Done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
