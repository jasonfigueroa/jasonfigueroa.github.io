export default {
  canonical: data => new URL(data.page.url, data.site.url).href,
  pageTitle: data => data.title ? `${data.title} | ${data.site.name}` : `${data.site.name} | .NET Software Engineer`,
  schema: data => {
    const person = {
      '@type': 'Person',
      '@id': `${data.site.url}/about/#person`,
      name: data.site.name,
      url: `${data.site.url}/about/`,
      sameAs: [data.site.github, data.site.linkedin],
    };
    if (data.page.url === '/about/') return {
      '@context': 'https://schema.org', '@type': 'ProfilePage',
      url: data.canonical, mainEntity: person,
    };
    if (data.layout === 'article.njk') return {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: data.title, description: data.description,
      mainEntityOfPage: data.canonical, url: data.canonical,
      author: person, image: new URL(data.site.image, data.site.url).href,
      datePublished: new Date(data.date).toISOString(),
      dateModified: new Date(data.updated || data.date).toISOString(),
      inLanguage: 'en-US',
    };
    return {
      '@context': 'https://schema.org', '@type': 'WebSite',
      '@id': `${data.site.url}/#website`, name: data.site.name,
      url: data.site.url, author: person,
    };
  },
};
