import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { requestPasswordReset } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPasswordPage() {
	const [params] = useSearchParams();
	const next = params.get("next") || "/create";
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const { error: reqError } = await requestPasswordReset({
			email,
			redirectTo: `${window.location.origin}/reset?next=${encodeURIComponent(next)}`,
		});
		setLoading(false);
		if (reqError) {
			setError(reqError.message ?? "Something went wrong");
			return;
		}
		setSent(true);
	}

	return (
		<div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
			<Card>
				<CardHeader>
					<CardTitle>Reset your password</CardTitle>
					<CardDescription>We'll email you a reset link.</CardDescription>
				</CardHeader>
				<CardContent>
					{sent ? (
						<p className="text-sm text-muted-foreground">
							If an account exists for {email}, a reset link is on its way.
						</p>
					) : (
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
							{error && <p className="text-sm text-destructive">{error}</p>}
							<Button type="submit" disabled={loading}>
								{loading ? "Sending…" : "Send reset link"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
