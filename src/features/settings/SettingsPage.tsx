import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTemplates } from "@/features/gallery/useTemplates";
import { useSite } from "@/features/deploy/useSite";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment } from "@/features/deploy/useDeployment";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatApiError(err: unknown): string {
	if (err instanceof ApiError && err.body && typeof err.body === "object") {
		const body = err.body as { error?: string; reason?: string };
		if (body.reason) return `${body.error ?? "Error"}: ${body.reason}`;
		if (body.error) return body.error;
	}
	return "Something went wrong.";
}

export function SettingsPage() {
	const site = useSite();
	const { templates } = useTemplates();
	const [slugInput, setSlugInput] = useState("");
	const [renaming, setRenaming] = useState(false);
	const [renameError, setRenameError] = useState<string | null>(null);
	const [renameSuccess, setRenameSuccess] = useState<string | null>(null);
	const { result: slugResult, checking } = useSlugCheck(slugInput);
	const { deployment, starting, deploy } = useDeployment();

	useEffect(() => {
		if (site) setSlugInput(site.slug);
	}, [site]);

	async function handleRename() {
		if (!site || slugInput === site.slug) return;
		setRenaming(true);
		setRenameError(null);
		setRenameSuccess(null);
		try {
			const res = await api.patch<{ slug: string; url?: string }>("/api/me/site/slug", { slug: slugInput });
			setRenameSuccess(`Renamed to ${res.slug}`);
		} catch (err) {
			setRenameError(formatApiError(err));
		} finally {
			setRenaming(false);
		}
	}

	function handleSwitchTemplate(templateId: string) {
		if (!site) return;
		void deploy({ slug: site.slug, templateId });
	}

	if (site === undefined) return <div className="p-16 text-sm text-muted-foreground">Loading…</div>;

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
			<h1 className="font-display text-3xl font-semibold">Settings</h1>

			{!site ? (
				<p className="text-sm text-muted-foreground">
					You haven't created a portfolio yet. <Link to="/" className="underline">Browse templates</Link>.
				</p>
			) : (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Subdomain</CardTitle>
							<CardDescription>Changing this updates your live URL immediately.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="slug">Subdomain</Label>
								<Input id="slug" value={slugInput} onChange={(e) => setSlugInput(e.target.value)} />
								{checking && <p className="text-xs text-muted-foreground">Checking…</p>}
								{slugInput !== site.slug && slugResult && !slugResult.available && (
									<p className="text-xs text-destructive">Not available.</p>
								)}
							</div>
							<Button
								onClick={() => void handleRename()}
								disabled={renaming || slugInput === site.slug || (slugResult ? !slugResult.available : false)}
								className="w-fit"
							>
								{renaming ? "Saving…" : "Save subdomain"}
							</Button>
							{renameError && <p className="text-sm text-destructive">{renameError}</p>}
							{renameSuccess && <p className="text-sm text-green-600">{renameSuccess}</p>}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Template</CardTitle>
							<CardDescription>Switching rebuilds and republishes your site.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{templates?.map((t) => (
									<button
										key={t.id}
										type="button"
										onClick={() => handleSwitchTemplate(t.id)}
										disabled={starting || t.id === site.templateId}
										className={`overflow-hidden rounded-md border text-left text-xs ${
											t.id === site.templateId ? "border-primary" : "border-border"
										}`}
									>
										<img src={t.thumbnail} alt={t.name} className="aspect-video w-full object-cover" />
										<div className="p-2">{t.name}</div>
									</button>
								))}
							</div>
							{deployment && (
								<p className="text-sm text-muted-foreground">Rebuild status: {deployment.status}</p>
							)}
						</CardContent>
					</Card>

					<Link to="/create" className="text-sm underline">
						Edit portfolio content
					</Link>
				</>
			)}
		</div>
	);
}
