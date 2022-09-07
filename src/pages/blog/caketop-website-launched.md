---
title: "Caketop website launched"
description: "There's finally something at caketop.app"
---

Caketop finally has a [website](https://caketop.app/).

Like this site, it is hosted on [GitHub Pages](https://pages.github.com/) and built with [Astro](https://astro.build/).
I still don't 100% know what I'm doing with Astro, but I've found it to be the least confusing among the various "modern" static site generators I've tried.

This time, I used [mhyfritz/astro-landing-page](https://github.com/mhyfritz/astro-landing-page) as a starting point.
I think I did a pretty good job hacking it up.

I'm using [Formspark](https://formspark.io/) and [Botpoison](https://botpoison.com/) for the contact form.
This is probably the best way to get my attention right now.
Submissions go to a channel on Caketop's Slack.
Hopefully the signal-to-noise ratio ends up being pretty good.

Normally I would prefer to do analytics based on web server logs, but since I'm not hosting these myself, I had to pick something with a JavaScript tracker.
I decided to spin up a self-hosted instance of [Plausible Analytics](https://plausible.io/).
It seems pretty nice, and it was very easy to set up.
