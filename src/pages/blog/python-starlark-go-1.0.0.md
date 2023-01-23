---
title: python-starlark-go 1.0.0 is now available
description: I heard you like Python
tags:
  - python
  - starlark
  - go
  - python-starlark-go
  - starlark-go
  - pypi
---

![python-starlark-go banner](https://repository-images.githubusercontent.com/481312275/48b40583-d3a6-432a-9165-eaf725f7812d "python-starlark-go banner")

Version [1.0.0](https://github.com/caketop/python-starlark-go/releases/tag/v1.0.0) of [python-starlark-go](https://github.com/caketop/python-starlark-go) is now [available on PyPI](https://pypi.org/project/starlark-go/).

This comes hot on the heels of the [previous release](/blog/python-starlark-go-0.1.2/); the `universal2` binaries that I published for v0.1.2 turned out to be not-so-universal.
Once again, this issue was noticed and [fixed](https://github.com/caketop/python-starlark-go/pull/134) by [Colin Dean](https://www.cad.cx/).

There were a couple of different things that prevented us from publishing working universal2 wheels:

- We're using [cibuildwheel](https://cibuildwheel.readthedocs.io/en/stable/) to build the wheels, and that understands how to cross-compile things, but since part of the extension is written in Go and needs to be compiled with CGo, some additional tweaks were needed to make sure the compiled bit was coming out for the correct architecture.
- Go currently [doesn't support creating universal binaries](https://github.com/golang/go/issues/40698) on its own; you need to [do it by hand with `lipo`](https://dev.to/thewraven/universal-macos-binaries-with-go-1-16-3mm3), and we'd need to [build our own tooling](https://github.com/asottile/setuptools-golang/issues/155) for that.

As a consequence, we've decided it's simpler to drop `universal2`, and just publish separate `x86_64` and `arm64` wheels for macOS.
That means we have to publish more wheels, but the upside is that `pip` will definitely be able to find one that works on your Mac.
I also added back `i686` wheels for Linux; they had inadvertently been dropped from the previous release.

The embedded version of `starlark-go` has been updated to the latest available version as of this writing, which is [v0.0.0-20230122040757-066229b0515d](https://pkg.go.dev/go.starlark.net@v0.0.0-20230122040757-066229b0515d).

I went ahead and bumped the version to 1.0.0 because there was no reason not to; I consider the code to be feature-complete, I am reasonably certain that everything works as intended, and I have no plans to break the API in the foreseeable future.
I intend to follow [SemVer](https://semver.org/) for future releases; any breaking changes will come with a major version bump.

The main thing I'd still like to add is pre-built wheels for Windows; if you're a Windows-loving Pythonista that can help, please stop by the [GitHub repo](https://github.com/caketop/python-starlark-go) and say hello!
