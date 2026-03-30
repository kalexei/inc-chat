"use client";

import {
  formatSessionAge,
  sessionTitle,
} from "@/lib/chat/sessions";
import type { StoredSession } from "@/lib/chat-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MessageSquare, Trash2 } from "lucide-react";

type SessionListProps = {
  className?: string;
  sessions: StoredSession[];
  activeSessionId: string | null;
  userId: string;
  searchQuery: string;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
};

export function SessionList({
  className,
  sessions,
  activeSessionId,
  userId,
  searchQuery,
  onSelect,
  onDelete,
}: SessionListProps) {
  const emptyMessage = searchQuery.trim()
    ? "No matching chats"
    : userId.trim()
      ? "No chats for this user"
      : "No chats yet";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2 pr-3">
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            <SidebarMenu className="gap-0.5">
              {sessions.map((s) => {
                const active = s.id === activeSessionId;
                return (
                  <SidebarMenuItem key={s.id}>
                    <SidebarMenuButton
                      isActive={active}
                      className="h-auto min-h-8 py-2 pr-8"
                      title={s.userId ? `${s.id} · ${s.userId}` : s.id}
                      onClick={() => void onSelect(s.id)}
                    >
                      <MessageSquare className="mt-0.5 shrink-0 opacity-60" />
                      <div className="grid min-w-0 flex-1 text-left leading-tight">
                        <span className="truncate text-sm font-medium">
                          {sessionTitle(s)}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {formatSessionAge(s.createdAt)}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      title="Delete chat"
                      onClick={(e) => void onDelete(s.id, e)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete</span>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
