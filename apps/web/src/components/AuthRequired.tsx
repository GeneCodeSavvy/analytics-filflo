import { Link, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useAuthState } from "../stores/useAuthStore";

export function AuthRequired({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthenticated = useAuthState((state) => state.isAuthenticated);
  const isLoading = useAuthState((state) => state.isLoading);
  const redirectUrl = `${location.pathname}${location.search}${location.hash}`;
  const authSearch = new URLSearchParams({ redirect_url: redirectUrl });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (isAuthenticated) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in or create an account to continue.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link className="tickets-primary justify-center" to={`/sign-in?${authSearch}`}>
            Sign in
          </Link>
          <Link className="tickets-secondary justify-center" to={`/sign-up?${authSearch}`}>
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
