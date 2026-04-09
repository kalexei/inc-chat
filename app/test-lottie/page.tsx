"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function TestLottiePage() {
  const [animData, setAnimData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/assets/Innovi/Innovi_Animated.json")
      .then((response) => response.json())
      .then(setAnimData)
      .catch(() => {
        setAnimData(null);
      });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-12">
        <h1 className="text-xl font-semibold">Lottie Test Route</h1>
        <p className="text-sm text-muted-foreground">
          Rendering <code>/assets/Innovi/Innovi_Animated.json</code> as-is.
        </p>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          {animData ? (
            <Lottie
              animationData={animData}
              loop
              autoplay
              style={{ width: 280, height: 280 }}
            />
          ) : (
            <div
              className="grid place-items-center text-sm text-muted-foreground"
              style={{ width: 280, height: 280 }}
            >
              Loading animation...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
