export interface Post {
  frontmatter: {
    title: string
    description?: string
    unlisted?: boolean
    pubDate: string
    updatedDate?: string
    tags?: string[]
    source: string
  }

  url: string

  compiledContent: () => string
}

export function getAllPosts(): Post[] {
  return (Object.values(
    import.meta.glob('/src/pages/blog/**/*.{md,mdx}',
    {eager: true})
  ) as Post[]).sort((a, b) =>
    new Date(b.frontmatter.pubDate).valueOf() - new Date(a.frontmatter.pubDate).valueOf()
  );
}

export function getPosts(): Post[] {
  return getAllPosts().filter((post) => !post.frontmatter.unlisted);
}
