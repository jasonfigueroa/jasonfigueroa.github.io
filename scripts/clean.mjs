import { rm } from 'node:fs/promises';

// Start each build from an empty output directory so removed pages and drafts
// cannot survive in a deployment artifact from a previous build.
await rm(new URL('../_site/', import.meta.url), { recursive: true, force: true });
