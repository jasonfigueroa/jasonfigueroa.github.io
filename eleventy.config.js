import markdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { load } from 'cheerio';

export default function (config) {
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addPassthroughCopy({ 'src/.nojekyll': '.nojekyll' });
  config.setLibrary('md', markdownIt({ html: true, typographer: false }).use(anchor, {
    slugify: value => value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-'),
  }));
  config.addFilter('absoluteUrl', (path, base) => new URL(path, base).href);
  config.addFilter('isoDate', date => new Date(date).toISOString());
  config.addFilter('readableDate', date => new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date)));
  config.addFilter('json', value => JSON.stringify(value).replaceAll('<', '\\u003c'));
  config.addFilter('toc', html => {
    const $ = load(html);
    return $('h2[id]').toArray().map(el => ({ id: $(el).attr('id'), text: $(el).text() }));
  });
  config.addCollection('articles', api => api.getFilteredByTag('article')
    .filter(item => !item.data.draft)
    .sort((a, b) => b.date - a.date));
  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    templateFormats: ['md', 'njk'],
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
  };
}
