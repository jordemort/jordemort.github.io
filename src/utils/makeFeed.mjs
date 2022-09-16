import { Feed } from "feed";
import { getPosts } from "./getPosts";

export function makeFeed() {
  let posts = getPosts();

  if (posts.length > 10) {
    posts.length = 10;
  }

  let feed = new Feed({
    title: "Jordan Webb's blog",
    description: "Development notes and technical musings",
    id: import.meta.env.SITE,
    link: import.meta.env.SITE,
    hub: "https://pubsubhubbub.appspot.com/",
    language: "en",
    copyright: "2022 Jordan Webb",
    feedLinks: {
      atom: new URL("/atom.xml", import.meta.env.SITE).href,
      json: new URL("/feed.json", import.meta.env.SITE).href,
      rss: new URL("/rss.xml", import.meta.env.SITE).href,
    },
    author: {
      name: "Jordan Webb",
      email: "jordan@jordemort.dev",
      link: "https://jordemort.dev/"
    },
    image: "https://avatars.githubusercontent.com/jordemort"
  });

  for (const post of posts) {
    let url = new URL(post.url + "/", import.meta.env.SITE).href;
    let categories = post.frontmatter.tags ? post.frontmatter.tags.map((tag) => ({ name: tag, term: tag })) : [];

    categories.sort();

    feed.addItem({
      title: post.frontmatter.title,
      id: url,
      link: url,
      description: post.frontmatter.description,
      content: post.compiledContent(),
      published: new Date(post.frontmatter.pubDate),
      date: new Date(post.frontmatter.updatedDate || post.frontmatter.pubDate),
      category: categories
    });
  }

  return feed;
}
