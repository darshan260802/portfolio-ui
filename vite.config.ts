import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// Two HTML entries: index.html is the builder app (gallery, wizard,
// dashboard, settings — never imports a template component). preview.html
// is the isolated iframe entry that lazy-loads the actual template via
// @pb/templates/loaders. Rolldown keeps a module reachable from only one
// entry inside that entry's chunk, so template code and template global
// CSS never reach the builder bundle — see src/main.tsx vs src/preview.tsx
// and templates/loaders.ts vs templates/meta.ts for the other half of this
// isolation guarantee.
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
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
