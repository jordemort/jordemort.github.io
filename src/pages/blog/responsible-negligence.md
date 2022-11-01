---
title: "Responsible negligence for self-hosted services"
description: How I keep my playtime from turning into a full-time sysadmin job
tags:
  - selfhosting
  - sysadmin
  - unattended-upgrades
  - needrestart
  - debian
  - ubuntu
  - watchtower
  - docker
  - containers
---

I've got a serious self-hosting habit.
I've got a ridiculously large server in my home, a VPS at [Vultr](https://www.vultr.com/?ref=6850953), and a big dedicated server over at [Hetzner](https://hetzner.cloud/?ref=3FAtGTJngrm0).
My servers run [Debian](https://www.debian.org/) stable or [Ubuntu](https://ubuntu.com/) LTS, depending on the mood I was in when I installed them.
I run almost all of my services in [Docker](https://www.docker.com/) containers:

```
❯ ssh colossus docker ps | wc -l
32
❯ ssh citadel docker ps | wc -l
34
❯ ssh citadel docker ps | wc -l
8
```

I also work for a living (at least, in theory) and have a family that I like to spend time with.
How do I responsibly run all of these things and still have time for my family and career?

![Automatic upgrades!](/images/automatic-upgrades.jpg "Automatic upgrades!")

Yep, that's right, I just set everything to upgrade and restart automatically!

<dl>
<dt>Automatic restarts!? What about downtime?</dt>
<dd>This is how I handle my personal stuff, which me and maybe a few other people use. We're not going for five nines here.</dd>
<dt>What if an upgrade breaks something?</dt>
<dd>Then I'll notice and fix it the next time I try to use that thing. For my personal stuff, I'd rather something be down and/or broken than up and potentially unpatched.</dd>
</dl>

This approach is all about making sure the stuff that I do for fun doesn't inadvertently become not fun:

| Fun | Not fun |
|-----|---------|
| Deploying new software! | Worrying about software |
| Using software! | Getting hacked |

I thought this information might be particularly relevant today, what with today's (still impending at the time of this writing) OpenSSL circus.
With that being said, let's get down to how to set it up.

## Automatically upgrading packages with `unattended-upgrades`

[`unattended-upgrades`](https://wiki.debian.org/UnattendedUpgrades) is a lovely little package that automatically downloads and installs upgrades for you.
It comes from Debian and is also usable on Ubuntu.
It's been around for a long time and is available in the default repositories for both distributions; I'd guess that it's also available in Debian and Ubuntu derivatives like [siduction](https://siduction.org/) and [Pop!_OS](https://pop.system76.com/) but I don't have any experience with those personally.
No matter which version you're running, you should be able to get it installed like so:

```
$ apt-get update && apt-get install unattended-upgrades
```

`unattended-upgrades` is configured in the same way as `apt`; that is to say, by a bunch of configuration fragments in a weird Perl-like syntax that live in `/etc/apt/conf.d`.
This directory is probably one of my least-favorite bits of Debian and its derivatives.
The configuration files in this directory are processed in order by their filename.
On my systems, the `unattended-upgrades` package installed a configuration file called `50unattended-upgrades`, but configuration directives that affect `unattended-upgrades` can appear in _any_ file in this directory.
Fortunately, all of them begin with a common prefix, so if changing the configuration doesn't seem to be working for you, try searching for lines containing the string `Unattended-Upgrade::` in other files in `/etc/apt/conf.d`.

The default configuration is pretty conservative.
Out of the box, it won't upgrade packages from 3rd party package repositories, and it won't automatically reboot your machine.

To get `unattended-upgrades` to install packages from 3rd-party sources, you'll need to adjust `Unattended-Upgrade::Allowed-Origins`.
On my Ubuntu machines, it looks something like this by default:

```
Unattended-Upgrade::Allowed-Origins {
	"${distro_id}:${distro_codename}";
	"${distro_id}:${distro_codename}-security";
	// Extended Security Maintenance; doesn't necessarily exist for
	// every release and this system may not have it installed, but if
	// available, the policy for updates is such that unattended-upgrades
	// should also install from here by default.
	"${distro_id}ESMApps:${distro_codename}-apps-security";
	"${distro_id}ESM:${distro_codename}-infra-security";
//	"${distro_id}:${distro_codename}-updates";
//	"${distro_id}:${distro_codename}-proposed";
//	"${distro_id}:${distro_codename}-backports";
};
```

This is a list of package repositories that `unattended-upgrades` will install updates from.
Each item is in the form of an "origin" and an "archive" separated by a colon (`ORIGIN:ARCHIVE`).
Each item in the list is enclosed in double quotation marks (`"`) and terminated with a semicolon (`;`).
Lines beginning with `//` are comments.
In this default configuration, upgrades are installed from the base package repository and from the security repositories.

As mentioned in the [README for `unattended-upgrades`](https://github.com/mvo5/unattended-upgrades/blob/master/README.md), you can find the "origin" and "archive" for each repository configured on your system by running `apt-cache policy`.
On my home server running Ubuntu, that looks something like this:

```
# apt-cache policy
Package files:
 100 /var/lib/dpkg/status
     release a=now
 500 https://download.docker.com/linux/ubuntu jammy/stable amd64 Packages
     release o=Docker,a=jammy,l=Docker CE,c=stable,b=amd64
     origin download.docker.com
 500 http://security.ubuntu.com/ubuntu jammy-security/multiverse amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-security,n=jammy,l=Ubuntu,c=multiverse,b=amd64
     origin security.ubuntu.com
 500 http://security.ubuntu.com/ubuntu jammy-security/universe amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-security,n=jammy,l=Ubuntu,c=universe,b=amd64
     origin security.ubuntu.com
 500 http://security.ubuntu.com/ubuntu jammy-security/restricted amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-security,n=jammy,l=Ubuntu,c=restricted,b=amd64
     origin security.ubuntu.com
 500 http://security.ubuntu.com/ubuntu jammy-security/main amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-security,n=jammy,l=Ubuntu,c=main,b=amd64
     origin security.ubuntu.com
 100 http://archive.ubuntu.com/ubuntu jammy-backports/universe amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-backports,n=jammy,l=Ubuntu,c=universe,b=amd64
     origin archive.ubuntu.com
 100 http://archive.ubuntu.com/ubuntu jammy-backports/main amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-backports,n=jammy,l=Ubuntu,c=main,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy-updates/multiverse amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-updates,n=jammy,l=Ubuntu,c=multiverse,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy-updates/universe amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-updates,n=jammy,l=Ubuntu,c=universe,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy-updates/restricted amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-updates,n=jammy,l=Ubuntu,c=restricted,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy-updates/main amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy-updates,n=jammy,l=Ubuntu,c=main,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy/multiverse amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy,n=jammy,l=Ubuntu,c=multiverse,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy/universe amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy,n=jammy,l=Ubuntu,c=universe,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy/restricted amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy,n=jammy,l=Ubuntu,c=restricted,b=amd64
     origin archive.ubuntu.com
 500 http://archive.ubuntu.com/ubuntu jammy/main amd64 Packages
     release v=22.04,o=Ubuntu,a=jammy,n=jammy,l=Ubuntu,c=main,b=amd64
     origin archive.ubuntu.com
```

For each repository, you can find the origin by looking for value after `o=`, and the archive by looking for the value after `a=`.
Confusingly, you are **NOT** looking for the lines that begin with `origin`.

I want to automatically install updates from the backports and updates repositories as well.
I'd also like to automatically install updates from Docker.
To that end, I've reconfigured my `Unattended-Upgrade::Allowed-Origins` like so:

```
Unattended-Upgrade::Allowed-Origins {
	"${distro_id}:${distro_codename}";
	"${distro_id}:${distro_codename}-security";
	// Extended Security Maintenance; doesn't necessarily exist for
	// every release and this system may not have it installed, but if
	// available, the policy for updates is such that unattended-upgrades
	// should also install from here by default.
	"${distro_id}ESMApps:${distro_codename}-apps-security";
	"${distro_id}ESM:${distro_codename}-infra-security";
	"${distro_id}:${distro_codename}-updates";
//	"${distro_id}:${distro_codename}-proposed";
	"${distro_id}:${distro_codename}-backports";
	Docker:${distro_codename}";
};
```

I'd also like `unattended-upgrades` to automatically reboot my machines when necessary.
This is controlled by `Unattended-Upgrade::Automatic-Reboot`.
By default, my machines were configured with:

```
//Unattended-Upgrade::Automatic-Reboot "false";
```

I have changed this to:

```
Unattended-Upgrade::Automatic-Reboot "true";
```

I tend to leave SSH sessions hanging around (bad habit, I know) so I want the reboot to proceed even if I'm logged in, so I've also set:

```
Unattended-Upgrade::Automatic-Reboot-WithUsers "true";
```

But, I want some warning so that if I am actively using the session, I can quickly wrap up a thing or cancel the reboot if necessary, so I've also set:

```
Unattended-Upgrade::Automatic-Reboot-Time "+10";
```

The example configuration only shows setting a specific time for this, but the argument is [passed directly to `shutdown -r`](https://github.com/mvo5/unattended-upgrades/blob/master/unattended-upgrade#L1713), so you can use any [time format that `shutdown` accepts](https://manpages.debian.org/bullseye/runit-init/shutdown.8.en.html).
In this case, `+10` means "in 10 minutes," which gives me a reasonable window of time to react to the automatic reboot if I need to.

## Automatically restarting services with `needrestart`

`unattended-upgrades` can automatically reboot your machine when necessary, but sometimes updates only need a few services to be restarted.
This usually happens when a shared library that is used by several programs is updated; today's OpenSSL update is a good example.
This can be handled by a different bit of software called [`needrestart`](https://github.com/liske/needrestart).
You can install `needrestart` like so:

```
$ apt-get update && apt-get install needrestart
```

By default, `needrestart` will run in interactive mode when you run a manual upgrade, and ask which services you'd like to restart.
Busy dads don't have time for questions from computers with obvious answers, though, so I've reconfigured `needrestart` to just automatically restart anything it thinks needs restarting.

`needrestart` installs a configuration file at `/etc/needrestart/needrestart.conf`.
Unlike apt's configuration files, this actually appears to be Perl, instead of merely a Perl-like syntax.
The mode that `needrestart` runs in is controlled by `$nrconf{restart}`; the default configuration has it commented out:

```perl
# Restart mode: (l)ist only, (i)nteractive or (a)utomatically.
#
# ATTENTION: If needrestart is configured to run in interactive mode but is run
# non-interactive (i.e. unattended-upgrades) it will fallback to list only mode.
#
#$nrconf{restart} = 'i';
```

I've changed it to automatic mode:

```perl
# Restart mode: (l)ist only, (i)nteractive or (a)utomatically.
#
# ATTENTION: If needrestart is configured to run in interactive mode but is run
# non-interactive (i.e. unattended-upgrades) it will fallback to list only mode.
#
$nrconf{restart} = 'a';
```

## Automatically updating containers with Watchtower

`unattended-upgrades` and `needrestart` have you covered for your base operating system, but if you're anything like me, you also run a lot of containers, and doing package upgrades inside of containers feels gross for a number of reasons:

- Unless you've set up some sort of persistence for the container's root filesystem, you're going to have to reinstall the upgrades every time you restart the container
- Your containers might be running a different distribution than your host, possibly with an entirely different package manager, and you're going to have to learn them all
- Your containers might even be ["distroless"](https://github.com/GoogleContainerTools/distroless) and not even include a package manager to do updates inside of the container

Instead, when you need to update the software inside of a container, the better way to do it is to build a new container image containing the updated software and replace your running container.

[Watchtower](https://github.com/containrrr/watchtower) is a very helpful bit of software that can automatically update and restart containers when new images are available.
Like most of my self-hosted services, I run Watchtower with [Docker Compose](https://github.com/docker/compose).
Here's my Compose file for Watchtower:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    network_mode: host
    environment:
      - TZ=America/Chicago
      - WATCHTOWER_LABEL_ENABLE=true
    env_file: ./watchtower.env
    volumes:
      - /root/.docker/config.json:/config.json
      - /var/run/docker.sock:/var/run/docker.sock
    labels:
      - com.centurylinklabs.watchtower.enable=true
```

Watchtower is configured via environment variables.
I like to keep everything in Chicago time, because brain no good at timezones, so I set `TZ` to `America/Chicago`.
By default, Watchtower will update all of your running containers, but I tend to have a lot of one-offs and temporary stuff and the occasional hand-built thing that doesn't have automatic updates, so I set [`WATCHTOWER_LABEL_ENABLE`](https://containrrr.dev/watchtower/arguments/#filter_by_enable_label) to `true`; this tells Watchtower to only act on containers that have a label of `com.centurylinklabs.watchtower.enable=true`. I gave Watchtower itself this label, so that it will keep itself up-to-date.
Everything else that I want Watchtower to maintain for me also gets the `com.centurylinklabs.watchtower.enable=true` label.

Watchtower needs access to the Docker socket at `/var/run/docker.sock` to work, so that is bound into the container.
I have also bound root's Docker CLI configuration; Docker Hub put in some pretty strict rate-limiting for anonymous users a while back, so this lets Watchtower log into Docker Hub using the credentials I gave to the root user.

I've got more configuration for Watchtower in `watchtower.env`:

```
WATCHTOWER_NOTIFICATIONS=slack
WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL=https://discord.com/api/webhooks/EXAMPLE/fakeurl/slack
WATCHTOWER_NOTIFICATION_SLACK_IDENTIFIER=watchtower
WATCHTOWER_NOTIFICATION_SLACK_CHANNEL=#alerts
WATCHTOWER_NO_STARTUP_MESSAGE=false
WATCHTOWER_POLL_INTERVAL=86400
```

Most of these are about getting Watchtower to send notifications to Discord every time it does something.
I very much prefer [Matrix](https://matrix.org/) to Discord, and even run my own Matrix homeserver, but I don't think it's a good idea to self-host the infrastructure that notifies me if one of my self-hosted things is broken, so all of my "chatops" types of alerts go to Discord :smile: &mdash; for the same reason, my iCloud inbox is mostly full of mail from Cron Daemon.
I'm using Discord's webhook endpoint in "Slack emulation mode" which you can do by adding `/slack` to the end of any Discord webhook URL.
I'm doing this because at the time that I set this up, Watchtower knew how to talk to Slack but didn't natively know how to talk to Discord; I don't think it's necessary these days but I also haven't found any reason to update my configuration.
I set Watchtower to poll only once per day, again to avoid running afoul of  Docker Hub's rate limiting.

It's important to note that using Watchtower to automatically update your containers only helps if your containers actually get updated regularly.
If you are building something from a Dockerfile, you need to automatically build that Dockerfile periodically and push the result to a registry where Watchtower can find it.
If you are using images from Docker Hub or other public registries, choose carefully; make sure the image is being published by someone you feel that you can trust and that it is receiving regular updates.
If you're not sure where to look, [LinuxServer.io](https://www.linuxserver.io/) is a great collection of well-maintained container images for almost everything you might want to self-host.

## Sit back, relax, and have fun

Don't let your self-hosting habit turn you into an involuntary sysadmin.
Quit worrying so much about uptime for stuff that only you really use and let the computers take care of themselves.

![A: You need to patch your servers! B: Haha automatic updates go brrrrrr](/images/automatic-updates-go-brr.jpg "B: Haha automatic updates go brrrrrr")
