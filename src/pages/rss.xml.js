import { makeFeed } from "../utils/makeFeed.mjs";

export const get = () => {
  return { body: makeFeed().rss2() };
}
