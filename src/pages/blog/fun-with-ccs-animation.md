---
title: "Fun with CSS animation"
description: "Help, I'm turning into a frontend dev"
tags:
  - astro
  - animation
  - css
  - caketop
---

I added a fancy little animation to [Caketop's website](https://caketop.app/).
It is based on this snippet on CodePen:

https://codepen.io/gulshansainis/pen/yLymJRd?editors=1001

Things I learned about CSS animation:

- When you specify multiple animations on an element, they all play at once. I expected them to play in sequence.
- You can't use CSS variables to specify keyframe indices.

Those two things together seem to make it impossible to create a dynamic chain of animations purely in CSS.
Instead, I had to resort to writing some TypeScript to generate my `@keyframes` based on how many items I waned to animate.
If you'd like, you can inspect the [result of my efforts](https://github.com/caketop/caketop.github.io/blob/main/src/components/flipper.astro).

Other things I learned:

- CSS positioning is still very much an exercise in "throw shit at the browser until it does what you want" for me.
- `Object.entries` always returns `string` keys, even if your `Record` keys are typed as something else. Ugh.
