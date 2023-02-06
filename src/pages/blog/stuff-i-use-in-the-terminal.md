---
title: Stuff I use in the terminal
description: Some bits and bobs that make my life easier
tags:
  - cli
  - dotfiles
  - shell
  - homeshick
  - asdf
  - rg
  - ripgrep
  - mcfly
  - starship
  - lsd
---

So, as you might have already guessed, I spend a lot of time in the terminal, using a shell.
After a brief flirtation with [tcsh](https://www.tcsh.org/), which was somewhat fashionable in the 90's and favored by my Solaris-loving professors for some time after, I settled rather thoroughly into [Bash](https://www.gnu.org/software/bash/), which I will probably now use until I am dead.
We have a, um, complicated relationship; I strongly believe that the only thing worse than using Bash is using any other shell.

I move around a lot between various machines.
I may not have permission/inclination/space to install a bunch of additional software on some of the machines I find myself on.
Some of them might not even be running Linux :scream:!

This nomadic lifestyle has had a big influence on my choice of tools.
I try to keep my dependencies light and avoid coming to rely on things that might not be easy to install everywhere.
This is why I settled on Bash; it's almost always already available on any machine I might need to log in to.
My dotfiles follow a philosophy of [progressive enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement) - they should work out-of-the-box with only Bash and a reasonably POSIX-compliant set of CLI tools.
If I want to put something outside of the standard set of tools into my dotfiles, I add a check to see if it's installed first, and avoid calling it if it isn't.

An actual tour of my [dotfiles](https://github.com/jordemort/dotfiles) would be a bit like taking you through my utility room, in that you might see many things that you find awkward, inexplicable, and/or gross, so I'm not going to do that.
I thought it might be nice to highlight some of my favorite tools, though.

## Absolutely essential

### homeshick

The first thing that gets installed when I'm moving into a new system is [homeshick](https://github.com/andsens/homeshick).
This is a tool that helps you synchronize your dotfiles between machines by keeping them in one or more Git repositories.
It started out as a clone of [homesick](https://github.com/technicalpickles/homesick), but homesick is written in Ruby, whereas home<i>sh</i>ick  is written in Bash.
Since it requires no other tools besides my preferred shell to bootstrap, I picked homeshick over homesick, eventhough homesick is written by a former coworker :grin:.

My dotfiles contain a [`setup.sh`](https://github.com/jordemort/dotfiles/blob/main/setup.sh) that, among other things, handles installing homeshick and setting it up.
All I need to do to move into a new machine is clone the repo and run the script.
When I was at GitHub, a "spiritual successor" of Codespaces would run this script for me automatically when spinning up a new development machine; it looks like Codespaces [borrowed this feature](https://docs.github.com/en/codespaces/customizing-your-codespace/personalizing-github-codespaces-for-your-account#dotfiles) from the internal tool that preceded it.

### asdf

I want to be upfront about this; the way I use [asdf](https://asdf-vm.com/) might be considered a bit of an abuse!
It is designed to be a _version mananger_; it's meant as a one-size-fits-all replacement for tools like [nvm](https://github.com/nvm-sh/nvm), [pyenv](https://github.com/pyenv/pyenv), and [rbenv](https://github.com/rbenv/rbenv).
If you were using it the way it was intended, you would create a [`.tool-versions`](https://asdf-vm.com/manage/configuration.html#tool-versions) file in each of your projects and put whatever version of Node, Python, Ruby, or whatever in there, so that other people could attempt to reproduce your results using the same versions.
This is not how I use it.

Instead, I use asdf as a sort of ad-hoc package manager.
I get the feeling that I'm not the only one doing this, because there are asdf plugins to install all sorts of tools that you would never think need versioning; I just checked and as of this writing, `asdf plugin list all` indicates that asdf is capable of installing 591 different tools.
Whenever there's a tool I want to use that I don't have installed, I check to see if there's an asdf plugin for it. If there is, I do this and I'm off to the races:

```sh
asdf plugin add foo
asdf install foo latest
asdf global foo latest
asdf reshim
```

Like homeshick, asdf is written in Bash.
That means I can just make it a [submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) of my dotfiles and have it automatically installed and available when my dotfiles are set up.
It's the package manager you can keep in your pocket.

## Pretty much essential

### ripgrep

[ripgrep](https://github.com/BurntSushi/ripgrep) is a better grep.
It's so much better than grep that I'm willing to seek it out and install it on any system that I'm going to be living on for more than a day or two.
I appreciate that it has sane defaults; it won't dig into hidden files or binaries without being specifically asked to, and it even respects `.gitgnore`.
It defaults to recursively searching the current directory, so you can leave off the filename entirely if that's what you want (and like at least 80% of the time that's exactly what I want):

```
$ rg JordanRules123
src/pages/blog/stuff-i-use-feb-2023.md
79:<!-- NOTE: Change GitHub password from JordanRules123 -->
```

Lots of distros and package managers have [packages for ripgrep](https://github.com/BurntSushi/ripgrep#installation); there's also an [asdf plugin for ripgrep](https://gitlab.com/wt0f/asdf-ripgrep), which is what I usually use to install it.

### McFly

![Maxwell Lord: Ctrl+R is good, but it can be better!](/images/misc/ctrl-r-is-good-but-it-can-be-better.jpg "Maxwell Lord: Ctrl+R is good, but it can be better!")

First: did you know that you can hit <kbd>Ctrl+R</kbd> in Bash to search your shell history?
I didn't, for like, the first 10 or 15 years that I used Bash.
I was grepping `~/.bash_history` like an animal.

Anyway, that's pretty great, but when you get to my age, sometimes you can't remember exactly what it is that you're looking for.
Sometimes your memory is a little... fuzzy.
That's where [McFly](https://github.com/cantino/mcfly) comes in!
It replaces Bash's stock <kbd>Ctrl+R</kbd> experience with a slick full-screen interface and fuzzy search.
McFly also takes in all sorts of contextual cues when sorting its search results, including your current directory and how recently commands were run.

Sadly, there is no asdf plugin for McFly, but there are pretty easy [installation instructions](https://github.com/cantino/mcfly#installation) for a variety of platforms.
It looks like McFly's maintainer is currently looking for additional help; I'd step up but my Rust skills are rudimentary at best.
Perhaps this could be an opportunity for you?

## Fun enough to install most places

### Starship

Once upon a time, I spent a lot of time fine-tuning my hand-rolled, extremely custom Bash prompt.
Eventually I threw most of that out, and just vendored [`git-prompt.sh`](https://github.com/git/git/blob/master/contrib/completion/git-prompt.sh) into my dotfiles.
Such was the state of things until last year, when I started longing for something flashier, but found myself utterly without motivation to put it together myself.
That's when I found [Starship](https://starship.rs/).

Starship comes with a fully-loaded prompt with a version indicator for just about anything you could think of; if you've got a lot of stuff on your machine you'll quickly be overwhelmed.
Fortunately, it is [highly configurable](https://starship.rs/config/#prompt).
I turned most of the stuff off and got a little creative with [Powerline](https://github.com/ryanoasis/powerline-extra-symbols) characters:

![My very fancy prompt](/images/misc/very-fancy-prompt.png "My very fancy prompt")

Now I have a [very fancy prompt](https://github.com/jordemort/dotfiles/blob/main/home/.config/starship.toml) that I put very little work into.
My dotfiles fall back to the pre-Starship version of my prompt if it's not available.
There are [lots of ways to install Starship](https://starship.rs/guide/#%F0%9F%9A%80-installation) but I usually use the [asdf-starship plugin](https://github.com/grimoh/asdf-starship).


### LSD

[LSD](https://github.com/Peltoche/lsd) is a drop-in replacement for `ls`; that is to say, you can `alias ls=lsd` and it will behave more-or-less as you expect, even if you have been using `ls` for a long time.
The main reason that I use LSD is that in addition to color-coding different types of files like GNU ls, it also adds icons:

![A directory listing with icons](/images/misc/lsd.png "A directory listing with icons")

This is at least party just for fun, but there's a real case for it being a usability improvement as well; the icons give your tired eyes one more distinct thing that they can latch on to when you're scanning that directory listing at 2AM.

If you're thinking "those don't look like official Unicode characters," you're right.
You're going to need a special font for this one; you can grab an appropriate one from [Nerd Fonts](https://www.nerdfonts.com/).

Unfortunately there's no asdf plugin for LSD, but there are [lots of ways to install it](https://github.com/Peltoche/lsd#installation).

## That's all for now!

Congratulations on getting through January!
I barely made it myself.
I landed a big contract that's probably going to keep me pretty busy until springtime, so my posting frequency might drop off a bit, but I will try not to abandon you entirely.
Thanks for reading!
