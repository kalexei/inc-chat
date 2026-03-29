"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { StoredSession } from "@/lib/chat-types";
import { LogOut, Plus, Search } from "lucide-react";
import { SessionList } from "./session-list";

type ChatAppNavProps = {
  initials: string;
  showSignOut: boolean;
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
  onSignOut: () => void;
};

export function ChatAppNav({
  initials,
  showSignOut,
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
  onSignOut,
}: ChatAppNavProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="size-8 shrink-0 rounded-lg bg-linear-to-br from-primary to-accent shadow-sm" />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">RAK INC</span>
                <span className="truncate text-xs text-muted-foreground">
                  Sales agent
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New chat"
              onClick={() => onNewChat()}
            >
              <Plus />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search chat history"
              onClick={onToggleSearch}
            >
              <Search />
              <span>Search</span>
            </SidebarMenuButton>
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
            showSearch={showSearch}
            onSearchChange={onSessionSearchChange}
            onSelect={onSelectSession}
            onDelete={onDeleteSession}
          />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {showSignOut ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onSignOut()}
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <Avatar size="sm" className="size-8">
                <AvatarFallback className="bg-secondary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Account</span>
                <span className="truncate text-xs text-muted-foreground">
                  Signed in
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
