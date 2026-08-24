import { randomBytes } from "node:crypto";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

/**
 * The id every deployed copy of the app is stamped with. It lands in two
 * places that must always agree:
 *
 *  - a `<meta name="pb-build-id">` in index.html — i.e. in the DOCUMENT the
 *    browser actually loaded, stale or not;
 *  - `version.json` at the web root, which is always fetched `no-store`.
 *
 * src/lib/version-check.ts compares the two: a mismatch means the browser
 * is running a document that came out of a cache, and it force-reloads.
 * Deriving the client's side from the loaded document (rather than from a
 * value compiled into a hashed JS chunk) is what makes that comparison
 * self-correcting — the reload fetches a fresh document, so the two sides
 * necessarily agree afterwards and a reload loop is impossible. It's also
 * what lets `bun run cachebust` force every visitor onto a fresh load
 * without a rebuild: it rewrites exactly these two values in place.
 *
 * VITE_BUILD_ID lets CI pin the id to something meaningful (a git SHA).
 */
const BUILD_ID = process.env.VITE_BUILD_ID || `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;

function buildStamp(buildId: string): Plugin {
	return {
		name: "pb-build-stamp",
		transformIndexHtml: {
			order: "pre",
			handler(_html, ctx) {
				// preview.html is the isolated template iframe — it's loaded by
				// the app, never navigated to directly, so it has no reason to
				// run (or carry the stamp for) a version check of its own.
				if (!ctx.path.endsWith("/index.html")) return;
				return [
					{
						tag: "meta",
						attrs: { name: "pb-build-id", content: buildId },
						injectTo: "head-prepend",
					},
				];
			},
		},
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "version.json",
				source: `${JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2)}\n`,
			});
		},
		// `vite dev` never emits version.json, so serve it from memory —
		// otherwise the dev server 404s and the check can't be exercised
		// locally at all.
		configureServer(server) {
			server.middlewares.use("/version.json", (_req, res) => {
				res.setHeader("Content-Type", "application/json");
				res.setHeader("Cache-Control", "no-store");
				res.end(JSON.stringify({ buildId, builtAt: new Date().toISOString() }));
			});
		},
	};
}

// Two HTML entries: index.html is the builder app (gallery, wizard,
// dashboard, settings — never imports a template component). preview.html
// is the isolated iframe entry that lazy-loads the actual template via
// @pb/templates/loaders. Rolldown keeps a module reachable from only one
// entry inside that entry's chunk, so template code and template global
// CSS never reach the builder bundle — see src/main.tsx vs src/preview.tsx
// and templates/loaders.ts vs templates/meta.ts for the other half of this
// isolation guarantee.
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(), buildStamp(BUILD_ID)],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
		// @pb/templates is a `file:` (symlinked) dependency. Without this,
		// Vite realpath-resolves imports reached through that symlink — e.g.
		// the aurora chunk's `react/compiler-runtime` — against the
		// TEMPLATES REPO's own node_modules/react rather than this app's,
		// producing two separate React instances with two separate internals
		// singletons. The compiler runtime's useMemoCache then reads a
		// dispatcher (`H`) that's null, because react-dom only ever sets it
		// on the copy it actually renders with. `dedupe` forces both to
		// resolve to this app's single copy regardless of the symlink hop.
		dedupe: ["react", "react-dom"],
	},
	build: {
		rollupOptions: {
			input: {
				main: fileURLToPath(new URL("./index.html", import.meta.url)),
				preview: fileURLToPath(new URL("./preview.html", import.meta.url)),
			},
		},
	},
});
