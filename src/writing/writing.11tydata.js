export default {
  eleventyComputed: {
    permalink: data => data.draft ? false : data.permalink,
    eleventyExcludeFromCollections: data => Boolean(data.draft),
  },
};
