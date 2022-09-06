// If no layout is specified, use the BlogPost layout

export function defaultLayoutPlugin() {
  return function (_, file) {
    if (typeof file.data.astro.frontmatter.layout === "undefined" || file.data.astro.frontmatter.layout === null) {
      file.data.astro.frontmatter.layout = "/src/layouts/BlogPost.astro";
    }
  }
}
