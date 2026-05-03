import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

export function InvitationAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error ?? "This invitation is invalid or has expired.");
          return;
        }
        navigate(`/sign-up?email=${encodeURIComponent(data.email)}`);
      })
      .catch(() => setError("Something went wrong. Please try again."));
  }, [token, navigate]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <p style={{ color: "#c0392b", fontSize: "16px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "#6b6375", fontSize: "14px" }}>Verifying your invitation…</p>
    </div>
  );
}
