"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
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
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import {
  inspectionAgencyEnum,
  lifecycleStageEnum,
  plCategoryEnum,
  plItemTypeEnum,
  plStatusEnum,
} from "@/lib/validators/pl-numbers";

const editPlFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().optional(),
  category: plCategoryEnum,
  status: plStatusEnum,
  safetyCritical: z.boolean(),
  drawingRef: z.string().optional(),
  specification: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  workshop: z.string().min(1, "Workshop is required"),
  manufacturer: z.string().optional(),
  vendorCode: z.string().optional(),
  partFamily: z.string().optional(),
  lifecycleStage: lifecycleStageEnum,
  itemType: plItemTypeEnum.optional(),
  uvamItemId: z.string().optional(),
  eligibilityCriteriaText: z.string().optional(),
  inspectionAgency: inspectionAgencyEnum.optional(),
  unitOfMeasurement: z.string().optional(),
  shelfLifeMonths: z.string().optional(),
  lastProcurementRate: z.string().optional(),
  lastProcurementDate: z.string().optional(),
});

type EditPlFormInput = z.infer<typeof editPlFormSchema>;

const categories = ["CAT-A", "CAT-B", "CAT-C", "CAT-D"] as const;
const statuses = ["active", "inactive", "under_review", "deprecated", "obsolete"] as const;
const lifecycleStages = ["draft", "active", "restricted", "obsolete", "deprecated"] as const;
const itemTypes = ["VD", "NVD"] as const;
const agencies = ["RDSO", "ZONAL", "WORKSHOP", "STORES"] as const;

function toInputDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export default function EditPlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: pl, isLoading, isError, error, refetch } = trpc.pl.getById.useQuery({ id });

  const form = useForm<EditPlFormInput>({
    resolver: zodResolver(editPlFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "CAT-C",
      status: "active",
      safetyCritical: false,
      drawingRef: "",
      specification: "",
      unit: "nos",
      workshop: "",
      manufacturer: "",
      vendorCode: "",
      partFamily: "",
      lifecycleStage: "active",
      itemType: undefined,
      uvamItemId: "",
      eligibilityCriteriaText: "",
      inspectionAgency: undefined,
      unitOfMeasurement: "",
      shelfLifeMonths: "",
      lastProcurementRate: "",
      lastProcurementDate: "",
    },
  });

  useEffect(() => {
    if (!pl) return;
    form.reset({
      name: pl.name,
      description: pl.description ?? "",
      category: pl.category,
      status: pl.status,
      safetyCritical: pl.safetyCritical,
      drawingRef: pl.drawingRef ?? "",
      specification: pl.specification ?? "",
      unit: pl.unit ?? "nos",
      workshop: pl.workshop ?? "",
      manufacturer: pl.manufacturer ?? "",
      vendorCode: pl.vendorCode ?? "",
      partFamily: pl.partFamily ?? "",
      lifecycleStage: pl.lifecycleStage ?? "active",
      itemType: pl.itemType ?? undefined,
      uvamItemId: pl.uvamItemId ?? "",
      eligibilityCriteriaText: pl.eligibilityCriteriaText ?? "",
      inspectionAgency: pl.inspectionAgency ?? undefined,
      unitOfMeasurement: pl.unitOfMeasurement ?? "",
      shelfLifeMonths: pl.shelfLifeMonths != null ? String(pl.shelfLifeMonths) : "",
      lastProcurementRate: pl.lastProcurementRate != null ? String(pl.lastProcurementRate) : "",
      lastProcurementDate: toInputDate(pl.lastProcurementDate),
    });
  }, [form, pl]);

  const updateMutation = trpc.pl.update.useMutation({
    onSuccess: async () => {
      toast.success("PL details updated");
      await utils.pl.getById.invalidate({ id });
      router.push(`/pl/${id}`);
    },
    onError: (err) => toast.error(err.message || "Failed to update PL details"),
  });

  function onSubmit(values: EditPlFormInput) {
    if (!pl) return;
    updateMutation.mutate({
      id,
      expectedUpdatedAt: pl.updatedAt ? new Date(pl.updatedAt).toISOString() : undefined,
      name: values.name,
      description: values.description?.trim() || "",
      category: values.category,
      status: values.status,
      safetyCritical: values.safetyCritical,
      drawingRef: emptyToNull(values.drawingRef),
      specification: emptyToNull(values.specification),
      unit: values.unit,
      workshop: values.workshop,
      manufacturer: emptyToNull(values.manufacturer),
      vendorCode: emptyToNull(values.vendorCode),
      partFamily: emptyToNull(values.partFamily),
      lifecycleStage: values.lifecycleStage,
      itemType: values.itemType ?? null,
      uvamItemId: emptyToNull(values.uvamItemId),
      eligibilityCriteriaText: emptyToNull(values.eligibilityCriteriaText),
      inspectionAgency: values.inspectionAgency ?? null,
      unitOfMeasurement: emptyToNull(values.unitOfMeasurement),
      shelfLifeMonths: !values.shelfLifeMonths ? null : Number(values.shelfLifeMonths),
      lastProcurementRate: !values.lastProcurementRate ? null : Number(values.lastProcurementRate),
      lastProcurementDate: values.lastProcurementDate
        ? new Date(values.lastProcurementDate).toISOString()
        : null,
    });
  }

  if (isLoading) {
    return (
      <PageFrame>
        <div className="py-16 text-center text-sm text-muted-foreground">Loading PL details…</div>
      </PageFrame>
    );
  }

  if (isError || !pl) {
    return (
      <PageFrame>
        <QueryErrorState
          error={error ?? new Error("PL number not found")}
          retry={() => refetch()}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-5">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href={`/pl/${id}`} />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to PL {pl.plNumber}
        </Button>

        <PageHeader
          title={`Edit PL ${pl.plNumber}`}
          subtitle="Update PL master details, railway classification, and procurement metadata."
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="rounded-lg border bg-card p-4">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Core Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "CAT-A" || value === "CAT-B")
                            form.setValue("safetyCritical", true);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value.replace("_", " ")}
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
                  name="lifecycleStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Lifecycle</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lifecycleStages.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value.replace("_", " ")}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="rounded-lg border bg-card p-4">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technical & Railway Classification
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(
                  [
                    "drawingRef",
                    "specification",
                    "unit",
                    "workshop",
                    "manufacturer",
                    "vendorCode",
                    "partFamily",
                    "unitOfMeasurement",
                  ] as const
                ).map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{name.replace(/([A-Z])/g, " $1")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Item Type</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? undefined : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not classified</SelectItem>
                          {itemTypes.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
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
                  name="inspectionAgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Inspection Agency</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? undefined : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not set</SelectItem>
                          {agencies.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
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
                  name="uvamItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">UVAM Item ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eligibilityCriteriaText"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Eligibility Criteria</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="rounded-lg border bg-card p-4">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Procurement & Safety
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="safetyCritical"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Safety Critical</FormLabel>
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={(value) => field.onChange(value === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shelfLifeMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Shelf Life (months)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastProcurementRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last Procurement Rate</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastProcurementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last Procurement Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" render={<Link href={`/pl/${id}`} />}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageFrame>
  );
}
