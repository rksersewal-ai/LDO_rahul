"use client";

import { Keyboard, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MOCK_USERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 dark:text-red-400",
  supervisor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  reviewer: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  engineer: "bg-green-500/10 text-green-600 dark:text-green-400",
  viewer: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Current user (mock: first user as admin)
  const currentUser = MOCK_USERS[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center size-[30px] rounded-md",
                    "hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
                  )}
                  aria-label="User menu"
                />
              }
            />
          }
        >
          <User className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>User menu</span>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        {/* User info header */}
        <div className="px-2 py-2">
          <p className="text-sm font-medium truncate">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          <Badge
            variant="secondary"
            className={cn("mt-1.5 text-[10px] h-4 px-1.5", roleColors[currentUser.role])}
          >
            {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
          >
            <User className="size-3.5" />
            <span>Profile</span>
            <DropdownMenuShortcut>g+u</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              router.push("/profile#preferences");
            }}
          >
            <Settings className="size-3.5" />
            <span>Preferences</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              // Trigger keyboard shortcuts help
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "/", ctrlKey: true }));
            }}
          >
            <Keyboard className="size-3.5" />
            <span>Keyboard Shortcuts</span>
            <DropdownMenuShortcut>Ctrl+/</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            setOpen(false);
            router.push("/login");
          }}
        >
          <LogOut className="size-3.5" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
