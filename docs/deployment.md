# Deployment checklist

Prepared for `jasonfigueroa/jasonfigueroa.github.io`, with `https://jasonfigueroa.com` as the primary URL.

## Before launch

1. Review the built Home, About, Writing, and full article pages on desktop and mobile.
2. Review the article's commands and updater as publication content. Its tested-environment statement comes from the author's supplied guide; the build checks do not prove a fresh Void installation. The source attachment was not altered.
3. Confirm the article's actual publication date. Run `pnpm test` and `pnpm audit:site` against a running preview. Resolve any audit failures before launch.
4. Open/review a pull request from `feat/eleventy-personal-site` into `master`. Preserve the old history and `site` branch. Merging alone will not deploy unless `PAGES_AUTO_DEPLOY` is already enabled.

## Domain and hosting

A public NS lookup on September 29, 2026 returned `ns1.vultr.com` and `ns2.vultr.com`. The user also confirmed those nameservers in Namecheap's Custom DNS screen. Namecheap is the registrar; the active DNS zone is at Vultr. Changing nameservers is unnecessary.

1. The repository's Pages settings were verified on September 29, 2026: legacy publishing from the `site` branch at `/`, no custom domain, HTTPS enforced, and `https://jasonfigueroa.github.io/` as the published URL. Set Source to **GitHub Actions** when ready to switch hosting.
2. Verify ownership of the custom domain in the GitHub account's Pages settings. Add the exact verification TXT record GitHub supplies to the Vultr DNS zone.
3. Set the repository's Pages custom domain to `jasonfigueroa.com` **before** pointing DNS at GitHub.
4. Record the current DNS values for rollback. Update only web-hosting records in Vultr; preserve mail records, verification records, and unrelated subdomains.
5. For the root/apex domain, use GitHub's documented A records:

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   If using AAAA records, use the four GitHub IPv6 values from the linked documentation. Remove or replace obsolete apex A/AAAA records that still point to the previous web host; do not leave competing web destinations.
6. Point `www` with a CNAME to `jasonfigueroa.github.io` (no scheme or path). Resolve any existing conflicting `www` records. Keep the apex as the chosen Pages custom domain.
7. From `master`, run **Deploy to GitHub Pages** manually in Actions. Confirm the uploaded artifact came from the validated build.
8. Once DNS and the certificate are ready, enable **Enforce HTTPS**. Verify the apex, `www`, and GitHub Pages addresses resolve to the intended primary site.

GitHub Actions publishing does not require a `CNAME` file in the artifact; the custom domain is configured in repository settings.

## After launch

- Check HTTP status 200 on the four current pages and 404 on retired article paths and a random nonexistent URL.
- Check real navigation, code wrapping, article section links, LinkedIn/GitHub links, and the sharing image.
- Repeat Lighthouse on the deployed domain and validate structured data with Google's Rich Results Test.
- Verify a Google Search Console domain property using its supplied DNS TXT record and submit `https://jasonfigueroa.com/sitemap.xml`.
- Enable repository variable `PAGES_AUTO_DEPLOY=true` when normal pushes to `master` should publish automatically.
- Update the LinkedIn website link when desired. Do not expect immediate recrawling or search ranking changes.

## Rollback

Turn off `PAGES_AUTO_DEPLOY`, restore the prior Pages publishing configuration and recorded web DNS records as needed, and retain the old hosting until the new domain is verified. Git history and the original `site` branch remain available.

## References

- [GitHub Actions publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Custom-domain configuration and DNS values](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Verifying domain ownership](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
