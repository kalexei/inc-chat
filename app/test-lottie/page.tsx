"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function TestLottiePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-12">
        <h1 className="text-xl font-semibold">DotLottie Test Route</h1>
        <p className="text-sm text-muted-foreground">
          Rendering <code>/assets/Innovi/Innovi_Animated.json</code> with DotLottie.
        </p>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <DotLottieReact
            src="/assets/Innovi/Innovi_Animated.json"
            loop
            autoplay
            style={{ width: 280, height: 280 }}
          />
        </div>
      </div>
    </main>
  );
}
