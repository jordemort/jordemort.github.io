import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from "astro-compress";

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


function rewriteKrokiSVG(node) {
  let height = node.properties.height;
  let width = node.properties.width;

  delete node.properties.style;
  delete node.properties.height;
  delete node.properties.width;

  node.properties.preserveAspectRatio = "xMidYMid";

  /* if there is no viewBox, synthesize one */
  if (height && width && !node.properties.viewBox) {
    node.properties.viewBox = `0 0 ${width} ${height}`;
  }
}

export default defineConfig({
  site: 'https://jordemort.dev',
  integrations: [
    mdx(),
    sitemap(),
    compress({ html: { removeComments: true } })
  ],
  markdown: {
    extendDefaultPlugins: true,
    remarkPlugins: [
      repoDatesPlugin,
      defaultLayoutPlugin,
      remarkGemoji,
      remarkMath,
      remarkPluginOembed,
      [remarkKroki, {
        server: "https://kroki.io",
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
        rewrite: rewriteKrokiSVG
      }]
    ],
    shikiConfig: {
      theme: "dark-plus"
    }
  }
});
