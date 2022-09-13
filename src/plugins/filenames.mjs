import * as path from "node:path";

export function filenamesPlugin() {
  return function (_, file) {
    file.data.astro.frontmatter.source = path.relative(file.cwd, file.path);
  }
}
