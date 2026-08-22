import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPage() {
	const [params] = useSearchParams();
	const next = params.get("next") || "/create";
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const { error: signInError } = await signIn.email({ email, password });
		setLoading(false);
		if (signInError) {
			setError(signInError.message ?? "Failed to log in");
			return;
		}
		navigate(next);
	}

	function handleOAuth(provider: "google" | "github") {
		void signIn.social({ provider, callbackURL: `${window.location.origin}${next}` });
	}

	return (
		<div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
			<Card>
				<CardHeader>
					<CardTitle>Log in</CardTitle>
					<CardDescription>Welcome back.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Button variant="outline" type="button" onClick={() => handleOAuth("google")}>
							Continue with Google
						</Button>
						<Button variant="outline" type="button" onClick={() => handleOAuth("github")}>
							Continue with GitHub
						</Button>
					</div>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
					</div>
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<Button type="submit" disabled={loading}>
							{loading ? "Logging in…" : "Log in"}
						</Button>
					</form>
					<div className="flex justify-between text-sm text-muted-foreground">
						<Link to={`/forgot?next=${encodeURIComponent(next)}`} className="hover:text-foreground">
							Forgot password?
						</Link>
						<Link to={`/signup?next=${encodeURIComponent(next)}`} className="hover:text-foreground">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
