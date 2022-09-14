---
title: Webmentions, pingbacks, and more
description: Making some noise
tags:
  - jordemort.dev
  - webmention
  - pingback
  - microformats
  - websub
  - indieweb
  - go-jamming
  - pushl
  - webhookd
---

In order to receive my [IndieWeb](https://indieweb.org/) merit badge[^1], I've implemented incoming and outgoing [webmentions](https://www.w3.org/TR/webmention/) (and incoming [pingbacks](https://en.wikipedia.org/wiki/Pingback)) to this site.
These are standards that allow an owner of a website to be alerted when another website links to one of their pages.
Many blogs use webmentions as a sort of distributed commenting system.

[^1]: Not a real thing (as far as I know)

## Preparing

Before I could implement webmentions, I needed to get my indieweb [authorship](https://indieweb.org/authorship) situation sorted out.
I already [added h-feed and h-entry markup](/blog/feeds-five-ways/) to the site, but I also needed an [h-card](https://microformats.org/wiki/h-card).
I restructured my HTML a bit, and now the [page header](https://github.com/jordemort/jordemort.github.io/blob/main/src/components/Header.astro) provides authorship information for my feed and each of my posts.

## Receiving

To receive the mentions, I set up an instance of [go-jamming](https://git.brainbaking.com/wgroeneveld/go-jamming) on one of my servers.
I considered using [webmention.io](https://webmention.io/), but farming things out to a third party didn't seem very indie.
It seems mostly reasonable, but there are a couple things I don't like about it:

- It requires an authentication token to retrieve mentions, which is the same token that is used to moderate mentions &mdash; this means that if I wanted to add a client-side script to display mentions, I would have to proxy things somehow to avoid leaking the token to anyone who cared to view my script's source code.
- It can only send notifications of new mentions to an SMTP server listening on 127.0.0.1:25, and heartbreakingly, the SMTP client that uses appears to be incompatible with [mailrise](https://github.com/YoRyan/mailrise)'s SMTP server.

I might try hacking on it a bit.
At the very least, it should be easy to replace the SMTP client with [shoutrr](https://github.com/containrrr/shoutrrr) so I can plug it into something other than email more easily.

Once I had it running, hooking it into the site was a simple matter of adding these tags to the `<head>`:

```html
<link rel="webmention" href="https://ping.jordemort.dev/webmention" />
<link rel="pingback" href="https://ping.jordemort.dev/pingback" />
```

I have not yet implemented anything to display incoming mentions, partially because go-jamming's token handling makes it inconvenient, and partially because I don't have any incoming mentions yet.
I may never implement it, and just enjoy it as a mechanism that lets me know when other people have linked to me.
I wasn't even sure I wanted a blog; I'm still pretty sure I don't want a comments section.

## Sending

[Pushl](https://github.com/PlaidWeb/Pushl) handles outgoing webmentions and pings to [Google's PubSubHubbub hub](https://pubsubhubbub.appspot.com/) whenever I publish a new post.
[WebSub](https://www.w3.org/TR/websub/) (which is the new, less silly name for PubSubHubbub) is a protocol that people can use to receive real-time updates to RSS feeds.
I picked Google's hub in the hope that it is more likely that more people or at least Googlebot will be able to find my stuff there.

Pushl is cool because it just takes the site's RSS feed as its input and uses a cache to keep track of links that it's seen before.
I could completely switch out how this site is built and published it wouldn't care.
Loose coupling is my favorite kind of coupling.

Since this site is built using GitHub Actions, I initially toyed with the idea of running Pushl there as well.
That left me with the problem of figuring out where to store Pushl's cache, though.
I could store the cache in a branch of the repository and push changes to it every run, but storing stuff that isn't text in git repo feels gross to me.
Actions has a cache but I don't particularly trust it to be durable.
Both of those approaches also felt like they would increase this site's GitHub lock-in factor.

Instead, I decided to run Pushl on my server.
I could have easily set up a cron job to run it every 10 minutes or so, and that definitely would have been Good Enough.
I wanted things to go out instantly, though, so I set up an instance of [webhookd](https://github.com/ncarlier/webhookd) on my server as well.

First, I created an `.htpasswd` file to keep just anybody from calling my scripts; webhookd will look for a `.htpasswd` in the current working directory, so run this in the same place you intend to run webhookd from:

```
$ htpasswd -B -c .htpasswd api
New password:
Re-type new password:
Adding password for user api
```

I then added the username and password I created to my repository's [secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

After that, I wrote a small shell script to run Pushl; webhookd looks for scripts in a directory called `scripts` in the current working directory, so this goes in `scripts/pushl.sh`:

```bash
#!/usr/bin/env bash

set -euo pipefail

exec pushl -v \
  --cache /cache \
  --wayback-machine \
  --self-pings \
  https://jordemort.dev/rss.xml
```

(Note the `--wayback-machine`; Pushl can ask for your content to be added to the [Internet Archive](https://archive.org/) as well!)

The URL for the webhook will be the name of the script, with `.sh` stripped off.
I'm running webhookd at `hook.jordemort.dev`, so the URL for this hook ends up being `hook.jordemort.dev/pushl`.

Finally, I added stanza to the [action that builds this site](https://github.com/jordemort/jordemort.github.io/blob/main/.github/workflows/deploy.yml):

```yaml
  notify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Send Webmentions
        run: |
          curl --fail \
            -u "${{ secrets.MY_HOOK_USER }}:${{ secrets.MY_HOOK_PASSWORD }}" \
            https://hook.jordemort.dev/pushl
```

Now, every time the site is built:

- Actions taps webhookd
- webhookd runs Pushl
- Pushl fetches the RSS feed and processes any new links

This lets me store Pushl's data somewhere I know it will be safe, and allows me to keep treating GitHub mostly as a static file host for this site, so that I can easily migrate elsewhere if I ever feel moved to do so.
