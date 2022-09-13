---
title: Feeds five ways
description: A large, properly-formatted data file
tags:
  - astro
  - rss
  - atom
  - feed
  - meta
  - microformats
  - microdata
---

[Astro](https://astro.build/) comes with a built-in [RSS component](https://docs.astro.build/en/guides/rss/).
The starter theme for this blog originally used that, but I found it kind of limited.
I wanted my feeds to be full-text, and I also wanted an [Atom](https://en.wikipedia.org/wiki/Atom_(web_standard)) feed.

I went looking on NPM for something that could generate an Atom feed, and I found [jpmonette/feed](https://github.com/jpmonette/feed).
Since it can also generate RSS feeds, I decided it would be best for consistency's sake to settle on a single feed generator, and ditched Astro's RSS component altogether.

The code that creates the feed object lives in [`makeFeed.mjs`](https://github.com/jordemort/jordemort.github.io/blob/main/src/utils/makeFeed.mjs).
[`rss.xml.js`](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/rss.xml.js) and [`atom.xml.js`](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/atom.xml.js) call `makeFeed` and then generate output in the desired format.
The library I'm using also supports [JSON Feed](https://www.jsonfeed.org/); I've never used any software that cared about this format, but since I can generate it essentially for free, I do, in [`feed.json.js`](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/feed.json.js).
I've got links to all three of feeds embedded in my [`<head>`](https://github.com/jordemort/jordemort.github.io/blob/main/src/components/BaseHead.astro) element; there are also regular links to them at the top of the [blog index](/blog/).

I mentioned in the [previous post](/blog/kill-all-the-boilerplate/) that I wanted to add [microformats](http://microformats.org/)
The blog index is now marked up as an [h-feed](https://microformats.org/wiki/h-feed), and each entry is marked up as an [h-entry](https://microformats.org/wiki/h-entry).
This is accomplished by adding additional CSS classes to the existing HTML.
These classes are not intended for styling; instead, they indicate which elements should be parsed to generate a machine-readable representation of the content.

[Microdata](https://developer.mozilla.org/en-US/docs/Web/HTML/Microdata) is sort of like a more formal, corporate version of microformats.
Instead of using magic CSS class names, microdata is embedded using [`itemtype`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemtype) and [`itemprop`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemprop) attributes.
Microdata uses schemas defined by [Schema.org](https://schema.org/); there seem to be about a million of them, each with an extensive set of attributes that only an LDAP developer could love.
The blog index is marked up as a [Blog](https://schema.org/Blog) and each entry is marked up as a [BlogPosting](https://schema.org/BlogPosting).
Apparently [Gooblebot](https://developers.google.com/search/docs/advanced/crawling/googlebot) understands microdata, so hopefully this will help me out in the SEO department.

If you're interested, the relevant markup for the microformats and microdata used on this site can be seen in [`blog.astro`](https://github.com/jordemort/jordemort.github.io/blob/main/src/pages/blog.astro) (the blog index) and [`BlogPost.astro`](https://github.com/jordemort/jordemort.github.io/blob/main/src/layouts/BlogPost.astro) (the layout for blog posts).
So far I've just done a minimally viable implementation for both formats; I still need to mark up non-blog pages with the stuff, and make sure authorship is correctly specified everywhere for both formats.
I've also tweaked the site design and done a lot of fun and exiting things with the way Markdown gets rendered for this site, but that will have to wait for another blog post.
