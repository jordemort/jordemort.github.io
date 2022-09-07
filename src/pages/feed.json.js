import { makeFeed } from "../utils/makefeed.mjs";

export const get = () => {
  return { body: makeFeed().json1() };
}
