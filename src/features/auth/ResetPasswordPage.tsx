import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { resetPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "./AuthShell";

export function ResetPasswordPage() {
	const [params] = useSearchParams();
	const token = params.get("token");
	const next = params.get("next") || "/create";
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!token) {
			setError("Missing or expired reset link.");
			return;
		}
		setLoading(true);
		setError(null);
		const { error: resetError } = await resetPassword({ newPassword: password, token });
		setLoading(false);
		if (resetError) {
			setError(resetError.message ?? "Failed to reset password");
			return;
		}
		navigate(`/login?next=${encodeURIComponent(next)}`);
	}

	return (
		<AuthShell>
			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle>Set a new password</CardTitle>
					<CardDescription>Choose something you'll remember.</CardDescription>
				</CardHeader>
				<CardContent>
					{!token ? (
						<p className="text-sm text-destructive">
							This reset link is missing or invalid. Request a new one from the login page.
						</p>
					) : (
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="password">New password</Label>
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
								{loading ? "Saving…" : "Save new password"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</AuthShell>
	);
}
