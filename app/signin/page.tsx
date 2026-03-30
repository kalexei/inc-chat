"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Guest mode: disable Cognito sign-in UI/flows.
    router.replace("/");
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
            <CardTitle className="text-2xl tracking-tight">Guest mode</CardTitle>
            <CardDescription className="mt-2 text-pretty">
              Sign-in is disabled. You can use the sales agent as a guest.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
