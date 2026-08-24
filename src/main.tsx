import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { AppRoutes } from "./routes";
import { startVersionCheck } from "./lib/version-check";

// Outside React on purpose: this watches the DOCUMENT, not any component,
// and must keep running for the life of the tab (StrictMode would
// double-invoke it in an effect, and a route change must never restart it).
// Dev is exempt — Vite's own HMR is the source of truth there.
if (import.meta.env.PROD) startVersionCheck();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	</StrictMode>,
);
