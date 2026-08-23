import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toast";
import { MagneticButton } from "@/components/animated/MagneticButton";
import { usePrefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

function Logo() {
	return (
		<Link to="/" className="group flex items-center gap-2">
			<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden className="shrink-0">
				<rect x="1" y="1" width="8.5" height="8.5" rx="2" className="fill-primary" />
				<rect
					x="12.5"
					y="1"
					width="8.5"
					height="8.5"
					rx="2"
					className="fill-transparent stroke-current text-border transition-colors group-hover:text-accent"
					strokeWidth="1.5"
				/>
				<rect x="1" y="12.5" width="8.5" height="8.5" rx="2" className="fill-accent" />
				<rect
					x="12.5"
					y="12.5"
					width="8.5"
					height="8.5"
					rx="2"
					className="fill-transparent stroke-current text-border transition-colors group-hover:text-primary"
					strokeWidth="1.5"
				/>
			</svg>
			<span className="font-display text-lg font-semibold tracking-tight">Portfolio Builder</span>
		</Link>
	);
}

interface NavItemProps {
	to: string;
	children: ReactNode;
}

function NavItem({ to, children }: NavItemProps) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				cn(
					"relative px-1 py-1.5 text-sm transition-colors",
					isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
				)
			}
		>
			{({ isActive }) => (
				<>
					{children}
					{isActive && (
						<motion.span
							layoutId="nav-underline"
							className="absolute inset-x-0 -bottom-[calc(0.5rem+1px)] h-px bg-primary"
							transition={{ type: "spring", stiffness: 500, damping: 40 }}
						/>
					)}
				</>
			)}
		</NavLink>
	);
}

export function Layout({ children }: { children: ReactNode }) {
	const { data: session } = useSession();
	const location = useLocation();
	const [menuOpen, setMenuOpen] = useState(false);
	const reducedMotion = usePrefersReducedMotion();

	// react-router's <BrowserRouter> never resets scroll on its own (that's
	// only what <ScrollRestoration> gives a data router). Without this, a
	// navigation from a tall page (e.g. a template's detail page) to a
	// shorter, fixed-height one (e.g. the wizard) leaves the window scrolled
	// past the new page's content — the new page is fully rendered, just
	// scrolled out of view, which looks exactly like a blank page until
	// something (like a resize) forces the browser to re-clamp scrollY.
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location.pathname]);

	return (
		<div className="flex min-h-svh flex-col">
			<header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
					<Logo />

					<nav className="hidden items-center gap-6 sm:flex">
						{session ? (
							<>
								<NavItem to="/dashboard">Dashboard</NavItem>
								<NavItem to="/settings">Settings</NavItem>
								<Button variant="outline" size="sm" onClick={() => signOut()}>
									Sign out
								</Button>
							</>
						) : (
							<>
								<Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
									Log in
								</Link>
								<MagneticButton>
									<Link to="/signup" className={cn(buttonVariants({ size: "sm" }))}>
										Sign up
									</Link>
								</MagneticButton>
							</>
						)}
					</nav>

					<button
						type="button"
						onClick={() => setMenuOpen((v) => !v)}
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						className="flex h-9 w-9 items-center justify-center rounded-md text-foreground sm:hidden"
					>
						{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				<AnimatePresence>
					{menuOpen && (
						<motion.nav
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
							className="overflow-hidden border-t border-border/70 sm:hidden"
						>
							<div className="flex flex-col gap-1 px-6 py-3">
								{session ? (
									<>
										<Link
											to="/dashboard"
											onClick={() => setMenuOpen(false)}
											className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
										>
											Dashboard
										</Link>
										<Link
											to="/settings"
											onClick={() => setMenuOpen(false)}
											className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
										>
											Settings
										</Link>
										<button
											type="button"
											onClick={() => {
												setMenuOpen(false);
												void signOut();
											}}
											className="rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
										>
											Sign out
										</button>
									</>
								) : (
									<>
										<Link
											to="/login"
											onClick={() => setMenuOpen(false)}
											className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
										>
											Log in
										</Link>
										<Link
											to="/signup"
											onClick={() => setMenuOpen(false)}
											className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
										>
											Sign up
										</Link>
									</>
								)}
							</div>
						</motion.nav>
					)}
				</AnimatePresence>
			</header>

			<AnimatePresence mode="wait" initial={false}>
				<motion.main
					key={location.pathname}
					initial={reducedMotion ? false : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
					transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
					className="min-h-0 flex-1"
				>
					{children}
				</motion.main>
			</AnimatePresence>

			<Toaster />
		</div>
	);
}
