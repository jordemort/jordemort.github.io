import type { QueryExecResult } from "sql.js";
import type { WorkerHttpvfs } from "sql.js-httpvfs";

export interface SearchResult {
  url: string
  name: string
  categories?: string
  summary?: string
  content: string
}

const sqlQuery = `
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
      snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 0) as name,
      snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 1) as categories,
      snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 2) as summary,
      snippet(ftsentries, "[MATCH]", "[/MATCH]", "...", 3) as content,
      entries.published AS published
    FROM ftsentries, entries
    WHERE ftsentries MATCH ? AND entries.entry_id = ftsentries.docid
  )
  ORDER BY (name_rank * 5 + categories_rank * 3 + summary_rank + content_rank) DESC, published DESC;
`;


export class SearchClient {
  worker: WorkerHttpvfs;

  constructor(worker: WorkerHttpvfs) {
    this.worker = worker;
  }

  async search(query: string): Promise<SearchResult[]> {
    let q = await this.worker.db.exec(sqlQuery, [query]);

    if (q.length != 1) {
      return [];
    }

    let records = q.shift() as QueryExecResult;
    let results = records.values.map((row) => (
      {
        url: row[0] as string,
        name: row[1] as string,
        categories: row[2] as string,
        summary: row[3] as string,
        content: row[4] as string,
      }
    ));

    return results;
  }
}
