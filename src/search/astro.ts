import * as fs from "node:fs";
import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegration } from "astro";
import { Indexer } from "./indexer";

export default function search(): AstroIntegration {
  let config: AstroConfig;

  return {
    name: "@jordemort/search",
    hooks: {
      "astro:config:setup": ({ config: cfg }) => {
        config = cfg;
      },
      "astro:build:done": async ({ dir, pages }) => {
        const dist = fileURLToPath(dir);
        const indexer = new Indexer();

        for (const i in pages) {
          const pathname = pages[i].pathname;

          if (pathname.startsWith("tags/")) {
            continue;
          } else if (pathname === "blog/") {
            continue;
          }

          let url = config.site! + '/' + pathname;
          let htmlpath = dist + pathname;

          if (htmlpath.endsWith("/")) {
            htmlpath += "index.html";
          }

          const html = fs.readFileSync(htmlpath).toString();
          await indexer.index(url, html);
        }

        const index = dist + "index.sqlite3";
        const buffer = Buffer.from(indexer.finalize());

        fs.writeFileSync(index, buffer);

        console.log("Wrote search index to %s", index);
      }
    }
  }
}
