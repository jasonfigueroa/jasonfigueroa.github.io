import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import site from '../src/_data/site.js';

const root = path.resolve('_site');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = await walk(root);
const html = files.filter(file => file.endsWith('.html'));
const documents = new Map();
const titles = new Set();
const descriptions = new Set();
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
for (const file of html) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const url = '/' + relative.replace(/index\.html$/, '');
  const source = await readFile(file, 'utf8');
  const $ = load(source);
  documents.set(file, $);
  check($('html').attr('lang') === 'en', `${url}: missing language`);
  check($('h1').length === 1, `${url}: expected one h1`);
  check($('main').length === 1, `${url}: expected main landmark`);
  check($('meta[name="viewport"]').length === 1, `${url}: missing viewport`);
  check($('a[href="' + site.linkedin + '"]').length > 0, `${url}: LinkedIn link missing`);
  const title = $('title').text();
  check(title.includes(site.name) && !titles.has(title), `${url}: missing or duplicate title`);
  titles.add(title);
  const description = $('meta[name="description"]').attr('content') || '';
  check(description.length >= 40 && !descriptions.has(description), `${url}: missing or duplicate description`);
  descriptions.add(description);
  check($('link[rel="canonical"]').attr('href') === new URL(url, site.url).href, `${url}: wrong canonical`);
  check($('meta[property="og:url"]').attr('content') === new URL(url, site.url).href, `${url}: wrong sharing URL`);
  check($('meta[property="og:image"]').attr('content') === site.url + site.image, `${url}: missing social image`);
  check($('script[src]').length === 0, `${url}: unexpected client JavaScript`);
  check(!source.includes('undefined') && !source.includes('[object Object]'), `${url}: unresolved template value`);
  const ids = $('[id]').toArray().map(el => $(el).attr('id'));
  check(new Set(ids).size === ids.length, `${url}: duplicate HTML ids`);
  if (url === '/404.html') {
    check($('meta[name="robots"]').attr('content') === 'noindex, follow', '404 must not be indexed');
  } else {
    check(!$('meta[name="robots"]').attr('content')?.includes('noindex'), `${url}: accidentally noindexed`);
    try {
      const schema = JSON.parse($('script[type="application/ld+json"]').text());
      check(schema['@context'] === 'https://schema.org', `${url}: invalid schema context`);
      const person = schema.mainEntity || schema.author;
      check(person?.sameAs?.includes(site.linkedin), `${url}: schema missing LinkedIn identity`);
      if (url === '/about/') check(schema['@type'] === 'ProfilePage', 'About: missing ProfilePage');
      if (url.startsWith('/writing/') && url !== '/writing/') {
        check(schema['@type'] === 'BlogPosting', `${url}: missing article schema`);
        check(schema.mainEntityOfPage === site.url + url, `${url}: wrong article schema URL`);
        check(schema.headline === $('h1').text(), `${url}: schema headline differs from page`);
        check($('meta[property="og:type"]').attr('content') === 'article', `${url}: wrong sharing type`);
        check($('time').first().attr('datetime') === schema.datePublished, `${url}: inconsistent publication date`);
      }
    } catch (error) { errors.push(`${url}: invalid JSON-LD (${error.message})`); }
  }
}
for (const [file, $] of documents) {
  const pageUrl = new URL('/' + path.relative(root, file).replace(/index\.html$/, ''), site.url);
  for (const el of $('[href], [src]').toArray()) {
    const raw = $(el).attr('href') || $(el).attr('src');
    if (!raw || raw.startsWith('data:')) continue;
    const target = new URL(raw, pageUrl);
    if (target.origin !== site.url) continue;
    let targetPath = path.join(root, decodeURIComponent(target.pathname));
    try {
      if ((await stat(targetPath)).isDirectory()) targetPath = path.join(targetPath, 'index.html');
      await stat(targetPath);
      if (target.hash && documents.has(targetPath)) {
        const id = decodeURIComponent(target.hash.slice(1));
        const targetDoc = documents.get(targetPath);
        check(targetDoc('[id]').toArray().some(node => targetDoc(node).attr('id') === id), `${pageUrl.pathname}: missing anchor ${raw}`);
      }
    } catch { errors.push(`${pageUrl.pathname}: broken local link ${raw}`); }
  }
}
const sitemap = load(await readFile(path.join(root, 'sitemap.xml'), 'utf8'), { xmlMode: true });
const locations = sitemap('loc').toArray().map(el => sitemap(el).text());
const indexableUrls = html.filter(file => !file.endsWith('/404.html')).map(file => site.url + '/' + path.relative(root, file).replace(/index\.html$/, ''));
check(locations.length === indexableUrls.length && indexableUrls.every(url => locations.includes(url)), 'Sitemap must contain exactly the indexable HTML pages');
const feed = load(await readFile(path.join(root, 'feed.xml'), 'utf8'), { xmlMode: true });
check(feed('entry').length > 0, 'Feed has no articles');
check(locations.includes(feed('entry link').first().attr('href')), 'Feed article is absent from sitemap');
check((await readFile(path.join(root, 'robots.txt'), 'utf8')).includes(`Sitemap: ${site.url}/sitemap.xml`), 'Robots references the wrong sitemap');
check(files.some(file => file.endsWith('/.nojekyll')), 'Missing .nojekyll');
check((await stat(path.join(root, 'assets/social-preview.png'))).size < 200_000, 'Social preview exceeds 200 KB');
check(files.length === html.length + 7, 'Unexpected files in deployment output; check for legacy content');
assert.equal(errors.length, 0, errors.join('\n'));
console.log(`Validated ${html.length} HTML pages: metadata, structured data, LinkedIn, internal links and anchors, sitemap, feed, and deployment files.`);
