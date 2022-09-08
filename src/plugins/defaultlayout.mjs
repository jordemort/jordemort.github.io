// If no layout is specified, use the BlogPost layout

export function defaultLayoutPlugin() {
  return function (_, file) {
    if (typeof file.data.astro.frontmatter.layout === "undefined" || file.data.astro.frontmatter.layout === null) {
      if (file.dirname.endsWith("/blog") || file.dirname.includes("/blog")) {
        file.data.astro.frontmatter.layout = "/src/layouts/BlogPost.astro";
      } else {
        file.data.astro.frontmatter.layout = "/src/layouts/Skeleton.astro";
      }
    }
  }
}
