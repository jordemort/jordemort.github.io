---
title: python-starlark-go 0.1.2 is now available
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

Version [0.1.2](https://github.com/caketop/python-starlark-go/releases/tag/v0.1.2) of [python-starlark-go](https://github.com/caketop/python-starlark-go) is now [available on PyPI](https://pypi.org/project/starlark-go/).

`python-starlark-go` provides Python bindings for [starlark-go](https://github.com/google/starlark-go), which allows you to embed a Starlark interpreter into your Python interpreter.

Starlark is a dialect of Python designed for hermetic execution and deterministic evaluation. That means you can run Starlark code you don't trust without worrying about it being able access any data you did not explicitly supply to it, and that you can count on the same code to always produce the same value when used with the same input data.

Aside from the usual smattering of updated dependencies, the main feature in the new release is pre-built wheels for `aarch64` on Linux and for `universal2` (which includes both aarch64 and x86_64).
This is brought to you through the [noble efforts](https://github.com/caketop/python-starlark-go/pull/120) of [Colin Dean](https://www.cad.cx/), who is python-starlark-go's first contributor!
