"use client";

import { Card, CardContent } from "@/components/ui/card";
import { exchangeCodeForTokens } from "@/lib/cognito";
import { cn } from "@/lib/utils";
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
    void (async () => {
      try {
        await exchangeCodeForTokens(code);
        router.replace("/");
      } catch (e) {
        setMsg((e as Error).message || "Sign-in failed");
      }
    })();
  }, [router, searchParams]);

  return (
    <div
      className={cn(
        "flex min-h-dvh items-center justify-center bg-background p-6",
        "bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]",
      )}
    >
      <Card className="w-full max-w-md border-border/80 bg-card/95 p-8 shadow-xl">
        <CardContent className="p-0 text-center text-sm text-muted-foreground">
          {msg}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background p-6">
          <Card className="w-full max-w-md border-border/80 bg-card/95 p-8 shadow-xl">
            <CardContent className="p-0 text-center text-sm text-muted-foreground">
              Loading…
            </CardContent>
          </Card>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
