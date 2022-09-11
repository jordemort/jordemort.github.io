import css from "css";

const stripStyle = /(?<=^|;)\s*(?=min-|max-)?(height|width)\s*:\s*([^;]+)\s*;?/gim;

function isMermaid(node) {
  return node.properties.id && node.properties.id.startsWith("mermaid-");
}

function rewriteCSS(styles, node_id) {
  let parsed = css.parse(styles);

  // add node_id to all selectors
  parsed.stylesheet.rules.forEach((rule) => {
    rule.selectors = rule.selectors.map((selector) => `#${node_id} ${selector}`);
  });

  return css.stringify(parsed);
}

function rewriteStyles(node, node_id)
{
  if (node.type != "element") {
    return;
  }

  if (node.tagName != "style") {
    // rewrite any child <style> tags
    node.children.forEach((child) => { rewriteStyles(child, node_id); });
    return;
  }

  // rewrite CSS in text nodes
  node.children.forEach((child) => {
    if (child.type === "text") {
      child.value = rewriteCSS(child.value, node_id);
    }
  });
}

export function rewriteKroki(node) {
  let height = node.properties.height;
  let width = node.properties.width;

  if (node.properties.style) {
    node.properties.style = node.properties.style.replace(stripStyle, "");
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

  // generate a unique ID for the node based on its position
  let node_id = "svg-" + [
    node.position.start.line,
    node.position.start.column,
    node.position.start.offset
  ].join("-");

  // give the node the ID we generated
  node.properties.id = node_id;

  // rewrite all the styles to include the node ID
  rewriteStyles(node, node_id);
}
