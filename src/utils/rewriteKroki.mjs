import css from "css";
import { v4 as uuidv4 } from 'uuid';

const stripProps = /(?<=^|;)\s*(?=min-|max-)?(height|width)\s*:\s*([^;]+)\s*;?/gim;

function isMermaid(node) {
  return node.properties.id && node.properties.id.startsWith("mermaid-");
}

function rewriteCSS(styles, uuid) {
  let parsed = css.parse(styles);

  // add uuid to all selectors
  parsed.stylesheet.rules.forEach((rule) => {
    rule.selectors = rule.selectors.map((selector) => `#${uuid} ${selector}`);
  });

  return css.stringify(parsed);
}

function rewriteStyles(node, uuid)
{
  if (node.type != "element") {
    return;
  }

  if (node.tagName != "style") {
    // rewrite any child <style> tags
    node.children.forEach((child) => { rewriteStyles(child, uuid); });
    return;
  }

  // rewrite CSS in text nodes
  node.children.forEach((child) => {
    if (child.type === "text") {
      child.value = rewriteCSS(child.value, uuid);
    }
  });
}

export function rewriteKroki(node) {
  let height = node.properties.height;
  let width = node.properties.width;

  if (node.properties.style) {
    node.properties.style = node.properties.style.replace(stripProps, "");
  }

  delete node.properties.height;
  delete node.properties.width;

  node.properties.preserveAspectRatio = "xMidYMid";

  // if there is no viewBox, synthesize one
  if (height && width && !node.properties.viewBox) {
    node.properties.viewBox = `0 0 ${width} ${height}`;
  }

  // mermaid is a good citizen and scopes its styles
  if (isMermaid(node)) {
    return
  }

  // give the svg a unique ID
  let uuid = "fig-" + uuidv4();
  node.properties.id = uuid;

  // scope any inline <style>s include the ID
  rewriteStyles(node, uuid);
}
