"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  cognitoAuthEnabled,
  getStoredTokens,
  startCognitoLogin,
} from "@/lib/cognito";
import { cn } from "@/lib/utils";
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
    <div
      className={cn(
        "flex min-h-dvh items-center justify-center bg-background p-6",
        "bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]",
      )}
    >
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div
            className={cn(
              "size-14 rounded-2xl bg-linear-to-br from-primary to-accent",
              "shadow-lg shadow-primary/25",
            )}
            aria-hidden
          />
          <div>
            <CardTitle className="text-2xl tracking-tight">RAK INC</CardTitle>
            <CardDescription className="mt-2 text-pretty">
              Sign in to use the sales agent. Authentication uses AWS Cognito
              (hosted UI).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {err ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
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
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p className="text-pretty">
            Set{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
              NEXT_PUBLIC_COGNITO_DOMAIN
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
              NEXT_PUBLIC_COGNITO_CLIENT_ID
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
              NEXT_PUBLIC_COGNITO_REDIRECT_URI
            </code>{" "}
            (for example{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
              http://localhost:3000/auth/callback
            </code>
            ). Leave the client id empty to skip sign-in for local dev.
          </p>
          <Button variant="link" className="h-auto p-0 text-primary" asChild>
            <Link href="/">← Back to app</Link>
          </Button>
          <p className="text-[0.7rem] leading-relaxed opacity-80">
            If Cognito is disabled, you are redirected home from this page
            automatically.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
