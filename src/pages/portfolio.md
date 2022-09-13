---
title: "Portfolio"
description: "Things that I have done"
---

### Articles

I write articles for [Linux Weekly News](https://lwn.net):

- September 13, 2022 - [LXC and LXD: a different container story](https://lwn.net/Articles/907613/)
- August 23, 2022 - [The container orchestrator landscape](https://lwn.net/Articles/905164/)
- July 26, 2022 - [Docker and the OCI container ecosystem](https://lwn.net/Articles/902049/)
- July 5, 2022 - [An Ubuntu kernel bug causes container crashes](https://lwn.net/Articles/899420/)

### Personal projects

I currently maintain a few projects on GitHub:

#### [python-starlark-go](https://github.com/caketop/python-starlark-go/)

This is a module that allows using [Starlark](https://github.com/google/starlark-go/) from Python.
Starlark is a dialect of Python, so essentially what this gives you is a safe sandbox to evaluate arbitrary expressions.
This is useful when you want to execute code that you don't entirely trust.
This was originally based on [pystarlark](https://github.com/ColdHeat/pystarlark), but I ended up almost completely rewriting it.
I learned a lot about Cgo and the CPython API while making this.

#### [python-renameat2](https://github.com/jordemort/python-renameat2/)

This module allows using Linux's [`renameat2`](https://manpages.debian.org/buster/manpages-dev/renameat.2.en.html) syscall from Python.
The main reason you might want to use `renameat2` is to atomically swap two files.
One neat thing about this is that it calls the syscall directly, so you can use it even if your glibc is too old to know about `renameat2`.
Right now it uses CFFI; one day I plan to apply the things I learned about the CPython API while working on python-starlark-go to remove that dependency.

#### [action-pyright](https://github.com/jordemort/action-pyright/)

This is a GitHub Action to run the [Pyright](https://github.com/microsoft/pyright) static type checker.
It uses [Reviewdog](https://github.com/reviewdog/reviewdog) to report any problems it finds.
I wrote this because I wanted the same Python type checking that I had in VSCode as an Action.

#### [gf-l100-lightcontrol](https://github.com/jordemort/gf-l100-lightcontrol/)

I own a floodlight camera of questionable provenance, which runs questionable software that talks to a questionable cloud service.
I broke into the camera and disabled all of that, but it left me without a way to control the light.
This is a tiny Go application that I wrote to allow controlling the light through Home Assistant.
I'm fairly sure nobody else uses this; sometimes I think I might even be the only person who owns this model of camera.
It's mostly here in the portfolio to prove that I can write Go.

### Contributions

A selection of my contributions to open source projects:

- I added [support for multiple peers, tunnels and proxies](https://github.com/octeep/wireproxy/pull/47) to [wireproxy](https://github.com/octeep/wireproxy/)
- I fixed [compatibility with FFmpeg 5](https://github.com/raspberrypi/libcamera-apps/pull/335) in [libcamera-apps](https://github.com/raspberrypi/libcamera-apps/)
- I added [support for X11 forwarding](https://github.com/lima-vm/lima/pull/877) to [lima](https://github.com/lima-vm/lima/)
- I added [support for hard links to `sload.f2fs`](https://git.kernel.org/pub/scm/linux/kernel/git/jaegeuk/f2fs-tools.git/commit/?id=747b74cb9cad6ac588b37a8b0c4b0971bd2eda70) in [f2fs-tools](https://git.kernel.org/pub/scm/linux/kernel/git/jaegeuk/f2fs-tools.git/)
- I added [support for Podman](http://git.annexia.org/?p=virt-what.git;a=commit;h=1df728aa4b1d2814265f9c86494f7d55ee0cf9af) to [virt-what](https://people.redhat.com/~rjones/virt-what/)
- I added [support for a using custom GITHUB_TOKEN](https://github.com/haya14busa/action-bumpr/pull/33) to [action-bumpr](https://github.com/haya14busa/action-bumpr/)
- I fixed [$? getting clobbered in PROMPT_COMMAND](https://github.com/rcaloras/bash-preexec/pull/131) in [bash-preexec](https://github.com/rcaloras/bash-preexec/)
- I added support for [PyPI](https://github.com/searx/searx/pull/2830) and [ManKier](https://github.com/searx/searx/pull/2829) to [searx](https://github.com/searx/searx/)
- I added [pipelining to the buildah transport](https://github.com/ansible/ansible/pull/59745) in [Ansible](https://github.com/ansible/ansible/)
- I added [a buildah transport](https://github.com/mitogen-hq/mitogen/pull/595) to [Mitogen](https://github.com/mitogen-hq/mitogen/)
- I fixed [`podman import`'s parsing of `ENV`](https://github.com/containers/podman/pull/3333) in [Podman](https://github.com/containers/podman/)
- I added support for [connecting via a UNIX socket](https://github.com/aurora/rmate/pull/63) to [rmate](https://github.com/aurora/rmate)
