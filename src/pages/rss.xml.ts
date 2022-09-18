import { makeFeed, injectXSL } from "../utils/makeFeed";

export const get = () => {
  return { body: injectXSL(makeFeed().rss2(), "/feed.xsl") };
}
