"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minDate?: string;
  error?: string;
  id?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  minDate,
  error,
  id,
  className,
}: DatePickerProps) {
  const hasError = !!error || (minDate && value && value < minDate);
  const errorMessage =
    error || (minDate && value && value < minDate ? `Date must be on or after ${minDate}` : "");

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
      )}
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={minDate}
        className={cn(
          "h-8 text-xs",
          hasError && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {hasError && errorMessage && <p className="text-[10px] text-destructive">{errorMessage}</p>}
    </div>
  );
}
