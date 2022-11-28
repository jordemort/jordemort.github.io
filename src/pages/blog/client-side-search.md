---
title: Client-side search
description: Fun with SQLite and range requests
tags:
  - css
  - javascript
  - typescript
  - vue
  - astro
  - sqlite
  - sql.js
  - sql.js-httpvfs
  - search
---

Client-side search has arrived on the site!
If you're reading this on jordemort.dev with a reasonably modern browser that supports JavaScript, you should see a "Search" link at the top of the page.
Give it a click and try it out!
This is not a trick; this is still a static site.
Your browser is doing all of the work.

## How does it work?

The search is built on top of [sql.js-httpvfs](https://github.com/phiresky/sql.js-httpvfs).
This is a fork of [sql.js](https://github.com/sql-js/sql.js), which itself is a port of [SQLite](https://www.sqlite.org/) to JavaScript.
Essentially, it's a small database engine that runs entirely in your browser.

SQLite aims to be a very portable and easily embeddable piece of software.
In order to achieve this, it performs all of its reads and writes of the database through a [virtual filesystem](https://www.sqlite.org/vfs.html) (VFS) layer.
This makes it easier to create versions of SQLite that run in odd places; a person who wants to add a new kind of storage to SQLite just needs to implement the relatively small number of functions needed by the VFS.

As you might have guessed by now, <em>sql.js-httpvfs</em> builds on <em>sql.js</em> by adding an additional VFS module, which works over HTTP.
This means that it can be used to query a database stored on a web server.
What's more, this VFS layer uses [byte range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests); this is a special kind of HTTP request that only retrieves a specific segment of a file.
This allows SQLite running in your browser to interact with a database stored on a web server in a way similarly to how it would interact with a database on your computer; instead of having to download the entire database, it only downloads the chunks of it that it needs.

This property is what initially attracted me to <em>sql.js-httpvfs</em>; alternatives like [Lunr](https://lunrjs.com/) and [Lyra](https://lyrajs.io/) appear to rely on downloading an index of the entire site up-front.
The joke may be on me in this regard, though, unless I generate a whole lot more content; running SQLite in the browser requires downloading an entire megabyte of WebAssembly, whereas the index of the site is only 148k.
It's likely that for the number of posts currently on this blog, and for a great number more than that, that it would have been a net win as far as raw number of bytes transferred to use Lunr or Lyra and just let it grab the whole index up-front.
I'm very happy with what I ended up with, though, and good old gzip cuts that megabyte of WASM down to a fairly-reasonable-for-2022 500k.

## The schema

Here's the schema for the database that holds the site index; I used table and column names based on the terminology in the [h-entry](https://microformats.org/wiki/h-entry) specification:


```sql
CREATE TABLE entries (
  entry_id INTEGER PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  published TEXT NULL,
  updated TEXT NULL
);

CREATE INDEX IDX_published
ON entries(published);

CREATE TABLE categories (
  category TEXT NOT NULL,
  entry_id INTEGER NOT NULL,
  FOREIGN KEY(entry_id) REFERENCES entries(entry_id)
);

CREATE INDEX IDX_categories
ON categories(category);

CREATE VIRTUAL TABLE ftsentries
USING fts4(name, categories, summary, content, tokenize=porter);
```

The `entries` table contains one row for each URL in the index, which includes an ID, the URL, and when the entry was published and last modified.
Basically, any information about the URL that I don't want to be part of the full-text index goes in this table.
I index the date each entry was published.

I also have a `categories` table and an index on it to keep track of which tags ("categories" in h-entry parlance but I will probably always want to say "tags") apply to each entry.
I'm not using this table yet but I have some ideas for it that I might implement later.

Finally, the `ftsentries` table contains a row for each entry, with columns containing the various pieces of text content that I'd like to index.
This is a SQLite [FTS4](https://www.sqlite.org/fts3.html) table; SQLite contains a few different ways to build a full-text index, including FTS3, FTS4 (which is just slightly improved version of FTS3), and [FTS5](https://www.sqlite.org/fts5.html).
I initially wanted to use FTS5, and while it is built into <em>sql.js-httpvfs</em>, it is not built into the regular version of <em>sql.js</em>.
In the browser, I use <em>sql.js-httpvfs</em>, but on the server, when I'm building the index into a local file, I'm using regular <em>sql.js</em>.
There appears to be a variant of <em>sql.js</em> on NPM with FTS5 built-in, but it's from a third-party and doesn't appear to be updated regularly, which gave me somewhat sketchy vibes.
The <em>sql.js</em> project provides [very clear instructions](https://github.com/sql-js/sql.js/blob/master/CONTRIBUTING.md#compiling-sqlite-with-different-options) for building your own version of it with whatever extensions you want, but I didn't feel prepared to take on maintaining my own copy of it, so I just settled for FTS4.

## Building the index


I wrote the code that builds the index in two parts.
First, there is the [indexer](https://github.com/jordemort/jordemort.github.io/blob/main/src/search/indexer.ts).
The indexer code is independent of any framework or filesystem access; it should probably even be able to run in a browser, although I haven't tried that.

The `Indexer` object provides an interface that looks like this:

```typescript
export class Indexer {
  async index(url: string, html: string) {
    // Accepts a URL, and a string containing HTML
    // Parses the HTML, and adds it to the index
    ...
  }

  finalize(): UInt8Array {
    // Returns the SQLlite database as an array of bytes
    ...
  }
}
```

The `index` method processes the HTML of each page in the following way:

1. First, [metascraper](https://metascraper.js.org/) is used to extract a title and description for the page.
2. Next, [microformats-parser](https://github.com/microformats/microformats-parser) is used to extract article content, categories, and dates. If it finds a title and/or description, those are used in preference to the ones chosen by <em>metascraper</em>.
3. Finally, if <em>microformats-parser</em>  was not able to find the main content of the page, [article-parser](https://www.npmjs.com/package/article-parser) is used to extract it.

Initially, I was only using <em>microformats-parser</em>, because my blog posts are all marked up as `h-entry`.
The [home page](/) and [portfolio](/portfolio/) don't have `h-entry` markup, though, and it bothered me that searching for "Jordan" or "portfolio" didn't surface those pages.
I could have added `h-entry` markup, but instead I decided to see how far I could get with a best-effort attempt to parse the HTML.
It turns out that the answer is "far enough that I am happy with the results."

Regardless of if the article content came from <em>microformats-parser</em> or <em>article-parser</em>, I use [html-to-text](https://www.npmjs.com/package/html-to-text) to convert it into plain text before indexing it.
<em>microformats-parser</em> provides its own plain-text rendering of the content along with the HTML, but I greatly prefer the output of <em>html-to-text</em>; in particular, <em>microformats-parser</em> seemed to have a nasty habit of eliminating spaces between headings and the text that follows them, which resulted in a search index containing a bunch of weird incorrect compound words that nobody would ever want to search for.

## Making Astro build the index

As I might have [previously mentioned](/tags/astro/), this is a static site built with [Astro](https://astro.build/).
That means all the HTML and CSS and JavaScript content is generated up-front; when you visit jordemort.dev, the web server is acting as nothing more than a dumb file server, as in the days of yore.
Astro thoughtfully provides an [Integrations API](https://docs.astro.build/en/reference/integrations-reference/) to hook other things into its build process.
The other half of the code that builds the search index for this site is a [custom integration](https://github.com/jordemort/jordemort.github.io/blob/main/src/search/astro.ts) that feeds the HTML documents that make up the site to the indexer after Astro is done generating them.

The development loop of building things with Astro is usually silky-smooth thanks to a lot of magical hot-reloading, but I had to give all of that up when building the search.
My integration uses the [`astro:build:done`](https://docs.astro.build/en/reference/integrations-reference/#astrobuilddone) hook, but that means it is only called when the site is built for production; the development server doesn't call this hook, so in development mode, the search index is just missing.

I initially tried to make a [File Route](https://docs.astro.build/en/core-concepts/astro-pages/#file-routes) that built the index on the fly, but ran into another problem; Astro's dev server doesn't support the byte-range requests that <em>sql.js-httpvfs</em> relies on.
I started a [discussion](https://github.com/withastro/rfcs/discussions/309) about this over at Astro's GitHub org but I suspect that the number of people on the planet who are interested in serving byte range requests from Astro's dev server might drop to zero if I was abducted by aliens.

## Querying the index

Keeping with the idea of separation of concerns, I wrote a simple framework-independent [client](https://github.com/jordemort/jordemort.github.io/blob/main/src/search/client.ts) to query the search index.
For each user query, the client runs the following SQL query:

```sql
SELECT
  url,
  name,
  categories,
  summary,
  content,
  LENGTH(name) - LENGTH(REPLACE(name, '[MATCH]', '')) AS name_rank,
  LENGTH(categories) - LENGTH(REPLACE(categories, '[MATCH]', '')) AS categories_rank,
  LENGTH(summary) - LENGTH(REPLACE(summary, '[MATCH]', '')) AS summary_rank,
  LENGTH(content) - LENGTH(REPLACE(content, '[MATCH]', '')) AS content_rank
FROM (
  SELECT
    entries.url,
    snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 0, -64) as name,
    snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 1, -64) as categories,
    snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 2, -64) as summary,
    snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 3, -64) as content,
    entries.published AS published
  FROM ftsentries, entries
  WHERE ftsentries MATCH ? AND entries.entry_id = ftsentries.docid
)
ORDER BY (
  name_rank * 5
  + categories_rank * 3
  + summary_rank
  + content_rank
) DESC, published DESC;
```

This is a pretty dirty hack which works surprisingly well.
First, I select any rows from the `ftsentries` table which match the query; I use the [snippet](https://www.sqlite.org/fts3.html#snippet) function to ask SQLlite for any text fragments that match the query, with the matching bits surrounded by `[BLOCK]` ... `[/BLOCK]` psuedo-tags.
I then compute the difference between the length of the snippet and the length of the snippet with all occurrences of `[BLOCK]` removed; this roughly maps to the number of "hits" in the snippet (multiplied by the length of the string `[BLOCK]`, but I don't care about that as long as all the ranks are scaled relatively to each other.)
These differences are then added together to compute a final "rank" for each result; hits in the name (title) of an entry are weighted 5 times as heavily than hits elsewhere in the content, whereas hits in the categories (tags) are weighted 3 times as heavily.
Results are sorted by descending rank; if two entries have the same rank, they are sorted based on their date of publication, with more-recently published entries coming out on top.

## Displaying the results

I really, really tried to do the client side of this in plain old JavaScript, but it was just too much to manage.
Then I tried to build it with [Alpine.js](https://alpinejs.dev/), which I have used before and liked, but even with its help, the state management started to feel too fiddly.

It was clear that I needed a component framework.
I didn't want to use [React](https://reactjs.org/); I haven't ever used it personally, but the people I know that use it heavily look and sound like they've been fighting a war.
I have enough technology-induced trauma already, so I decided to go with something else; out of the various alternatives, [Vue](https://vuejs.org/) appeared to be among the least-niche and most-reasonable, so I went with that.
Vue's [single-file components](https://vuejs.org/guide/scaling-up/sfc.html) also looked like the closest to the things I'm already doing with Astro.

Vue made the mechanics of running the queries and displaying the results very simple.
Getting the styling right was much more difficult.
My [search Vue component](https://github.com/jordemort/jordemort.github.io/blob/main/src/components/Search.vue) is more than 50% CSS by weight.

I wanted a "Spotlight-style" search bar with results overlaid on top of the content, like I've seen on other sites.
Achieving this really pushed the limits of what I can do with CSS - I learned a lot!

First, I have my `.searchOverlay` &lt;div&gt;:

```css
.searchOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  max-height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 100;
}
```

This is fixed at the top left corner of the browser window, and covers the entire screen.
The `vw` and `vh` CSS units don't take scrollbars into account, so it has both `height` and `max-height` and `width` and `max-width`.
This seems hacky, but the early 2000's alternative would have been to set `width` and `height` to `99%` and hope nobody notices.
The overlay has a black background, but it's only 30% opaque, so the overall effect is to slightly dim the content behind it.
I considered adding a blur, but felt like that was probably a little bit too much.

The overlay has a couple of event handlers attached to it to close the search interface:

```html
<div id="search"
     class="searchOverlay"
     @click.self="closeSearch()"
     @keydown.escape="closeSearch()">
```

The `@` symbol is short for Vue's [`v-on`](https://vuejs.org/api/built-in-directives.html#v-on) directive, which provides shorter and nicer ways to write things like [`onclick`](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event) and [`onkeypress`](https://developer.mozilla.org/en-US/docs/Web/API/Element/keypress_event) handlers.
The `.self` on `@click.self` tells Vue to only fire the event if the click occurs directly on the overlay; without the `.self`, the event would also be fired if any of the overlay's child elements were clicked, which would result in the search being unusable.
To do this in plain JavaScript, I would also have to attach click event handlers to all of the child elements that called [`stopPropagation`](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation) to keep the click event from reaching the overlay.
Similarly, the `.escape` on `@keydown.escape` tells Vue to only fire the event handler if the key that was pressed is the escape key; without this, my event handler would have to look at the `.key` property of the event and decide to act based on its contents.
Vue is saving me a lot of typing.

Inside of the `searchOverlay`, I have a `searchUI` &lt;div&gt;:

```css
.searchUI {
  margin-top: 6em;
  margin-left: auto;
  margin-right: auto;
  max-width: 90%;
  width: 720px;
  filter: drop-shadow(0 0 0.5rem #000);
}
```

I gave it a pretty big margin on the top to push it down from the top of the page.
Setting `margin-left` and `margin-right` to `auto` centers the element.
It has a `width` of `720px`, which is a bit less than the `800px` that the main body of the site has, but a `max-width` of `90%`; this makes it shrink to fit smaller windows.

A variety of things live inside `searchUI`, but the input element is the star of the show:

```html
<div class="searchBar">
  <input v-model="query" id="searchInput" placeholder="Search" type="search"/>
  <label for="searchInput">Search</label>
</div>
```

I wanted a fancy "floating" label for this field; i.e. a Material Design style label that sits in the middle of the input when it is inactive, and shrinks and moves up to the top when it is active.
I remembered I had done this before, and started ripgrepping for it in my `~/Source` directorry.
I found my previous implementation, but it turns out I used [Bootstrap](https://getbootstrap.com/docs/5.0/forms/floating-labels/) for that one, whereas the CSS on this site is maintained by hand.
Since I found myself unable to plagiarize myself for this, I ended up following this [tutorial by Jinson Abraham](https://dev.to/web2feel/html-css-form-with-floating-labels-2o0i).
I changed things up a little bit, but my implementation follows the same basic principles:

```css
.searchBar input {
  width: 100%;
  max-width: 100%;
  padding-top: 24px;
  font-size: 24px;
  border: none;
}

.searchBar input::placeholder {
  opacity: 0;
}

.searchBar label {
  position: absolute;
  bottom: 2px;
  left: 0;
  transition-duration: 200ms;
  font-size: 30px;
  padding-top: 1px;
  padding-bottom: 0;
  padding-left: 3px;
}

.searchBar input:focus-within + label,
.searchBar input:not(:placeholder-shown) + label {
  transform: translateY(-34px);
  font-size: 14px;
}
```

1. First, the &lt;input&gt; gets lots of padding on top.
2. Next, I set the input's [placeholder](https://developer.mozilla.org/en-US/docs/Web/CSS/::placeholder) to `opacity: 0`. This makes it invisible. Why not leave it out? I'm going to use it later.
3. The &lt;label&gt; is positioned where the placeholder would normally go.
4. When the input has focus, or when the placeholder is hidden (i.e. when someone has typed something into the box,) the label is shrunk and moved upwards.

The input is wired into the script with [`v-model`](https://vuejs.org/api/built-in-directives.html#v-model).
This tells Vue to bind the current value of the input to a variable:

```typescript
import { ref, watch } from "vue";
import { SearchClient } from "../search/client";
import type { SearchResult } from "../search/client";
import * as sqljs from 'sql.js-httpvfs';

const { createDbWorker } = sqljs;

const query = ref("");
const results: Ref<SearchResult[]> = ref([]);

var timeout: any;

watch(query, (_, value) => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }

  timeout = setTimeout(doQuery, 250);
});
```

When the value of the variable changes, Vue tells the browser to wait 250ms and then run the `doQuery` function.
If there is already a call to `doQuery` pending, it is first cancelled.
This is known as _debouncing_ - I don't want to run an excessive amount of queries, I only want to run one 250ms after you've stopped typing.

The `doQuery` function runs the query and puts the results in the `results` variable:

```typescript
async function doQuery() {
  let client = await createDbWorker(...);

  results.value = await client.search(query.value);
}
```

...and the search results are rendered using [`v-for`](https://vuejs.org/api/built-in-directives.html#v-for):

```html
<div class="searchResult" v-for="result in results">
  ...
</div>
```

## Making it fancy

I wanted an animated "indeterminate progress bar" to display when a query was running, so that you know the script is working.
I lifted one pretty much wholesale from this CodePen, which happens to be the #1 Google hit for "css indeterminate progress bar":

https://codepen.io/tmac/pen/QgVRKb

My `.progress-bar-value` &lt;div&gt; starts out with `display: none`.
When I start a query I set it to `display: block`, and when the query is finished, it goes back to `display: hidden`.
That's all there is to that.

## Island breeze

This is a lot of JavaScript to add to my static site.
Am I really making every visitor load the entirety of SQLite on every page, whether they want to use the search or not?
No, I am not!

The search is an [Astro Island](https://docs.astro.build/en/concepts/islands/).
This is one of the coolest features of Astro; it is able to put off loading any of the scripts that are needed by a component until the component is actually visible.
You only need to pay for what you use; your browser doesn't need to load any of the scripts for the search if you never click "Search."

## Final thoughts

I am extremely pleased with how this turned out.
It's definitely one of the coolest things I've done in the browser; the only thing that comes close is the photobooth I made for my wedding.
I'm a little bit worried that <em>sql.js-httpvfs</em> is no longer actively being worked on, but somewhat less so because it's a client-side dependency.
Since it's running in your browser and working off a read-only database, the only person you can pwn if there is a security issue with it is yourself.
The README for <em>sql.js-httpvfs</em> says that it could "easily be reimplemented" on top of [wa-sqlite](https://github.com/rhashimoto/wa-sqlite), so I could always try my hand at that if it becomes necessary, but I think what I have right now is pretty cool as it is.
I hope you think so too!
