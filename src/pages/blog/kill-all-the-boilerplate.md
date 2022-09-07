---
title: Kill all the boilerplate
description: In which I cater to my own laziness
---

For this site, I started with [Astro](https://astro.build/)'s example [blog template](https://github.com/withastro/astro/tree/main/examples/blog).
It's very simple, which pleases me.
If there's going to be fancy stuff on my personal site, I'd like it to be my own fancy stuff.

I am mostly happy with it, but I found the matter of frontmatter to be irritating.
Out of the box, this template requires `pubDate` (and optionally `updatedDate`) to be specified in the header of each and every blog post.
This is bothersome for a couple reasons.

- Typing dates is annoying, and if I have to do it by hand, most likely I'm going to half-ass it and not even bother to get the time or the timezone right, which leads to imprecise dates in the RSS feed.
- The git repository that this blog lives already contains information about when a particular file was created or updated. Why am I doing the computer's job?

At the suggestion of, and with a fair bit of debugging help from [@BryceRussell](https://github.com/BryceRussell), I was able to solve this by writing a [Remark plugin](https://github.com/jordemort/jordemort.github.io/blob/main/src/plugins/repodates.mjs).
I initially dismissed this approach, because I wanted a solution that would work for any page in site, and Remark plugins only come into play when Markdown is being rendered.
After some consideration, though, I realized that I basically never want to author content in anything but Markdown; I even hacked up this theme to use Markdown for the index page.

The plugin executes a couple of fancy git commands that I got off of Stack Overflow to figure out when a page was created, and when it was last changed.
It then injects those values into the page's frontmatter, if they aren't already present.
This approach still allows me to specify `pubDate` and `updatedDate` for a particular post by hand, if I ever wanted to do that.

To make this all run smoothly, I had to tweak a couple things about the [GitHub Actions Workflow](https://github.com/jordemort/jordemort.github.io/blob/main/.github/workflows/deploy.yml) that deploys this site:

- I set `fetch-depth` to `0` on `actions/checkout` so that the entire history of the repo would be available for date calculations.
- I set the `TZ` environment variable to `America/Chicago`, so that dates are formatted in my preferred timezone.

In addition to `pubDate`, the template for this site originally required that each page specify a `layout` (well, it doesn't actually _require_ this, but if you left it out, you'd just get bare rendered Markdown with no header or navigation or footer.)
This is less annoying than having to type out dates, but realistically, how many distinct layouts am I ever going to want on this site?
It just ends up being another thing to forget and then be annoyed about forgetting.
To free myself from this chore, I wrote [another Remark plugin](https://github.com/jordemort/jordemort.github.io/blob/main/src/plugins/defaultlayout.mjs).
If no `layout` is specified, it uses my [blog post layout](https://github.com/jordemort/jordemort.github.io/blob/main/src/layouts/BlogPost.astro).
In this case, only operating on Markdown is a plus; I wouldn't want to automatically inject a layout on any other type of page.

I'm pretty happy with how this site is progressing, but there are still a few more things I'd like to do:

- [Microformats!](http://microformats.org/) I will probably crib off of [Gumori](https://github.com/importantimport/gumori) for this.
- Some sort of client-size search; I will probably use either [jackcarey/astro-lunr](https://github.com/jackcarey/astro-lunr) or [LyraSearch/plugin-astro](https://github.com/LyraSearch/plugin-astro) for this.
- Maybe spiff up the template just a little bit more?
- Being able to tag posts with topics could be nice, and perhaps also beneficial from a SEO perspective.
