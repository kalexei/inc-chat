"use client";

import { fetchGreeting } from "@/lib/api/sales-agent";
import { startTransition, useEffect, useState } from "react";

export function useGreeting() {
  const [cachedGreeting, setCachedGreeting] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");
  const [heroLine, setHeroLine] = useState("Good day.");
  const [heroSub] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    let greet = "Good day";
    if (hour < 12) greet = "Good morning";
    else if (hour < 18) greet = "Good afternoon";
    else greet = "Good evening";
    startTransition(() => {
      setHeroLine(`${greet}, there!`);
      setInitials("?");
    });
  }, []);

  useEffect(() => {
    void fetchGreeting()
      .then(({ data }) => {
        if (data.message) setCachedGreeting(data.message);
      })
      .catch(() => {});
  }, []);

  return { cachedGreeting, setCachedGreeting, initials, heroLine, heroSub };
}

export type GreetingState = ReturnType<typeof useGreeting>;
