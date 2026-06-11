"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="font-mono text-xs text-muted-foreground tabular-nums" />}
      >
        {time}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span>IST (Indian Standard Time)</span>
      </TooltipContent>
    </Tooltip>
  );
}
