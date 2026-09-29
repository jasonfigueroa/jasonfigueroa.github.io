# Local validation — September 29, 2026

`pnpm test` passes for all five HTML pages (four public pages and the 404 page). It checks generated metadata, canonical URLs, JSON-LD, LinkedIn identity links, local links and fragments, sitemap coverage, feed, and deployment files. `git diff --check` passes.

Lighthouse 13.5.0 was run against `http://localhost:8080` using its default mobile profile and a temporary Chrome Headless Shell 151 binary. These are local lab results, not measurements of GitHub Pages or a guarantee of search rankings.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Home | 100 | 100 | 100 | 100 |
| About | 100 | 100 | 100 | 100 |
| Writing | 100 | 100 | 100 | 100 |
| Void Linux article | 100 | 100 | 100 | 100 |

Reports were captured between 12:11 and 12:13 UTC. Full HTML and JSON reports are in the ignored local `reports/` directory. The audit command exits unsuccessfully if SEO/accessibility fall below 100 or performance/best practices below 95.

Desktop homepage and article rendering were inspected in the in-app browser; the narrow viewport showed no horizontal document overflow. Article installation commands were not executed. The supplied guide's environment claims remain the author's reported tests.

Before production launch, review the article and actual publication date, complete the domain setup, then rerun the audits against the live domain. GitHub Actions runs, domain redirects, production 404 status, certificate issuance, and Search Console indexing have not been verified because the replacement has not been deployed.
