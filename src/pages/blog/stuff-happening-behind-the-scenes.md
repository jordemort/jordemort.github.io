---
title: Stuff happening behind the scenes
description: There is a lot of yak hair this site's plumbing
tags:
  - jordemort.dev
  - oembed
  - embedall
  - activitypub
  - mastodon
  - fediverse
---

[WeblogPoMo 2024](https://weblog.anniegreens.lol/weblog-posting-month-2024) has been a success in getting me interested in this blog again.
Unfortunately, so far, that's resulted in a whole lot of coding, and very little actual blogging!
Way back in August of 2022, when I created this site, I wanted it to be a bit of an exercise in getting out of my comfort zone, and demonstrating that I could write TypeScript and do some frontend stuff.
To that end, I picked a fun framework called [Astro](https://astro.build/) instead of more hacker-ish static site generator like Hugo or Jekyll.

Astro is great, and I still like it, but back when I started this blog it was version 1.x, and as of this writing, the latest version is 4.x.
Dependencies move pretty fast in the JavaScript world, and I had not been keeping up at all, with the result that the code that generates this site has become a bit of a bit-rotted mess.
When I first got the notion to write something for WeblogPoMo, it actually took me several hours to get the site in a state where it could even build again.

I've been working on giving everything a fresh coat of paint and getting it all working with the latest-and-greatest, but I've ended up in a very deep yak shave, doing a bunch of late-night coding, and while this is fun, it leaves me with NoPo for the PoMo!
So, here's an intermediate update on what's happened so far and what I'm still working on.

## Moved from GitHub Pages to self hosting

Instead of serving this blog from GitHub Pages, I'm now hosting it on my own server.
Initially, I did this because I could get the blog to build locally, but not with GitHub Actions :smile: -- the quickest way for me to get a post out for WeblogPoMo was to switch the DNS for jordemort.dev and point it at a server where I could deploy my locally-built copy.
I had been playing with the idea of doing this for a while, and not being able to get my build going in Actions provided the kick in the ass I needed.

Moving to self-hosting has a few upsides:

- GitHub doesn't need to know what you're reading on my blog
- I can get actual server logs, instead of just client-side analytics
- I can pick off certain URLs and do things other than serve static content with them

Speaking of picking off certain URLs...

## ActivityPub integration

This blog is now an [ActivityPub actor](/blog/lwn-microblogging-with-activitypub/).
This means that you can now follow this blog with Mastodon or your local moral equivalent at the following address:

`@jordemort.dev@jordemort.dev`

This is powered by a neat thing called [Hatsu](https://github.com/importantimport/hatsu) that consumes [my JSON feed](/json.feed) and turns it into ActivityPub activities.
You can [play with the API](https://hatsu.jordemort.dev/swagger-ui/) if you'd like!

I haven't quite finished setting this up; there's some `<link>` tags I need to generate in my page headers for complete integration, but following the blog works!

## Coming soon: PageFind

Implementing my own [client-side search](/blog/client-side-search/) was fun, but the libraries I built it on were already unmaintained when I built it, and [PageFind](https://pagefind.app/) is a much better and more complete implementation of the same idea that I won't have to maintain myself.

## Coming soon: better embeds

This is the big yak.
I've been using [remark-plugin-oembed](https://github.com/jodyheavener/remark-plugin-oembed) to render embedded versions of things like YouTube videos and tweets on this site.
It was kind of broken by upgrading other things, so I decided to build my own replacement.

I've never really loved how [oEmbed](https://oembed.com/) works; most providers give you some perfunctory metadata, and then a chunk of HTML that you're supposed to just include in your page.
Generally, the HTML that you're given contains an [`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe), that loads an "embedded" view of the link from the site that you're linking to.
Twitter's oEmbed HTML gives you a [`<blockquote>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote) instead, along with a [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) that styles the blockquote, loads any photos or videos, and does who knows what else.

I *hate* this.
I hate blindly including HTML on my site that I did not write or generate myself.
I hate making your browser communicate with a third-party that you did not consent to communicate with, simply because you viewed a page on my site with an embedded link.
I hate running random third-party scripts in the context of my site, which are probably collecting and all sorts of analytics that neither you nor I consented to.
I hate everything about it.

So instead, what I'm working on right now is gluing together oEmbed, [Metascraper](https://www.npmjs.com/package/metascraper), and [FxTwitter](https://github.com/FixTweet/FxTwitter), into something that generates embeds that look like this:

![A screenshot of an embedded YouTube video](/images/embedall-demo.png "A screenshot of an embedded YouTube video")

Some points to note:

- No more third-party styling; all embeds will be styled consistently with the rest of the site
- No more third-party assets; everything needed to display the embedded will be served from `jordemort.dev`.
- No more third-party players; instead, standard HTML [`<audio>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio) and [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) elements will be used.
  - If you play audio or video, it will still be loaded from the third-party server, but preloading will be turned off, so nothing will be loaded until you specifically ask your browser to do so.
- No more rot; all the data needed to regenerate an embed will be cached in the site's repository after the first time it is generated.
  - I'm thinking about also automatically submitting anything I embed to the [Wayback Machine](https://web.archive.org/) and/or [archive.today](https://archive.today).
- A button to go ahead and load the third-party embed anyway, if you still really want to do that for some reason :stuck_out_tongue_winking_eye:

Anyway, all of that probably needs another night or two to finish up, which is what I've been saying for the past three days or so, but I just keep on having more ideas on how to make them even *better*, so...
you know how it is.
