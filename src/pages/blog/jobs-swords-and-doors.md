---
title: Jobs, swords, and doors
description: What have I been up to lately?
tags:
  - personal
  - doorman
  - bbs
  - door
  - games
  - sfp
  - lord
---

Hey folks! Long time, no post!
Between vacation, a new job, more vacation, a new school year for the kid, and trips to visit family, I haven't had much time to write here.
What have I been up to lately?

## Work

I took a full-time job at one of mu consulting clients in May.
It's been a good experience, but I recently received a very exciting offer from an old friend to join their team at [Danger Devices](https://dangerdevices.com/).
I'm winding up my current position, and then I'll have a couple weeks of funemployment over the Thanksgiving holiday before starting at Danger in December.

Coinciding with starting my new job, I'll be winding up [Caketop](https://caketop.app/) (my consulting persona) and parking the domain for now.
I like the freedom of being a freelancer, but I don't like the uncertainty, and I really don't like having to buy health insurance on the exchange.
This is a bit of a shame, because I have a sweet new logo for Caketop that I commissioned from [Dzuk](https://noct.zone/) that I never got to deploy, but once I start my new gig I will no longer want or need to solicit any additional work.

## Play

### Exposition

Before I got on the internet, I hung out a lot on assorted [BBS](http://bbsdocumentary.com/) systems, and even ran a grievously unpopular one of my own (called "Norwegian Wood") for a short time.

Along with allowing me to exchange files and messages with other users, many of my local BBSs featured [door games](https://en.wikipedia.org/wiki/Door_(bulletin_board_system)).
These are multiplayer games, but they operate in a uniquely asynchronous way.
All of the players exist within the same "world" but, but in most BBS door games the players never interact with each other in real-time.
Instead, each player is given a limited number of turns per day; you log in, take your turns, and log off.
If you do something particularly noteworthy during your session, the game may announce your feat to other players when they log on; other than that, interaction between players is mostly limited to competition for spots on one or more leaderboards.

This sort of multiplayer model was particularly suited to the constraints imposed by running as part of a BBS.
Remember that we were dialing into these things with modems; the number of users that could be logged on to a BBS simultaneously was limited by the number of modems, phone lines, and possibly computers (because you couldn't take multitasking as a given in those days) that the operator of the BBS was willing to pay for.
As a consequence, most BBSs run by hobbyists were single-node; usually only companies, rich people, and for-pay BBSs were willing to shell out for the equipment and phone lines needed to host multiple nodes.
It would be pretty difficult to do real-time multiplayer without multiple nodes, and if you only had a single phone line, you wouldn't want one player hogging it all day.

I always loved door games; many hours were spent running up my mom's phone bill to play [Legend of the Red Dragon](https://en.wikipedia.org/wiki/Legend_of_the_Red_Dragon) on all of the local BBSs.
I've also made multiple attempts to "bring them back", but a bit more on that in a few paragraphs...

### Inspiration

A couple months ago, I was lucky enough to be invited by [Elissa](http://www.elissablack.com/) to be a beta tester for [Swords of Freeport](https://swordsoffreeport.com/).
Swords of Freeport (or "SFP", as we cool kids call it) is essentially a love letter to the door games of yore.
I love it.
I've played the crap out of it and I'm the solidly the mightiest hunter and tenuously the richest person on the test server.

I liked it so much that I even made a map!
It's a few versions out of date, but it should still be useful, if you're going to play.
I plan to update this for the release version during my holiday downtime:

![Map of Swords of Freeport 0.8.5](/images/sfp-map-0.8.5.png "Map of Swords of Freeport 0.8.5")

I made the map with [diagrams.net](https://diagrams.net) &mdash; here it is on [Google Drive](https://drive.google.com/file/d/1_jiXhue5oUFMn6mfGbVkQwQd-T_tPzq4/view?usp=sharing) if you want to remix it or update it before I get around to it.

Anyway, go [buy Swords of Freeport on itch.io](https://expectproblems.itch.io/swords-of-freeport) now.
It's amazing, it'll encourage Elissa to make more weird games, and it's priced in Australian dollars so the exchange rate ought to be favorable if you're in the US.

### Revisitation

Anyway, back to the idea of bringing these door games back.
There is, of course, plenty of prior art on this.
There are several BBS software packages still being maintained, like [Citadel](https://www.citadel.org/), [ENiGMA½](https://enigma-bbs.github.io/), [Mystic](https://www.mysticbbs.com/), and [Synchronet](https://www.synchro.net/), as well as projects like [GameSrv](https://github.com/rickparrish/GameSrv) and services like [DoorParty](http://wiki.throwbackbbs.com/doku.php?id=start).
All of these software packages offer paths to getting old door games running on modern systems, and if I was looking to replicate the old school BBS experience as closely as possible, I would grab one or more of these and be on my merry way.

The rub is that I don't actually want to replicate the old school BBS experience.
I don't want BBS-style message boards; even if I did want to exchange  messages in text mode, I'd just run an NNTP server, or fire up `mutt`.
I don't want BBS-style file bases; if I want to distribute files, I'll just do it over HTTP like everyone else does these days.
This is not to disparage those that still enjoy running and/or using BBSs, but for me, almost every part of the BBS experience has been supplanted in my heart by some newer internet-age technology.
The only thing I really miss is the doors.

What I've really always wanted is a door launcher that uses the local user database (i.e. `/etc/passwd` and friends) on a Linux system.
Essentially, I'd like to be able to make doors work like the [`bsdgames`](https://packages.debian.org/bookworm/bsdgames) - they should be just another program that someone can launch from their shell account, with a system-wide shared scoreboard.
I'm not interested in running a BBS again, and I doubt any of my friends would use it if I did, but I bet at least some of my friends would be interested in a shell account that came with a bunch of games.

I've made multiple abortive attempts at this, going back to college days, and have had almost everything working (at least on the bench, in manual hacky ways) multiple times, but there are a couple things that stopped me from finishing them.

#### The soft reason not to

First of all, there's the nagging feeling that very few people are going to appreciate this but me.
I'm not exactly building the [Field of Dreams](https://inv.tux.pizza/watch?v=5Ay5GqJwHF8) here; BBS door games were a pretty niche interest, even in their heyday.
Elissa has inspired me to ignore this feeling, though.
Swords of Freeport has brought me great joy, and if I can bring the same level of joy to even one person, it's worth it, even if that person is only myself.

#### The hard reason not to

The second reason that kept me from ever finishing this was technical.
DOSEMU (and more lately DOSEMU2) has always offered a variety of ways to attach sockets or file descriptors or FIFOs or what have you to emulated serial ports, but what it didn't offer was a way to signal disconnection of those serial ports.
On a real serial port, there are some additional lines for signaling, separate from the lines that carry data; modems used these lines to tell the PC if a connection was active or not.
If a caller hung up, the modem would signal the disconnection to the PC, and software using the modem could handle this and wrap things up cleanly.

Up until September 22nd of this year, there was no way to emulate this behavior with DOSEMU2 - emulated serial ports always indicated that they had a connection, even after the other end of the socket/file descriptor/whatever they were connected to was closed.
This meant that there was no way to cleanly handle someone who disconnected in the middle of playing a door, unless I wanted to build something around a [weird out-of-tree kernel module](https://github.com/freemed/tty0tty), and I did not.
This was particularly frustrating, because I could absolutely detect a user disconnecting in software, but there was no way to signal it to the emulated DOS program.
I couldn't just signal the process in DOS, because DOS doesn't actually have signals, or processes, or really the concept of multitasking at all - once the door was running in DOSEMU, there was no out-of-band way of telling it to cleanly stop.
The only options were:

- Wait for the door time time out due to inactivity - this sucks because it leaves dead sessions around for 10 minutes or more, and especially sucks because it locks that node of the door for the duration.
- Kill the emulator process - this just really isn't an option because I don't want to corrupt the door's game data.

So, what happened on September 22nd?
[I happened!](https://github.com/dosemu2/dosemu2/pull/2102)
I cracked open the sources to DOSEMU2 and pinpointed the code that was causing the behavior that I didn't like.
Then, with the gracious guidance and help of the [DOSEMU2 maintainer](https://github.com/stsp), I fixed things, so that DOSEMU2 will notice that the other end of an emulated serial port is closed and indicate a dropped connection.

Even if I went no further, I feel like my patch has improved the state of play for other people wanting to do things related to fake modems in DOSEMU2.
This effort has already borne more fruit than my previous ones; that improvement is out now and included in software that (some) people are actually installing on their machines!

### Introduction

Introducing [Doorman](https://github.com/jordemort/doorman), the door launcher I've always wanted!
It's early days; there is no documentation yet.
There are no usage instructions yet.
There is, however, working code, that people are using to play LORD on a server in my house at this very moment.

I decided to use Doorman to teach myself Rust.
I like it a lot!
During the process, [lots of very nice people](https://github.com/jordemort/doorman/pull/1) also stepped in and taught me _proper_ Rust idioms, instead of the nonsense I had come up with on my own.

The current implementation of Doorman works, but there's a lot about it that could be better.
Originally I envisioned it as a single [`setuid/setgid`](https://en.wikipedia.org/wiki/Setuid) binary and no daemon process, ala `bsdgames`, but I'm running DOSEMU2 in a container and I want to support rootless [Podman](https://podman.io/) and it turns it it's a real pain-in-the-ass to run rootless Podman without a proper user session, which being `setuid` definitely does not get you.
So right now I'm reworking it to use a daemon process, and using a nifty trick of passing client file descriptors over a UNIX socket (suggested to me by [Jamey Sharp](https://github.com/jameysharp)) to avoid having to get too involved in terminal handling.

I won't have a lot of time to work on Doorman until I wrap up my current job on the 15th.
After that, I'll have a _bunch of time_ to work on it, at least for a couple weeks.
Hopefully I can get an initial "proper" release out by the beginning of December.

Thanks for reading!
Hopefully I'll be back in not-too-long with a release announcement!
