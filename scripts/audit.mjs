import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Run against an already-running local preview, or pass the deployed origin.
// Chrome is discovered by Lighthouse; CHROME_PATH can select an installation.
const base = new URL(process.argv[2] || 'http://localhost:8080');
const pages = [
  ['home', '/'],
  ['about', '/about/'],
  ['writing', '/writing/'],
  ['article', '/writing/chatgpt-desktop-void-linux/'],
];
await mkdir('reports', { recursive: true });
const scores = [];
for (const [name, pathname] of pages) {
  const result = spawnSync(process.execPath, [
    fileURLToPath(import.meta.resolve('lighthouse/cli/index.js')),
    new URL(pathname, base).href,
    '--chrome-flags=--headless',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json', '--output=html', `--output-path=reports/${name}`,
    '--quiet',
  ], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  const report = JSON.parse(await readFile(`reports/${name}.report.json`, 'utf8'));
  if (report.runtimeError) throw new Error(`${name}: ${report.runtimeError.message}`);
  scores.push({ page: name, ...Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])) });
}
await writeFile('reports/summary.json', JSON.stringify(scores, null, 2) + '\n');
console.table(scores);
if (scores.some(score => score.seo < 100 || score.accessibility < 100 || score.performance < 95 || score['best-practices'] < 95)) process.exitCode = 1;
