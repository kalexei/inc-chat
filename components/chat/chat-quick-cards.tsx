"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FREEZONE_SUGGESTIONS = [
  {
    title: "Package pricing",
    description:
      "Compare free zone incorporation packages, what is included, and ballpark costs.",
    prompt:
      "What free zone incorporation packages do you offer, what is included in each tier, and what are the typical price ranges?",
  },
  {
    title: "Flagged & restricted countries",
    description:
      "Nationalities or countries that need extra checks or are not accepted.",
    prompt:
      "Which countries or nationalities are flagged, restricted, or require enhanced due diligence for RAK free zone company formation?",
  },
  {
    title: "License types",
    description:
      "Commercial, professional, industrial, and which activities fit each.",
    prompt:
      "Explain the main free zone license types (e.g. commercial, professional, industrial) and which business activities fit each.",
  },
  {
    title: "Setup timeline",
    description: "Steps, documents, and how long setup usually takes.",
    prompt:
      "What are the typical steps, required documents, and timeline to incorporate a company in the free zone?",
  },
  {
    title: "Visas & staff quota",
    description: "Employment visas and how many you get with your package.",
    prompt:
      "How many employment visas or staff quota can I get with my free zone package, and what are the options to add more?",
  },
  {
    title: "Renewals & compliance",
    description: "Annual fees, renewals, and ongoing obligations.",
    prompt:
      "What are the annual renewal fees, license renewal process, and mandatory compliance obligations for a free zone company?",
  },
] as const;

type ChatQuickCardsProps = {
  visible: boolean;
  onPickSuggestion: (prompt: string) => void;
};

export function ChatQuickCards({
  visible,
  onPickSuggestion,
}: ChatQuickCardsProps) {
  if (!visible) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Suggested questions
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FREEZONE_SUGGESTIONS.map((c) => (
          <Card
            key={c.title}
            size="sm"
            role="button"
            tabIndex={0}
            className={cn(
              "cursor-pointer gap-2 border-border/80 bg-card/40 py-3 shadow-sm",
              "ring-1 ring-border/40 transition-colors hover:bg-muted/50",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            onClick={() => onPickSuggestion(c.prompt)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPickSuggestion(c.prompt);
              }
            }}
          >
            <CardHeader className="gap-1 px-4 py-0">
              <CardTitle className="text-sm leading-snug">{c.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {c.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
