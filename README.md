# Jason Figueroa

A small Eleventy site for professional background and technical writing. HTML and CSS are generated at build time. Pages work without client-side JavaScript, external fonts, analytics, or a backend.

## Development

Use Node.js 24 and pnpm 11.25.0 (pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:8080`. Build and validate with:

```sh
pnpm test
```

The build starts with a clean `_site/`. Only that directory is deployed. The checks cover metadata, canonical URLs, profile/article structured data, internal links and section anchors, LinkedIn links, the sitemap, feed, and output files. They run on pull requests and pushes to `master`.

## Content

- `src/index.njk`: homepage.
- `src/about.njk`: professional background.
- `src/writing/*.md`: Markdown articles with front matter.
- `src/_data/site.js`: primary domain and profile links.
- `src/assets/site.css`: responsive layout, light/dark appearance, print styles.
- `design/social-preview.svg`: editable source for the committed 1200×630 sharing PNG.

The initial article's planned publication date is September 29, 2026. Set it to the actual publication date before the first deployment if launch happens later. Set `updated` only after a substantive content change. A `draft: true` article is omitted from generated pages, listings, feed, and sitemap. Drafts require a fresh build (`pnpm build`) to remove previously generated output.

Article template:

```yaml
---
layout: article.njk
title: A descriptive article title
description: A short, specific summary of what the reader will learn.
date: 2026-09-29
tags: article
category: Software engineering
permalink: /writing/example/
draft: true
---
```

Begin article content with an introduction; the layout supplies the page's h1. Use h2 for main sections. These become the table of contents automatically. Keep private career notes and source attachments outside the repository.

## SEO and audits

The site includes per-page titles and descriptions, canonical URLs, Open Graph sharing metadata, a local sharing image, `ProfilePage`/`Person` and `BlogPosting` JSON-LD, an Atom feed, `sitemap.xml`, and `robots.txt`. The 404 page has `noindex`.

With the preview server running and Chrome/Chromium available:

```sh
pnpm audit:site
# After launch:
pnpm audit:site https://jasonfigueroa.com
```

Set `CHROME_PATH` if Lighthouse cannot locate the browser. The script audits the four public pages using Lighthouse's default mobile profile, writes local HTML/JSON reports under ignored `reports/`, and checks targets of 100 SEO/accessibility and at least 95 performance/best practices. These are targets, not measured results or ranking guarantees. Run them against production after launch as well.

## Deployment

See [the deployment checklist](docs/deployment.md). The workflow builds, validates, uploads `_site/`, and publishes it through GitHub Pages. Initial deployment is manual from `master`; automatic deployment remains off until the repository variable `PAGES_AUTO_DEPLOY` is set to `true`. Pull requests never publish the site.

Old Pelican content is intentionally removed from the new site. Git history and the existing `site` branch retain the previous implementation. Old articles have no replacement and should return the custom 404 with HTTP status 404. Do not redirect unrelated old articles to the homepage.
