import css from "css";
import { v4 as uuidv4 } from 'uuid';


function addUUID(node, uuid) {
  if (node.type != "element") {
    return;
  }

  // add uuid as a class
  if (node.tagName != "style") {
    console.log(node);
    console.log(node.properties.className);
    if (node.properties.className) {
      node.properties.className += " " + uuid
    } else {
      node.properties.className = uuid
    }
    console.log(node.properties.className);
  }

  // add it to all the children too
  node.children.forEach((child) => { addUUID(child, uuid); });
}

function rewriteCSS(styles, uuid) {
  let parsed = css.parse(styles);

  // add :where(.uuid) to all the selectors
  parsed.stylesheet.rules.forEach((rule) => {
    rule.selectors = rule.selectors.map((selector) => `${selector}:where(.${uuid} *)`);
    //console.log(rule);
  });

  return css.stringify(parsed);
}

function rewriteStyles(node, uuid)
{
  if (node.type != "element") {
    return;
  }

  // rewrite any child <style> tags
  node.children.forEach((child) => { rewriteStyles(child, uuid); });

  if (node.tagName != "style") {
    return;
  }

  // rewrite any text nodes
  node.children.forEach((child) => {
    if (child.type === "text") {
      child.value = rewriteCSS(child.value, uuid);
    }
  });
}

export function rewriteKroki(node) {
  let height = node.properties.height;
  let width = node.properties.width;

  delete node.properties.style;
  delete node.properties.height;
  delete node.properties.width;

  node.properties.preserveAspectRatio = "xMidYMid";

  // if there is no viewBox, synthesize one
  if (height && width && !node.properties.viewBox) {
    node.properties.viewBox = `0 0 ${width} ${height}`;
  }

  // generate a uuid for style scoping
  let uuid = uuidv4();

  /*
  if (node.properties.class) {
    node.properties.class += " " + uuid
  } else {
    node.properties.class = uuid
  }
  */
  // add the uuid as a class to all child elements
  addUUID(node, uuid);

  // scope any inline <style>s to the uuid
  rewriteStyles(node, uuid);
}
