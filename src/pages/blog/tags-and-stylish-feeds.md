---
title: Tags & stylish feeds
description: Some small quality-of-life improvements
tags:
  - astro
  - jordemort.dev
  - tags
  - atom
  - rss
  - feed
  - xml
  - xslt
---

I've added a couple small things since I last posted here:

## Tags

Finally!
These were in my frontmatter from almost the beginning, but now I am actually rendering them.
There wasn't much to actually implementing them, it was just a matter of getting around to adding code to the [blog index](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/blog.astro) and the [blog post template](https://github.com/jordemort/jordemort.github.io/blob/main/src/layouts/BlogPost.astro) to render them.
Each tag is marked up as a [p-category](https://indieweb.org/tags) for the IndieWeb folks in the house.
I also created a [tag index](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/tags/index.astro), which links to [pages I generate for each tag](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/tags/%5B...tag%5D.astro).
The tags are now also included in the [feeds](https://github.com/jordemort/jordemort.github.io/blob/main/src/utils/makeFeed.ts).

## XSLT stylesheet for feeds

I added an [XSL stylesheet](https://github.com/jordemort/jordemort.github.io/blob/main/public/feed.xsl) to the [Atom](/atom.xml) and [RSS](/rss.xml) feeds.
This was partially inspired by today's [Feedburner outage](https://news.ycombinator.com/item?id=32876954).
The stylesheet transforms the feed XML into HTML that your browser can display.
I started out using [Pretty Feed](https://github.com/genmon/aboutfeeds/blob/main/tools/pretty-feed-v3.xsl), but I felt like the amount of CSS it used was excessive, and it didn't work with my Atom feed, so I wrote my own stylesheet from scratch.
I still included the explanatory text and the link to [About Feeds](https://aboutfeeds.com/) from Pretty Feed, though, so that those who are uninitiated into the world of RSS might discover its joys.
My stylesheet works with both RSS and Atom feeds and should be pretty generic; feel free to take it and run with it if you have need of such a thing.
