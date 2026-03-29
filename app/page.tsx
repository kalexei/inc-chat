"use client";

import { ChatApp } from "@/components/chat";
import { cognitoAuthEnabled, getStoredTokens } from "@/lib/cognito";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cognitoAuthEnabled()) {
      setReady(true);
      return;
    }
    const t = getStoredTokens();
    if (t?.id_token) setReady(true);
    else router.replace("/signin");
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <ChatApp />;
}
