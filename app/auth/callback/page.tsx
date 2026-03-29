"use client";

import { exchangeCodeForTokens } from "@/lib/cognito";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setMsg("Missing authorization code.");
      return;
    }
    (async () => {
      try {
        await exchangeCodeForTokens(code);
        router.replace("/");
      } catch (e) {
        setMsg((e as Error).message || "Sign-in failed");
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="signin-page">
      <div className="signin-card">
        <p style={{ color: "var(--rak-text-muted)" }}>{msg}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="signin-page">
          <div className="signin-card">
            <p style={{ color: "var(--rak-text-muted)" }}>Loading…</p>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
