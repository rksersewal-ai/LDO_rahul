"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_USERS } from "@/lib/mock-data/users";
import { cn } from "@/lib/utils";
import { createCaseSchema } from "@/lib/validators/cases";

type CaseFormValues = z.infer<typeof createCaseSchema>;

const caseTypes = [
  { value: "failure_investigation", label: "Failure Investigation" },
  { value: "discrepancy", label: "Discrepancy" },
  { value: "vendor_issue", label: "Vendor Issue" },
  { value: "design_deviation", label: "Design Deviation" },
  { value: "safety_concern", label: "Safety Concern" },
];

const severityOptions = [
  { value: "LOW", label: "Low", className: "text-green-600" },
  { value: "MEDIUM", label: "Medium", className: "text-amber-600" },
  { value: "HIGH", label: "High", className: "text-orange-600" },
  { value: "CRITICAL", label: "Critical", className: "text-red-600" },
];

const assignableUsers = MOCK_USERS.filter((u) => u.role !== "viewer");

interface CaseFormProps {
  onSubmit: (data: CaseFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<CaseFormValues>;
}

export function CaseForm({ onSubmit, onCancel, loading, defaultValues }: CaseFormProps) {
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "failure_investigation",
      severity: "MEDIUM",
      plNumber: "",
      vendorName: "",
      tenderNumber: "",
      assigneeId: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Title *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Brief description of the case"
                  className="text-xs h-8"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Description *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Detailed description of the issue, observations, and any relevant background..."
                  className="text-xs min-h-[100px]"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {caseTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Severity *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {severityOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        <span className={cn("font-medium", s.className)}>{s.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assigneeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Assignee *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name} ({u.designation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="plNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">PL Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="8-digit PL#"
                    className="text-xs h-8"
                    maxLength={8}
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Vendor Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Vendor (if applicable)" className="text-xs h-8" />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenderNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Tender Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tender #" className="text-xs h-8" />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" className="h-8 text-xs" disabled={loading}>
            {loading ? "Creating..." : "Create Case"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
