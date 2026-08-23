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

/**
 * Layout wraps the whole route tree exactly once (rather than once per
 * <Route>, as before) — that's what lets the header/nav/toasts persist
 * across navigation instead of remounting on every route change, and lets
 * Layout key its page-transition wrapper on useLocation() internally.
 */
export function AppRoutes() {
	return (
		<Layout>
			<Routes>
				<Route path="/" element={<GalleryPage />} />
				<Route path="/templates/:id" element={<TemplateDetailPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<SignupPage />} />
				<Route path="/forgot" element={<ForgotPasswordPage />} />
				<Route path="/reset" element={<ResetPasswordPage />} />
				<Route
					path="/create"
					element={
						<RequireAuth>
							<CreatePage />
						</RequireAuth>
					}
				/>
				<Route
					path="/dashboard"
					element={
						<RequireAuth>
							<DashboardPage />
						</RequireAuth>
					}
				/>
				<Route
					path="/settings"
					element={
						<RequireAuth>
							<SettingsPage />
						</RequireAuth>
					}
				/>
			</Routes>
		</Layout>
	);
}
