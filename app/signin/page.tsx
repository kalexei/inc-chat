"use client";

import {
  cognitoAuthEnabled,
  getStoredTokens,
  startCognitoLogin,
} from "@/lib/cognito";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!cognitoAuthEnabled()) {
      router.replace("/");
      return;
    }
    if (getStoredTokens()?.id_token) router.replace("/");
  }, [router]);

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="brand-mark" aria-hidden />
        <h1>RAK INC</h1>
        <p>
          Sign in to use the sales agent. Authentication runs on AWS Cognito
          (hosted UI).
        </p>
        {err && (
          <p style={{ color: "#fca5a5", marginBottom: 16, fontSize: "0.85rem" }}>
            {err}
          </p>
        )}
        <button
          type="button"
          className="btn-cognito"
          onClick={async () => {
            try {
              setErr(null);
              await startCognitoLogin();
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        >
          Sign in with Cognito
        </button>
        <p className="signin-hint">
          Set <code>NEXT_PUBLIC_COGNITO_DOMAIN</code>,{" "}
          <code>NEXT_PUBLIC_COGNITO_CLIENT_ID</code>, and{" "}
          <code>NEXT_PUBLIC_COGNITO_REDIRECT_URI</code> (e.g.{" "}
          <code>http://localhost:3000/auth/callback</code>). Leave the client id
          empty to skip sign-in for local dev.
        </p>
        <p className="signin-hint" style={{ marginTop: 12 }}>
          <Link href="/" style={{ color: "var(--rak-primary)" }}>
            ← Back to app
          </Link>{" "}
          (only when auth is disabled)
        </p>
      </div>
    </div>
  );
}
