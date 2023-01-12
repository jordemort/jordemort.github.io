---
title: Sending cron output to Slack (or Discord, or Matrix, or...)
description: Teach an old dog a new way to bark
tags:
  - cron
  - slack
  - discord
  - matrix
  - apprise
  - mailrise
  - msmtp
  - chatops
---

I'm a big fan of [cron](https://en.wikipedia.org/wiki/Cron).
Well, not necessarily a big fan; I can't reliably write a [cron expression](https://crontab.cronhub.io/) without help, and getting output from cron jobs is harder than it needs to be.
When a cron job produces output, crond attempts to mail the output to the user that owns the job.
This made more sense back in the day, when a UNIX-like system without a functioning mail setup was unthinkable, but these days allowing a server to send email is more often viewed as a liability rather than a necessity.
What's a sysadmin to do?


## ChatOps!

As you may or may not know, I worked at GitHub for a long time, mostly before the Microsoft buyout.
GitHub in those days was a very unique (in the sincere sense) place, with a lot of interesting (some in the sincere and some in the Midwestern sense) ideas.
Though I hung up my exclusive, personalized, employees-only GitHub hoodie a long time ago, some of those ideas have stuck with me; ChatOps is surely the stickiest of these.

The basic idea behind ChatOps is to wire everything into whatever chat application your team is using.
Instead of building web or terminal interfaces for internal tools, you build chatbots and park them in channels dedicated to particular purposes.
All of your internal tooling should be triggered by commands in these channels, and all of the output of that tooling should be sent back to the channel where the command was run.
In essence, ChatOps turns channels into something like big multiplayer terminals.

This approach has some big advantages, especially for remote teams; nobody else knows what's happening in your terminal or browser window, but everyone can follow along with a chat channel.
Every command and its output is logged and timestamped in the channel.
Figuring out who did what and when is trivial.
The entire history is searchable, and newbies can learn from the old salts both in real-time and by scrolling back to see what people have done in the past.

Along with connecting all of your internal tooling to chat, you should also connect all of your monitoring and alerting systems to the same channels.
This brings additional advantages; you can react to alerts in the same place that you received them.
Pretty much everyone has their chat client open during working hours, which means people are able to react to events more quickly.
If anything someone did ends up being the cause of an alert, it's easy to scroll back to try and correlate the events.
Noisy alerts also seem to be less of an irritant in chat channels than via email or SMS, so you're less likely to quash something that is trying to tell you something important.

Even now, as a mostly solo practitioner, I've stuck with ChatOps.
I have a very email-driven workflow (inbox zero, **every day**) but that workflow is optimized for prioritizing and responding to humans; stuff that isn't sent by humans is quickly swept under the rug.
This brings us back to cron, which predates all of this fancy chat stuff that we use these days; how do we drag this antediluvian daemon into the age of ChatOps?

## What's a MTA?

