import type { ReactNode } from "react";
import { Link } from "react-router";
import { useSession, signOut } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
	const { data: session } = useSession();

	return (
		<div className="flex min-h-svh flex-col">
			<header className="flex h-16 items-center justify-between border-b border-border px-6">
				<Link to="/" className="font-display text-lg font-semibold">
					Portfolio Builder
				</Link>
				<nav className="flex items-center gap-3">
					{session ? (
						<>
							<Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
								Dashboard
							</Link>
							<Link to="/settings" className="text-sm text-muted-foreground hover:text-foreground">
								Settings
							</Link>
							<Button variant="outline" size="sm" onClick={() => signOut()}>
								Sign out
							</Button>
						</>
					) : (
						<>
							<Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
								Log in
							</Link>
							<Link to="/signup" className={cn(buttonVariants({ size: "sm" }))}>
								Sign up
							</Link>
						</>
					)}
				</nav>
			</header>
			<main className="flex-1">{children}</main>
		</div>
	);
}
