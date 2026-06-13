"use client";

import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface PLNumberSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function PLNumberSelect({
  value,
  onChange,
  placeholder = "Search PL number...",
  className,
}: PLNumberSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: plData, isLoading } = trpc.pl.list.useQuery(
    { pageSize: 100 },
    { staleTime: 60_000 },
  );

  const plNumbers = plData?.data ?? [];

  const selectedItem = plNumbers.find((pl) => pl.plNumber === value);

  const handleSelect = useCallback(
    (plNumber: string) => {
      onChange(plNumber === value ? null : plNumber);
      setOpen(false);
    },
    [onChange, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-xs shadow-xs transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">
          {selectedItem ? `${selectedItem.plNumber} - ${selectedItem.name}` : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type to filter PL numbers..." />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No PL number found.</CommandEmpty>
                <CommandGroup>
                  {plNumbers.map((pl) => (
                    <CommandItem
                      key={pl.id}
                      value={`${pl.plNumber} ${pl.name}`}
                      onSelect={() => handleSelect(pl.plNumber)}
                      data-checked={value === pl.plNumber}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium font-mono">{pl.plNumber}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                          {pl.name}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
