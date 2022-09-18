---
title: "Adding copy buttons to code blocks"
description: Client-side JavaScript? On this site? It's more likely than you think!
tags:
  - jordemort.dev
  - astro
  - css
  - javascript
---

GitHub puts buttons on code blocks that let you copy their contents to the clipboard.
I want those too!
Let's implement them.

## The basics

To the search engine, Robin!
Let's see if anyone else has done this.
Aha, it looks like [Rob O'Leary](https://www.roboleary.net/2022/01/13/copy-code-to-clipboard-blog.html) has!
This implementation will be based on his, but of course I'm going to hack it up a ton, and stuff it all into an [Astro](https://astro.build/) component.

First, let's look at a bit of Rob's implementation.
When the page is loaded, it looks for all the code blocks in the document, and adds a button to each one:

```javascript
blocks.forEach((block) => {
  // only add a button if browser supports Clipboard API
  if (navigator.clipboard) {
    let button = document.createElement("button");
    button.innerText = copyButtonLabel;
    button.addEventListener("click", copyCode);
    block.appendChild(button);
  }
});
```

As you can see, Rob is fabricating his button entirely in JavaScript.
This is a cool way to do things, but one of the things I want to do as I adapt this for my site is to spice up the styling.
I'd rather do that kind of thing in HTML and CSS, so instead of building up my elements entirely in JavaScript, I'm going to add a [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) element to my component.
These elements are not displayed by the browser; they're just injected into the DOM for use by scripts.

```html
<template id="copyButtonTemplate">
  <button>Copy to clipboard</button>
</template>
```

Now I can add something like this to my script:

```typescript
const copyButton = (document.getElementById("copyButtonTemplate") as HTMLTemplateElement).content.firstElementChild!;
```

...and then I can change things to use the template instead:

```typescript
  ...
  // let button = document.createElement("button");
  // button.innerText = copyButtonLabel;
  let button = copyButton.cloneNode(true) as HTMLButtonElement;
  ...
```

I think it's a possibility that I'm going to want to have multiple buttons, so I'm going to wrap them in a `<div>`.
The `<div>` isn't going to need anything but a class name, so I'm fine with just creating that in JavaScript.
That looks something like this:

```typescript
  ...
  let div = document.createElement("div");
  div.classList.add("code-buttons");

  let button = copyButton.cloneNode(true) as HTMLButtonElement;
  button.addEventListener("click", copyCode);

  div.appendChild(button);
  block.appendChild(div);
  ...
```

Now I can add styles for my `<div>` to my component.
I use [`is:global`](https://docs.astro.build/en/reference/directives-reference/#isglobal) on my style; since the elements I'm targeting are going to be dynamically added to the DOM, Astro won't be able to work its CSS scoping magic on them.

```html
<style is:global>
  .code-buttons {
    position: relative;
    width: 100%;
    height: 1rem;
    overflow: visible;
    background-color: rgb(30, 30, 30);
  }

  .code-buttons button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 100;
  }
</style>
```

First, I set `position: relative` on my div.
This is a bit of magic that took me a while to wrap my head around; when an element is `position: relative`, then any elements inside of it that are `postition: absolute` are positioned relative to the `position: relative` element.
What `absolute` really means is to position this element relative to the inner-most enclosing `relative` element - if there is no such element, then `absolute` is relative to the document as a whole.

I want the buttons to hang over the code in the top right corner.
I also want the buttons to remain in the same place even if the content of the code block is scrolled.
I struggled with various ways to do this, and the only way I could pull it off was to put the div for the buttons outside of the code block.
To pull that off, I give the `<div>` a small fixed height (`height: 1rem`) and then set `overflow: visible`.
I position the button in the corner of the `<div>` (`position: absolute; top: 0.5em; right: 0.5em`), and give it a `z-index` of 100 so it will render on top of other elements.
Then I set the background color to match the color of my code blocks.
Finally, I need to modify my script to inject the `<div>` before the code block, instead of inside of it:

```typescript
  ...
  // block.appendChild(div);
  block.parentNode!.insertBefore(div, block);
  ...
```

I don't want any seams between my button `<div>` and the code block, so I'm going to strip any padding or margin off the top of the code block before I add the buttons.

```typescript
  ...
  block.style.marginTop = "0";
  block.style.paddingTop = "0";
  block.parentNode!.insertBefore(div, block);
  ...
```


Visually, the result is now similar to before we added the button; the `1rem` height of the `<div>` we're adding takes the place of the padding on the top of the code block.
The button dangles over the bottom edge of the `<div>` and overlaps the code block:

```svgbob
+------------------------------------------+------------+
| div                                      |            |
+------------------------------------------+   button   |
|                                          |            |
| code block                               +------------+
|                                                       |
|                                                       |
+-------------------------------------------------------+
```

Rob binds the button's click event to this `copyCode` function:

```javascript
async function copyCode(event) {
  const button = event.srcElement;
  const pre = button.parentElement;
  let code = pre.querySelector("code");
  let text = code.innerText;
  await navigator.clipboard.writeText(text);
}
```

This goes and queries the DOM to find the target element every time the button is clicked.
This feels inefficient to me, because we already know the element we want to copy, so I'm going to replace it with something that generates a [closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures):

```typescript
function makeCopier(block: HTMLElement) {
  let code = block.querySelector("code")!;

  async function copier() {
    await navigator.clipboard.writeText(code.innerText);
  }

  return copier;
}
```

...and then switch over to that:

```typescript
  ...
  // button.addEventListener("click", copyCode);
  button.addEventListener("click", makeCopier(block));
  ...
```

A new copy of the `copier` function is now created for each button, with `code` already bound to the element we're interested in.

## Spicing it up

First, I'd like to replace the button's text with an icon.
I initially looked at [Font Awesome](https://fontawesome.com/icons), but only some of the icons there are free; many others require a commercial license.
I picked out an icon that I thought was free, but when I downloaded the SVG, it included a comment that had a link to the commercial license.
Since I wasn't 100% clear on what I was allowed to do with that icon, I gave up on Font Awesome and grabbed a different "copy to clipboard" icon from [Octicons](https://primer.style/octicons/), which is entirely MIT-licensed.

Now I can change my button template to incorporate the SVG.
I'm just going to inline it into my HTML.
I added a `<title>` element to the SVG for accessibility - your browser should show you a tooltip telling you what the button is for, if you hover over it:


```html
<template id="copyButtonTemplate">
  <button>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <title>Copy to clipboard</title>
      <path fill-rule="evenodd" d="M7.024 3.75c0-.966.784-1.75 1.75-1.75H20.25c.966 0 1.75.784 1.75 1.75v11.498a1.75 1.75 0 01-1.75 1.75H8.774a1.75 1.75 0 01-1.75-1.75V3.75zm1.75-.25a.25.25 0 00-.25.25v11.498c0 .139.112.25.25.25H20.25a.25.25 0 00.25-.25V3.75a.25.25 0 00-.25-.25H8.774z"></path>
      <path d="M1.995 10.749a1.75 1.75 0 011.75-1.751H5.25a.75.75 0 110 1.5H3.745a.25.25 0 00-.25.25L3.5 20.25c0 .138.111.25.25.25h9.5a.25.25 0 00.25-.25v-1.51a.75.75 0 111.5 0v1.51A1.75 1.75 0 0113.25 22h-9.5A1.75 1.75 0 012 20.25l-.005-9.501z"></path>
    </svg>
  </button>
</template>
```

Wow! That's a lot more complex!
I'm glad I switched to using `<template>` elements instead of trying to build this thing in JavaScript! :smile:

Let's add some styling:

```css
.code-buttons button {
  ...
  border: 1px solid white;
  border-radius: 5px;
  background-color: black;
  color: white;
  transition: all 0.2s;
  opacity: 0.2;
}

.code-buttons button:hover {
  opacity: 1;
}

.code-buttons button svg {
  height: 24px;
  width: 24px;
  margin: auto;
  stroke: white;
  fill: white;
  transition: all 0.2s;
}
```

Now the buttons are white with black backgrounds; they're also mostly transparent, until you hover over one of them.

I also want to add some interactivity.
First, I'll create some styles for when a button is clicked:

```css
.code-buttons button.clicked {
  border: 1px solid #0f0;
  color: #0f0;
}

.code-buttons button.clicked svg {
  stroke: #0f0;
  fill: #0f0;
}
```

Nothing like pure computer green; it reminds me of the massive Mountain Dew addiction I had in college.

Now I'll extend the `copier` function so that it makes the buttons green for a bit when they are clicked:

```typescript
function makeCopier(block: HTMLElement, button: HTMLButtonElement) {
  let code = block.querySelector("code")!;

  async function copier() {
    await navigator.clipboard.writeText(code.innerText);

    button.classList.add("clicked");

    setTimeout(() => {
      button.classList.remove("clicked")
    }, 100);
  }

  return copier;
}
```

Since we've added the `button` as a parameter to `makeCopier`, we also need to change our call to pass it in:

```typescript
  ...
  //button.addEventListener("click", makeCopier(block));
  button.addEventListener("click", makeCopier(block, button));
  ...
```

When the button is clicked, the function will add the `clicked` class to it.
100 milliseconds later, it will remove the `clicked` class.
This is smoothed out by `transition: all 0.2s` - instead of instantly changing the button's color, the browser will smoothly transition between the two colors over a period of 0.2 seconds.
This makes things look just a little bit fancier.

## Even fancier

Turning the button green when it is clicked is a good start, but I want some more explicit feedback.
I can't expect my visitors to instantly understand that "green button" means "copied."
Rob's implementation changes the text of the button, but I don't want text in my buttons, so I need to figure something else out.
Ideally, what I'd like to do is briefly flash the message "Copied!" somewhere near the button when it is clicked.

First, another template for the message:

```html
<template id="copiedFeedbackTemplate">
  <div class="copied">Copied!</div>
</template>
```

...and some styling for it:

```css
.copied {
  position: absolute;
  top: 0.5em;
  right: -90px;
  z-index: 100;
}
```

First the positioning; like the button, we position the feedback `absolute`, put it 0.5em away from the top, and give it a `z-index` of 100.
The magic is in `right: -90px` &mdash; this positions the element off of the right edge of the parent `<div>`, like this:

```svgbob
+------------------------------------------+------------+ +--------+
| div                                      |            | |        |
+------------------------------------------+   button   | | copied |
|                                          |            | |        |
| code block                               +------------+ +--------+
|                                                       |
|                                                       |
+-------------------------------------------------------+
```

I arrived at 90px by the very scientific method of trying different values until I found something that looked right.

Now I need to extend the code to create the "Copied!" message and add it to the `<div>` we are creating.
First, I need to get the template out of the DOM:

```typescript
const copiedFeedback = (document.getElementById("copiedFeedbackTemplate") as HTMLTemplateElement).content.firstElementChild!;
```

Now I can add it to the `<div>`.
I don't want it to display unless the button is clicked, so I'm going to give it `display: none` initially.
The `copier` function is going to need to act on the feedback `<div>`, so it needs to be added as a parameter to `makeCopier` as well:

```typescript
  ...
  let feedback = copiedFeedback.cloneNode(true) as HTMLDivElement;
  feedback.style.display = "none";

  let button = copyButton.cloneNode(true) as HTMLButtonElement;
  button.addEventListener("click", makeCopier(block, button, feedback));

  div.appendChild(button);
  div.appendChild(feedback);
  ...
```

I can now extend the `copier` function to show and hide the feedback `<div>` when the button is clicked.
I only flash the color for 100ms, but I think the feedback should hang around for half a second so that you have time to read it:

```typescript
function makeCopier(block: HTMLElement, button: HTMLButtonElement, feedback: HTMLDivElement) {
  let code = block.querySelector("code")!;

  async function copier() {
    await navigator.clipboard.writeText(code.innerText);
    button.classList.add("clicked");
    feedback.style.display = "block";

    setTimeout(() => {
      button.classList.remove("clicked")
    }, 100);

    setTimeout(() => {
      feedback.style.display = "none";
    }, 500);
  }

  return copier;
}
```

Now we've got a nice little "Copied!" that pops up in the gutter of the page when the button is clicked!

## One small (screen) problem

This site has a "responsive" layout.
That means that the layout should adjust itself to the size of your screen.
The content is intended to cover the full width of your screen, unless your browser window is wider than 800px, in which case the width of the content is fixed at 800px[^1] to keep your eyes from getting tired from having to read very long lines.

[^1]: 800px at the time this was written; this may change, as I'm still toying with font size and width.

On big browser windows, the right gutter is a perfectly reasonable place to show my "Copied!" message, but there's no gutter on small screens where the content is completely filling the page.
As it stands, the feedback `<div>` will end up positioned off-screen for people with smaller browser windows, and may even cause a dreaded horizontal scroll bar for half a second.

To solve this, I'm going to use a [CSS media query](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries).
Media queries let you write rules that function differently in different situations; one of the things that you can use media queries for is to style things differently depending on the width of the browser window:

```css
.copied {
  position: absolute;
  top: 48px;
  right: 0.5em;
  z-index: 100;
}

@media only screen and (min-width: 960px) {
  .copied {
    top: 0.5em;
    right: -90px;
  }
}
```

Now, by default, the feedback is positioned below the button.
If the browser window is at least 960px wide, the feedback is thrown out into the gutter instead.

## Putting it all together

Since this site is built with Astro, it makes the most sense for me to throw all the code for this feature together into an [Astro Component](https://docs.astro.build/en/core-concepts/astro-components/), which I am calling [`MagicButtons.astro`](https://github.com/jordemort/jordemort.github.io/blob/main/src/components/MagicButtons.astro):

```astro
---
// don't need any server-side logic here yet...
---
<style is:global>
  /* all the styles... */
</style>
<template id="copyButtonTemplate">...</template>
<template id="copiedFeedbackTemplate">...</template>
<script>
  function makeCopier(...) { ... }
  ...
</script>
```

Finally, I can add the component to my [main layout](https://github.com/jordemort/jordemort.github.io/blob/main/src/layouts/Skeleton.astro):

```astro
---
...
import MagicButtons from "../components/MagicButtons.astro";
---

<!DOCTYPE html>
<html lang="en-us">
  <head>...</head>
  <body>
    ...
    <MagicButtons />
  </body>
</html>
```

...and I'm done!
Enjoy the buttons!