`crond` doesn't actually implement the mechanics of sending mail for itself.
Instead, in the UNIX tradition, it relies on another program to do that.
This program is called an MTA, which stands for Mail Transfer Agent (although some might argue that this program is actually an [MSA](https://en.wikipedia.org/wiki/Message_submission_agent) or perhaps even an [MUA](https://en.wikipedia.org/wiki/Email_client), because arguing about these things was a popular way to pass the time before we had social media.)
The version of [cron by Paul Vixie](https://github.com/vixie/cron) (which is probably the one you've got if you're running on Linux) allows the path to the MTA to be configured, but only as a compile-time option.
If you don't want to recompile cron for yourself, then you're stuck with whatever your distro gave you, which is probably the default: `/usr/lib/sendmail`

Back in the way back, this was the *actual* [sendmail](https://en.wikipedia.org/wiki/Sendmail), of [bat book](https://www.oreilly.com/library/view/sendmail-4th-edition/9780596510299/) notoriety, but these days it's exceedingly unlikely that you'll run into that accidentally.
In earlier times, there were a lot fewer servers, and thus many systems came prepared to send and receive email by default, because if someone was setting up a server for an organization, it was most likely *the* server for that organization.
Now, with virtual machines and clouds and people running Kubernetes clusters in their homelabs, it's much less likely that any particular machine will be called into service as a mail server.
The internet is also a much more hostile place these days; any publicly reachable mail server is sure to have spammers constantly jiggling the locks to see if they can get someone else to deliver their crap.

All of that means that if you're running the default install of something reasonably modern, you probably don't have anything at all installed at `/usr/lib/sendmail`.
Without something installed at this path, `crond` will discard any cron job output (if you're lucky, you might get a "No MTA installed" message in your logs); if you want to keep an eye on your cronjobs, you're going to need to put something there.
Thankfully it doesn't have to be the *actual* sendmail; it just needs to be at least sort-of command-line compatible with it.

There are innumerable choices here, each with its own set of fierce adherents.
If you install a package that requires an MTA and don't specify which on Debian or Ubuntu, you'll end up with [Postfix](https://www.postfix.org/).
Postfix is a very fine piece of software and it's what I would choose, if I wanted to run a mail server.
Postfix is also a fairly complex piece of software with many moving parts, though; it's certainly easier to configure than sendmail, but setting it up correctly is still very non-trivial.
I also don't actually want to run a mail server!
I just want to get output out of cron!

## msmtp

One of the simplest MTAs available is [msmtp](https://marlam.de/msmtp/).
It does one thing and does it well; it accepts a message at the command-line and relays it to an actual mail server.
You can run `msmtp` directly on the command-line, but it also supports being symlinked to `/usr/lib/sendmail`; when it detects that it is being called in this way, it will behave as cron and other programs looking for an MTA there expect.
On Debian and Ubuntu, installing the `mstmp-mta` package will set this up for you.

If all I wanted to do was get cron output into the mailbox, I'd be almost done at this point; all that would remain is to add an SMTP account to `/etc/msmtprc` and set up `/etc/aliases` to direct mail to where I want it.
I really don't want more email from computers though.
I want these messages in one of my ChatOps channels, and in order to pull that off, I'm going to need some additional software.

## Mailrise

[Mailrise](https://github.com/YoRyan/mailrise) is an SMTP server that forwards the messages that it receives to the [Apprise](https://github.com/caronc/apprise) notification library.
At the time of this writing, Apprise can send notifications [79 different ways](https://github.com/caronc/apprise/wiki); for ChatOps purposes you're most likely to be interested in [Discord](https://github.com/caronc/apprise/wiki/Notify_discord) (boo!), [Matrix](https://github.com/caronc/apprise/wiki/Notify_matrix) (yay!), [Mattermost](https://github.com/caronc/apprise/wiki/Notify_mattermost) (sure), [Slack](https://github.com/caronc/apprise/wiki/Notify_slack) (meh), or [Teams](https://github.com/caronc/apprise/wiki/Notify_msteams) (you poor thing).

You can install Mailrise from [PyPI](https://pypi.org/project/mailrise/) or use the [container image](https://hub.docker.com/r/yoryan/mailrise).
I've chosen to run Mailrise with Docker Compose.
Here's my `docker-compose.yml`:

```yaml
services:
  mailrise:
    container_name: mailrise
    image: yoryan/mailrise:latest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./mailrise.conf:/etc/mailrise.conf
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
```

I'm using `network_mode: host` because I want Mailrise to be reachable from outside the container as well.
Just forwarding a single `port` here would possibly be a better choice, but the service only exposes a single port so it's kind of a wash.
The label lets a piece of software I'm running called Watchtower know that it's OK to [automatically update the container](/blog/responsible-negligence/).

My `mailrise.conf` is a YAML document that looks like this:

```yaml
listen:
  host: 127.0.0.1
  port: 8025

smtp:
  hostname: mailrise.int

configs:
  alerts:
    urls:
      - hey://you.should/REPLACE-THIS_URL
```

I set `smtp.hostname` thinking it would change the domain that Mailrise accepts mail on, but it turns it that it doesn't do that; the only thing that setting changes is the hostname that Mailrise uses in its SMTP greeting.
All mail sent to Mailrise must be addressed to the domain `mailrise.xyz`, which is a bit annoying because `xyz` is an [actual TLD](https://gen.xyz/) that folks can register actual domains in, and in fact `mailrise.xyz` is currently a registered domain; it currently redirects to the project's GitHub repository.
If the domain was registered by the project's maintainer (and who knows, since the WHOIS is redacted), then they're probably unlikely to use it maliciously, but using an actual domain for fake purposes makes me a bit itchy because of the possibility of a misconfiguration causing an information leak.

Anyway, enough whining about hostnames.

Each key under `configs` creates an address that Mailrise will accept mail for.
In this case, I'm keeping it simple, and I only have one: `alerts`.
Each address has a list of `urls` to forward messages to; again, I'm only using one.
Check out the page for the integration you're using on the [Apprise wiki](https://github.com/caronc/apprise/wiki) to figure out what URL you should use.
Apprise also recognizes raw webhook URLs from popular services like Discord and Slack; you can just use those directly.

## Making msmtp talk to Mailrise

When it's called as `sendmail`, `msmtp` uses `/etc/msmtprc` as its configuration file.
Here's mine:

```
# Default settings that all others accounts inherit
defaults
auth   off
tls    off
tls_starttls   off

tls_trust_file /etc/ssl/certs/ca-certificates.crt

# Logging
syslog on

# Use domain part of your email address or FQDN of host.
# default is localhost.
domain goose.example.com

set_from_header on

account  mailrise
host     127.0.0.1
port     8025
from     system@goose.example.com

# Default account to use
account default : mailrise

aliases /etc/aliases
```

This configuration tells `msmtp` to relay everything to Mailrise on 127.0.0.1:8025, and to map local usernames to email addresses using `/etc/aliases`, which looks like this:

```
#root mail
root:  alerts@mailrise.xyz

#cron mail
cron: alerts@mailrise.xyz

#default all other mails
default: alerts@mailrise.xyz
```

As you can see, my current setup is very simple; every message to every local user is forwarded to a single alert URL.
There's room for much more complexity if needed, though.
If I needed to send different things to different channels, I could create additional addresses in `mailrise.conf`, and either use `/etc/aliases` to map different users to different places or by using [`MAILTO`](https://www.cyberciti.biz/faq/linux-unix-crontab-change-mailto-settings/) to send the output of specific cron jobs to different addresses.

## What's it look like?

Here's a couple screenshots of this in action on the [Caketop](https://caketop.app) Slack:

![A message from an unattended-upgrades cronjob, appearing in a Slack channel](/images/sending-cron-output-to-slack/unattended-upgrades.png "A message from an unattended-upgrades cronjob, appearing in a Slack channel")

![A message from Netdata's updater cronjob, appearing in a Slack channel](/images/sending-cron-output-to-slack/netdata-updater.png "A message from Netdata's updater cronjob, appearing in a Slack channel")

## Greetings

Shoutout to my friend [Brett](https://github.com/bwestover) who inspired this post.
May you never wake up to an inbox full of cron spam again!
