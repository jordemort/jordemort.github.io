import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { repoDatesPlugin } from "./src/plugins/repodates.mjs";
import { defaultLayoutPlugin } from './src/plugins/defaultlayout.mjs';

import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: 'https://jordemort.dev',
  integrations: [mdx(), sitemap(), compress({html: {removeComments: true}})],
  markdown: {
    remarkPlugins: [repoDatesPlugin, defaultLayoutPlugin],
    shikiConfig: {
      theme: "dark-plus"
    }
  }
});
