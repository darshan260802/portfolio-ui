#!/usr/bin/env bun
/**
 * Forces every visitor off their cached copy of the app — one command, no
 * rebuild required.
 *
 *   bun run cachebust                 # re-stamps ./dist
 *   bun run cachebust --dir /srv/app  # re-stamps a deployed web root
 *   bun run cachebust --id $(git rev-parse --short HEAD)
 *
 * A normal `bun run build` already stamps a fresh id (see vite.config.ts's
 * buildStamp plugin), so this is not needed for an ordinary deploy — the
 * new build's own id is what makes open tabs reload. Reach for this when
 * the FILES are already right but people are still being served an old
 * document: a CDN/proxy that cached index.html, a rollback that restored
 * an older index.html, or any "just make everyone reload now" moment.
 *
 * It rewrites the only two places the id lives — the `<meta name="pb-build-id">`
 * in index.html and version.json — so they stay in agreement. That
 * agreement is the whole contract src/lib/version-check.ts relies on:
 * clients holding a cached document see a stamp that no longer matches
 * version.json and reload once; the reload fetches the rewritten document,
 * the two agree again, and nothing loops.
 *
 * Hashed JS/CSS assets are deliberately untouched — their filenames are
 * their cache keys, so they never go stale in the first place.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join, resolve } from "node:path";

interface Args {
	dir: string;
	id: string | null;
}

function parseArgs(argv: string[]): Args {
	let dir = "dist";
	let id: string | null = null;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--dir" || arg === "-d") dir = argv[++i] ?? dir;
		else if (arg === "--id") id = argv[++i] ?? null;
		else if (arg === "--help" || arg === "-h") {
			console.log("Usage: bun run cachebust [--dir <web root>] [--id <build id>]");
			process.exit(0);
		} else {
			fail(`Unknown argument "${arg}". Try --help.`);
		}
	}
	return { dir, id };
}

function fail(message: string): never {
	console.error(`[cachebust] ${message}`);
	process.exit(1);
}

function newBuildId(): string {
	return `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

const { dir, id: requestedId } = parseArgs(process.argv.slice(2));
const root = resolve(dir);
const indexPath = join(root, "index.html");
const versionPath = join(root, "version.json");

if (!existsSync(indexPath)) {
	fail(`No index.html in ${root}. Run \`bun run build\` first, or pass --dir <web root>.`);
}

const html = readFileSync(indexPath, "utf8");
const stampPattern = /(<meta\s+name="pb-build-id"\s+content=")([^"]*)(")/i;
const match = stampPattern.exec(html);
if (!match) {
	fail(
		`${indexPath} has no <meta name="pb-build-id"> stamp. It was built before the cache buster existed — ` +
			`rebuild with \`bun run build\` once, then this command works on every deploy after.`,
	);
}

const previousId = match[2];
const buildId = requestedId ?? newBuildId();
if (buildId === previousId) {
	fail(`--id "${buildId}" is already the deployed id — pick a different one or omit --id.`);
}

writeFileSync(indexPath, html.replace(stampPattern, `$1${buildId}$3`));
writeFileSync(versionPath, `${JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2)}\n`);

console.log(`[cachebust] ${root}`);
console.log(`[cachebust]   was: ${previousId || "(empty)"}`);
console.log(`[cachebust]   now: ${buildId}`);
console.log(
	`[cachebust] Open tabs reload within ~5 minutes (immediately when refocused). ` +
		`Make sure index.html and version.json are served with "Cache-Control: no-store" — see README.`,
);
