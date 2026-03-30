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
    title: "Company setup cost",
    description:
      "Packages, inclusions, and an estimated total setup cost for your company.",
    prompt:
      "Free zone incorporation packages, what's included, and estimated total setup cost.",
  },
  {
    title: "Business activities",
    description:
      "Allowed activities and guidance on choosing the right activity for your business.",
    prompt:
      "Which business activities are allowed and how to choose the right activity for your company.",
  },
  {
    title: "Office requirements",
    description:
      "Whether you need a physical office, a flexi desk, or remote operation is possible.",
    prompt:
      "Do you need a physical office, flexi desk, or can you operate remotely.",
  },
  {
    title: "Setup timeline",
    description:
      "Steps, required documents, and the typical timeline for company setup.",
    prompt:
      "Steps, required documents, and how long company setup usually takes.",
  },
  {
    title: "Banking assistance",
    description:
      "Corporate bank account opening support and the documents you’ll need.",
    prompt:
      "Opening a corporate bank account and what documents are required.",
  },
  {
    title: "Relocation to UAE",
    description:
      "Relocation steps, residency visas, and what it’s like living in Ras Al Khaimah.",
    prompt:
      "Moving to the UAE, residency visas, and living in Ras Al Khaimah.",
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
