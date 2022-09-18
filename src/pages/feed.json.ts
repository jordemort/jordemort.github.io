import { makeFeed } from "../utils/makeFeed";

export const get = () => {
  return { body: makeFeed().json1() };
}
