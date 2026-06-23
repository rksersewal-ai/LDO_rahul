"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { usePlCreate } from "@/hooks/use-pl-data";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type PlFormInput, plFormSchema } from "@/lib/validators/pl-form";

const categories = [
  { value: "CAT-A", label: "CAT-A (Critical Safety)" },
  { value: "CAT-B", label: "CAT-B (Safety Related)" },
  { value: "CAT-C", label: "CAT-C (Standard)" },
  { value: "CAT-D", label: "CAT-D (General)" },
];

const statuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "under_review", label: "Under Review" },
];

export default function CreatePlPage() {
  const router = useRouter();
  const createPl = usePlCreate();
  const form = useForm<PlFormInput>({
    resolver: zodResolver(plFormSchema),
    defaultValues: {
      plNumber: "",
      name: "",
      description: "",
      category: "CAT-C",
      status: "active",
      safetyCritical: false,
      safetyClassification: "",
      severityOfFailure: "",
      consequences: "",
      drawingRef: "",
      specification: "",
      applicationArea: "",
      usedIn: "",
      unit: "nos",
      workshop: "",
      supervisors: "",
      eOfficeFile: "",
      vendorType: "",
    },
  });

  const watchCategory = form.watch("category");
  const showSafetyFields = watchCategory === "CAT-A" || watchCategory === "CAT-B";

  function onSubmit(data: PlFormInput) {
    createPl.mutate(
      {
        plNumber: data.plNumber,
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
        safetyCritical: data.safetyCritical,
        drawingRef: data.drawingRef || null,
        specification: data.specification || null,
        unit: data.unit,
        workshop: data.workshop,
      },
      {
        onSuccess: (created) => {
          toast.success(`PL number ${data.plNumber} created`);
          router.push(created?.id ? `/pl/${created.id}` : "/pl");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create PL number");
        },
      },
    );
  }

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href="/pl" />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to PL Hub
        </Button>

        <PageHeader
          title="Create PL Number"
          subtitle="Register a new Parts List number in the system"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">PL Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678"
                          maxLength={8}
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Exactly 8 digits</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Component name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Detailed description of the PL item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          // Auto-set safetyCritical based on category
                          if (val === "CAT-A" || val === "CAT-B") {
                            form.setValue("safetyCritical", true);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Safety Section - conditional */}
            {showSafetyFields && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Safety Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-destructive/20 bg-destructive/5 p-4">
                  <FormField
                    control={form.control}
                    name="safetyClassification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Safety Classification</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Safety Critical Component" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severityOfFailure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Severity of Failure</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., High - Operational Safety" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consequences"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs">Consequences</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Describe potential consequences of failure"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            )}

            {/* Technical */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Technical
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="drawingRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Drawing Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CLW/ED/TM/4907/GA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Specification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., IRS:E.10-3-2019" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicationArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Application Area</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Traction System" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usedIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Used In</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., WAP-7, WAG-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Administrative */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Administrative
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="nos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workshop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Workshop</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CLW Chittaranjan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supervisors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Supervisors</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma-separated names" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eOfficeFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">e-Office File</FormLabel>
                      <FormControl>
                        <Input placeholder="e-Office reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Vendor Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., OEM, Proprietary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" size="sm" disabled={createPl.isPending}>
                {createPl.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {createPl.isPending ? "Creating..." : "Create PL Number"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={createPl.isPending}
                render={<Link href="/pl" />}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageFrame>
  );
}
