import initSqlJs from 'sql.js';
import type { Database, Statement } from 'sql.js';
import { mf2 } from "microformats-parser";
import type { MicroformatRoot, MicroformatProperty } from 'microformats-parser/dist/types';
import * as metascraper from "metascraper";
import * as metascraperDescription from "metascraper-description";
import * as metascraperTitle from "metascraper-title";
import { extract } from "article-parser";
import { htmlToText } from "html-to-text";

const scraper = metascraper.default([
  metascraperDescription.default(),
  metascraperTitle.default()
]);

const sql = await initSqlJs();

const schema = `
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
`;

const insertEntry = `
  INSERT INTO entries (url, published, updated)
  VALUES (?, ?, ?);
`;

const lastRowID = "SELECT last_insert_rowid();";

const insertFTS = `
  INSERT INTO ftsentries (docid, name, categories, summary, content)
  VALUES (?, ?, ?, ?, ?);
`;

const insertCategory = `
  INSERT INTO categories (category, entry_id)
  VALUES (?, ?);
`;

function mfProp(entry: MicroformatRoot, name: string): MicroformatProperty | undefined {
  if (name in entry.properties && entry.properties[name].length > 0) {
    return entry.properties[name][0];
  }
  return undefined;
}

const htmlOptions = {
  selectors: [ { selector: 'a', options: { ignoreHref: true } } ]
};

export class Indexer {
  db: Database;
  dbInsertEntry: Statement;
  dbLastRowID: Statement;
  dbInsertCategory: Statement;
  dbInsertFTS: Statement;

  constructor() {
    this.db = new sql.Database();
    this.db.run(schema);
    this.dbInsertEntry = this.db.prepare(insertEntry);
    this.dbLastRowID = this.db.prepare(lastRowID);
    this.dbInsertCategory = this.db.prepare(insertCategory);
    this.dbInsertFTS = this.db.prepare(insertFTS);
  }

  insertEntry(
    url: string,
    name: string,
    categories: string[],
    summary?: string,
    content?: string,
    published?: Date,
    updated?: Date
  ) {
    const sqlPublished = published ? published.toISOString() : null;
    const sqlUpdated = updated ? updated.toISOString() : null;

    this.dbInsertEntry.run([url, sqlPublished, sqlUpdated]);

    let rowID: number | undefined = undefined;

    while (this.dbLastRowID.step()) {
      rowID = (this.dbLastRowID.get() as number[])[0];
    }

    if (typeof rowID !== "number") {
      throw "No row ID!";
    }

    this.dbInsertFTS.run([rowID, name, categories.join(" "), summary || "", content || ""]);

    categories.forEach((category) => {
      this.dbInsertCategory.run([category, rowID as number]);
    });
  }


  async index(url: string, html: string) {
    const scraped = await scraper({ html, url });

    let name = scraped.title;
    let summary = scraped.description;
    let categories: string[] = [];

    var content: string | undefined;
    var published: Date | undefined;
    var updated: Date | undefined;

    const mf = mf2(html, { baseUrl: url })
    const entries = mf.items.filter((item) => item.type!.includes("h-entry"));

    if (entries.length == 1) {
      const entry = entries[0];

      name = mfProp(entry, "name") as string || name;
      summary = mfProp(entry, "summary") as string || summary;

      let rawContent = mfProp(entry, "content");
      content = rawContent ? htmlToText((rawContent as { html: string }).html, htmlOptions) : undefined;

      if ("category" in entry.properties) {
        categories = entry.properties["category"] as string[];
      }

      let rawPublished = mfProp(entry, "published") as string;
      published = rawPublished ? new Date(rawPublished) : undefined;

      let rawUpdated = mfProp(entry, "updated") as string;
      updated = rawUpdated ? new Date(rawUpdated) : undefined;
    }

    if (categories.includes("unlisted")) {
      console.log("Skipping unlisted %s", url);
    } else {
      if (!content) {
        let article = await extract(html);
        if (article.content) {
          content = htmlToText(article.content, htmlOptions);
        }
      }

      this.insertEntry(url, name, categories, summary, content, published, updated);
      console.log("Indexed %s (%s)", url, name);
    }
  }

  finalize() {
    this.db.exec("pragma journal_mode = delete;");
    this.db.exec("pragma page_size = 4096;");
    this.db.exec("insert into ftsentries(ftsentries) values ('optimize');");
    this.db.exec("vacuum;");

    return this.db.export();
  }
}
