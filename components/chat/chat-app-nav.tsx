"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { StoredSession } from "@/lib/chat-types";
import { Plus, Search } from "lucide-react";
import { SessionList } from "./session-list";
import Image from "next/image";

type ChatAppNavProps = {
  initials: string;
  showSearch: boolean;
  sessionSearch: string;
  filteredSessions: StoredSession[];
  activeSessionId: string | null;
  userId: string;
  onNewChat: () => void;
  onToggleSearch: () => void;
  onSessionSearchChange: (value: string) => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
};

export function ChatAppNav({
  initials,
  showSearch,
  sessionSearch,
  filteredSessions,
  activeSessionId,
  userId,
  onNewChat,
  onToggleSearch,
  onSessionSearchChange,
  onSelectSession,
  onDeleteSession,
}: ChatAppNavProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <Image
                src="/assets/logo/logo.svg"
                alt="Innovation City"
                className="size-8 shrink-0 rounded-lg bg-linear-to-br from-primary to-accent shadow-sm"
                width={32}
                height={32}
              />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Innovation City</span>
                <span className="truncate text-xs text-muted-foreground">
                  Virtual agent
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="New chat" onClick={() => onNewChat()}>
              <Plus />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {showSearch ? (
              <div className="flex items-center gap-1 px-2">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <SidebarInput
                  type="search"
                  placeholder="Search chat history…"
                  value={sessionSearch}
                  onChange={(e) => onSessionSearchChange(e.target.value)}
                  autoComplete="off"
                  autoFocus
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      onSessionSearchChange("");
                      onToggleSearch();
                    }
                  }}
                />
              </div>
            ) : (
              <SidebarMenuButton
                tooltip="Search chat history"
                onClick={onToggleSearch}
              >
                <Search />
                <span>Search</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
        <div className="min-h-0 flex-1 group-data-[collapsible=icon]:hidden">
          <div className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground">
            Chat history
          </div>
          <SessionList
            className="min-h-0 flex-1"
            sessions={filteredSessions}
            activeSessionId={activeSessionId}
            userId={userId}
            searchQuery={sessionSearch}
            onSelect={onSelectSession}
            onDelete={onDeleteSession}
          />
        </div>
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <Avatar size="sm" className="size-8">
                <AvatarFallback className="bg-secondary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Guest</span>
                <span className="truncate text-xs text-muted-foreground">
                  Guest mode
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
