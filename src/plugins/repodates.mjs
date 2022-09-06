// Automatically populate pubDate and updatedDate from git metadata

import * as child from "node:child_process";
import * as os from "node:os";

function gitPubDate(mdPath)  {
  try {
    const stdout = child.execFileSync(
      "git", ["log", "--diff-filter=A", "--follow", "--format=%aD", "--", mdPath],
      { encoding: "utf8" }
    );

    return stdout.trim().split(os.EOL).pop();
  } catch (_) {
    return "";
  }
}

function gitUpdatedDate(mdPath) {
  try {
    return child.execFileSync(
      "git", ["log", "-1", "--pretty=format:%aD", "--", mdPath],
      { encoding: "utf8" }
    ).trim();
  } catch (_) {
    return "";
  }
}

export function repoDatesPlugin() {
  return function (_, file) {
    let pubDate = gitPubDate(file.path);

    if (pubDate.length < 1) {
      // Probably not committed yet
      // Return today's date so building it doesn't choke
      pubDate = Date().toString();
    }

    file.data.astro.frontmatter = {pubDate, ...file.data.astro.frontmatter};
    let updatedDate = gitUpdatedDate(file.path);
    if (updatedDate.length > 0 && updatedDate != pubDate) {
      file.data.astro.frontmatter = {updatedDate, ...file.data.astro.frontmatter};
    }
  }
}
