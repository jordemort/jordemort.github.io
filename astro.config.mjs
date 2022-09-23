import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from "astro-compress";
import vue from "@astrojs/vue";
import search from "./src/search/astro";

import { filenamesPlugin } from './src/plugins/filenames.mjs';
import { repoDatesPlugin } from "./src/plugins/repodates.mjs";
import { defaultLayoutPlugin } from './src/plugins/defaultlayout.mjs';

import remarkGemoji from 'remark-gemoji';
import remarkMath from 'remark-math';
import { remarkKroki } from 'remark-kroki';
import remarkPluginOembed from "remark-plugin-oembed";

import rehypeKatex from 'rehype-katex';
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';
import rehypeRaw from "rehype-raw";
import rehypeRewrite from "rehype-rewrite";

import { rewriteKroki } from './src/utils/rewriteKroki.mjs';

export default defineConfig({
  site: 'https://jordemort.dev',
  integrations: [
    vue(),
    mdx(),
    sitemap(),
    compress({ html: {
      collapseWhitespace: true,
      collapseInlineTagWhitespace: false,
      conservativeCollapse: true,
      minifyCSS: true,
      minifyJS: true,
      minifyURLs: true,
      sortAttributes: true,
      sortClassName: true,
      removeComments: true
    }}),
    search()
  ],
  markdown: {
    extendDefaultPlugins: true,
    remarkPlugins: [
      filenamesPlugin,
      repoDatesPlugin,
      defaultLayoutPlugin,
      remarkGemoji,
      remarkMath,
      remarkPluginOembed,
      [remarkKroki, {
        server: "http://127.0.0.1:62580",
        alias: ["graphviz", "mermaid", "plantuml", "svgbob"],
        inline: true
      }]
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeAccessibleEmojis,
      rehypeRaw,
      [rehypeRewrite, {
        selector: ".kroki svg",
        rewrite: rewriteKroki
      }]
    ],
    shikiConfig: {
      theme: "dark-plus"
    }
  }
});
