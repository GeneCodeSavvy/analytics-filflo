import { SignIn } from "@clerk/react";
import { useSearchParams } from "react-router";

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <SignIn forceRedirectUrl={redirectUrl} signUpUrl="/sign-up" routing="hash" />
    </div>
  );
}
