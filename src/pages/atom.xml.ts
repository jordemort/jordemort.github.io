import { makeFeed, injectXSL } from "../utils/makeFeed";

export const get = () => {
  return { body: injectXSL(makeFeed().atom1(), "/feed.xsl") };
}
