import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../config';

function getRSSPosts() {
	let posts = Object.values(
		import.meta.globEager('./blog/**/*.md')
	).sort((a, b) =>
		new Date(b.frontmatter.pubDate).valueOf() -
		new Date(a.frontmatter.pubDate).valueOf()
	).map(post => ({
		link: post.url + '/',
		title: post.frontmatter.title,
		description: post.frontmatter.description,
		pubDate: new Date(post.frontmatter.pubDate)
	}));

	if (posts.length > 10) {
		posts.length = 10;
	}

	return posts;
}

export const get = () =>
	rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: import.meta.env.SITE,
		items: getRSSPosts()
	});
