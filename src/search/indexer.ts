import initSqlJs from 'sql.js';
import type { Database, Statement } from 'sql.js';
import { mf2 } from "microformats-parser";

const sql = await initSqlJs();

const schema = `
  CREATE TABLE entries (
    entry_id INTEGER PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    published TEXT NOT NULL,
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

export class Indexer {
  db: Database;
  dbInsertEntry: Statement;
  dbLastRowID: Statement;
  dbInsertCategory: Statement;
  dbInsertFTS: Statement;

  //insert: Statement;

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
    summary: string,
    content: string,
    published: Date,
    updated?: Date
  )
  {
    const sqlPublished = published.toISOString();
    const sqlUpdated = updated ? updated.toISOString() : null;

    this.dbInsertEntry.run([url, sqlPublished, sqlUpdated]);

    let rowID: number | undefined = undefined;

    while (this.dbLastRowID.step()) {
      rowID = (this.dbLastRowID.get() as number[])[0];
    }

    if (typeof rowID !== "number") {
      throw "No row ID!";
    }

    this.dbInsertFTS.run([rowID, name, categories.join(" "), summary, content]);

    categories.forEach((category) => {
      this.dbInsertCategory.run([category, rowID as number]);
    });
  }

  index(url: string, html: string) {
    const parsed = mf2(html, { baseUrl: url })
    const entries = parsed.items.filter((item) => item.type!.includes("h-entry"));

    if (entries.length != 1) {
      return;
    }

    const entry = entries.pop();
    const categories = entry?.properties["category"] ? (entry?.properties["category"] as string[]) : [];

    if (categories.includes("unlisted")) {
      return;
    }

    const name = entry?.properties["name"].pop() as string;
    const summary = entry?.properties["summary"].pop() as string;
    const content = (entry?.properties["content"].pop()?.valueOf() as { value: string }).value;
    const published = new Date(entry?.properties["published"].pop() as string);
    const maybeUpdated = entry?.properties["updated"].pop();
    const updated = maybeUpdated ? new Date(maybeUpdated as string) : undefined;

    this.insertEntry(url, name, categories, summary, content, published, updated);
    console.log("Indexed %s", url);
  }

  finalize() {
    this.db.exec("pragma journal_mode = delete;");
    this.db.exec("pragma page_size = 4096;");
    this.db.exec("insert into ftsentries(ftsentries) values ('optimize');");
    this.db.exec("vacuum;");

    return this.db.export();
  }
}
