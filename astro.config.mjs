import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from "astro-compress";

import { repoDatesPlugin } from "./src/plugins/repodates.mjs";
import { defaultLayoutPlugin } from './src/plugins/defaultlayout.mjs';
import remarkGemoji from 'remark-gemoji';
import remarkMath from 'remark-math';
import remarkMermaid from 'remark-mermaidjs';
import remarkPluginOembed from "remark-plugin-oembed";

import rehypeKatex from 'rehype-katex';
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';
import chromium from 'chromium';

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
      [remarkMermaid, {launchOptions: {executablePath: chromium.path}}]
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeAccessibleEmojis
    ],
    shikiConfig: {
      theme: "dark-plus"
    }
  }
});
