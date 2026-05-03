import { SignUp } from "@clerk/react";
import { useSearchParams } from "react-router";

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <SignUp
        initialValues={{ emailAddress: email }}
        afterSignUpUrl="/"
        routing="hash"
      />
    </div>
  );
}
