import { toast } from "./toast-store";

/**
 * Forces every open tab onto the newest deployed build.
 *
 * Vite already content-hashes every JS/CSS asset, so those are safe to
 * cache forever. `index.html` is the one file that must never be cached —
 * it's what maps "the app" onto the current hashed filenames. When a proxy,
 * a CDN, or the browser's own HTTP cache serves a stale index.html anyway,
 * the user runs old code indefinitely with no symptom except bugs that were
 * already fixed. That's what this closes.
 *
 * How it decides: the id stamped into the loaded document
 * (`<meta name="pb-build-id">`, injected by vite.config.ts's buildStamp
 * plugin) is what the browser ACTUALLY has. `/version.json`, always fetched
 * `no-store`, is what the server currently serves. They disagree only when
 * the document came out of a cache — so a mismatch is, by construction, a
 * stale document, and reloading it fetches a fresh one that necessarily
 * agrees. That's why this can't loop the way a check against a value baked
 * into a hashed JS chunk would.
 *
 * Reloading is safe to do unprompted here: the wizard's in-progress content
 * lives in localStorage (lib/draft-store.ts), not React state, so it
 * survives a full document reload.
 */

const VERSION_URL = "/version.json";
const POLL_INTERVAL_MS = 5 * 60_000;
/** Set to the deployed id we've already reloaded for, so a server that stays inconsistent can't loop us. */
const RELOAD_GUARD_KEY = "pb:reloaded-for-build";
/** Added to the URL of the forced reload so the request can't be answered from the HTTP cache. */
const RELOAD_PARAM = "pb_v";

function loadedBuildId(): string | null {
	const meta = document.querySelector<HTMLMetaElement>('meta[name="pb-build-id"]');
	return meta?.content || null;
}

async function deployedBuildId(): Promise<string | null> {
	try {
		const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
		if (!res.ok) return null;
		const body: unknown = await res.json();
		if (typeof body === "object" && body !== null && "buildId" in body) {
			const { buildId } = body as { buildId: unknown };
			return typeof buildId === "string" && buildId.length > 0 ? buildId : null;
		}
		return null;
	} catch {
		// Offline, or the server is briefly unreachable mid-deploy. Not an
		// error worth surfacing — the next poll will settle it.
		return null;
	}
}

/**
 * Drops everything that could hand the browser the old document back, then
 * navigates (not `location.reload()`, which some browsers answer from the
 * same cache entry that made us stale) to a one-shot cache-busted URL.
 */
async function forceReload(deployedId: string): Promise<void> {
	try {
		sessionStorage.setItem(RELOAD_GUARD_KEY, deployedId);
	} catch {
		// Private mode / storage disabled. Losing the guard only costs us
		// the loop protection below; the reload itself is still correct.
	}

	if ("serviceWorker" in navigator) {
		try {
			const registrations = await navigator.serviceWorker.getRegistrations();
			await Promise.all(registrations.map((r) => r.unregister()));
		} catch {
			/* nothing registered, or blocked — proceed either way */
		}
	}
	if ("caches" in window) {
		try {
			const keys = await caches.keys();
			await Promise.all(keys.map((k) => caches.delete(k)));
		} catch {
			/* Cache Storage unavailable — proceed either way */
		}
	}

	const url = new URL(window.location.href);
	url.searchParams.set(RELOAD_PARAM, deployedId);
	window.location.replace(url.toString());
}

let checking = false;

async function check(): Promise<void> {
	if (checking) return;
	checking = true;
	try {
		const loaded = loadedBuildId();
		const deployed = await deployedBuildId();
		if (!loaded || !deployed || loaded === deployed) return;

		let alreadyReloaded: string | null = null;
		try {
			alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD_KEY);
		} catch {
			/* storage disabled — treat as "haven't reloaded yet" */
		}

		if (alreadyReloaded === deployed) {
			// We reloaded for this exact deployed id and came back still
			// stale, so something upstream of the browser (a CDN, a proxy)
			// is pinning index.html. Reloading again would just spin, so
			// hand it to the user instead of hiding it.
			console.warn(
				`[version-check] still running build "${loaded}" after reloading for "${deployed}" — ` +
					`something upstream is caching index.html.`,
			);
			toast.info(
				"A new version is available",
				"Your browser keeps loading a cached copy. Try a hard refresh (Ctrl/Cmd + Shift + R).",
			);
			return;
		}

		await forceReload(deployed);
	} finally {
		checking = false;
	}
}

/**
 * Starts the check: once now, on every return to the tab, and on a slow
 * interval for tabs left open. Returns a teardown function (unused by the
 * app entry, which lives as long as the document — it's there so this
 * stays testable and safe to call from a component).
 */
export function startVersionCheck(): () => void {
	// The forced reload leaves its cache-busting param in the address bar;
	// strip it so the URL the user sees, copies, or bookmarks stays clean.
	const url = new URL(window.location.href);
	if (url.searchParams.has(RELOAD_PARAM)) {
		url.searchParams.delete(RELOAD_PARAM);
		window.history.replaceState(window.history.state, "", url.toString());
	}

	void check();

	const onVisible = () => {
		if (document.visibilityState === "visible") void check();
	};
	document.addEventListener("visibilitychange", onVisible);
	const interval = setInterval(() => void check(), POLL_INTERVAL_MS);

	return () => {
		document.removeEventListener("visibilitychange", onVisible);
		clearInterval(interval);
	};
}
