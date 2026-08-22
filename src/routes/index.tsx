import { Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { GalleryPage } from "@/features/gallery/GalleryPage";
import { TemplateDetailPage } from "@/features/gallery/TemplateDetailPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { CreatePage } from "@/features/wizard/CreatePage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export function AppRoutes() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<Layout>
						<GalleryPage />
					</Layout>
				}
			/>
			<Route
				path="/templates/:id"
				element={
					<Layout>
						<TemplateDetailPage />
					</Layout>
				}
			/>
			<Route
				path="/login"
				element={
					<Layout>
						<LoginPage />
					</Layout>
				}
			/>
			<Route
				path="/signup"
				element={
					<Layout>
						<SignupPage />
					</Layout>
				}
			/>
			<Route
				path="/forgot"
				element={
					<Layout>
						<ForgotPasswordPage />
					</Layout>
				}
			/>
			<Route
				path="/reset"
				element={
					<Layout>
						<ResetPasswordPage />
					</Layout>
				}
			/>
			<Route
				path="/create"
				element={
					<RequireAuth>
						<Layout>
							<CreatePage />
						</Layout>
					</RequireAuth>
				}
			/>
			<Route
				path="/dashboard"
				element={
					<RequireAuth>
						<Layout>
							<DashboardPage />
						</Layout>
					</RequireAuth>
				}
			/>
			<Route
				path="/settings"
				element={
					<RequireAuth>
						<Layout>
							<SettingsPage />
						</Layout>
					</RequireAuth>
				}
			/>
		</Routes>
	);
}
