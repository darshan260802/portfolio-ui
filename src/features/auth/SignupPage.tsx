import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignupPage() {
	const [params] = useSearchParams();
	const next = params.get("next") || "/create";
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [verifyEmailSent, setVerifyEmailSent] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const { error: signUpError } = await signUp.email({ name, email, password });
		setLoading(false);
		if (signUpError) {
			setError(signUpError.message ?? "Failed to sign up");
			return;
		}
		// requireEmailVerification is on — the user isn't signed in yet.
		setVerifyEmailSent(true);
	}

	function handleOAuth(provider: "google" | "github") {
		void signIn.social({ provider, callbackURL: `${window.location.origin}${next}` });
	}

	if (verifyEmailSent) {
		return (
			<div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16 text-center">
				<h1 className="font-display text-xl font-semibold">Check your email</h1>
				<p className="text-sm text-muted-foreground">
					We sent a verification link to {email}. Click it to finish creating your account.
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
			<Card>
				<CardHeader>
					<CardTitle>Create an account</CardTitle>
					<CardDescription>Takes about a minute.</CardDescription>
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
							<Label htmlFor="name">Name</Label>
							<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
						</div>
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
								minLength={8}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
						<Button type="submit" disabled={loading}>
							{loading ? "Creating account…" : "Sign up"}
						</Button>
					</form>
					<p className="text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link to={`/login?next=${encodeURIComponent(next)}`} className="text-foreground underline">
							Log in
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
