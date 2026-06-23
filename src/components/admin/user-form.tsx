"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum([
    "admin",
    "supervisor",
    "reviewer",
    "engineer",
    "viewer",
    "classification_officer",
    "records_manager",
    "legal_hold_officer",
    "auditor",
  ]),
  designation: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  section: z.string().min(1, "Required"),
  employeeId: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  isActive: z.boolean(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  defaultValues?: Partial<UserFormValues>;
  isEdit?: boolean;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

export function UserForm({ defaultValues, isEdit, onSubmit, onCancel }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      role: "viewer",
      designation: "",
      department: "",
      section: "",
      employeeId: "",
      phone: "",
      isActive: true,
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-xs">
            Full Name
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            className="h-8 text-xs"
            placeholder="Shri/Smt. Name"
          />
          {form.formState.errors.name && (
            <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username" className="text-xs">
            Username
          </Label>
          <Input
            id="username"
            {...form.register("username")}
            className="h-8 text-xs"
            placeholder="username"
            disabled={isEdit}
          />
          {form.formState.errors.username && (
            <p className="text-[10px] text-destructive">{form.formState.errors.username.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            className="h-8 text-xs"
            placeholder="user@ldo.railways.gov.in"
          />
          {form.formState.errors.email && (
            <p className="text-[10px] text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              className="h-8 text-xs"
              placeholder="Min 6 characters"
            />
            {form.formState.errors.password && (
              <p className="text-[10px] text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        )}
        {isEdit && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone" className="text-xs">
              Phone
            </Label>
            <Input
              id="phone"
              {...form.register("phone")}
              className="h-8 text-xs"
              placeholder="+91-XXXXXXXXXX"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Role</Label>
          <Select
            value={form.watch("role")}
            onValueChange={(v) =>
              form.setValue("role", (v || "viewer") as UserFormValues["role"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="reviewer">Reviewer</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="classification_officer">Classification Officer</SelectItem>
              <SelectItem value="records_manager">Records Manager</SelectItem>
              <SelectItem value="legal_hold_officer">Legal Hold Officer</SelectItem>
              <SelectItem value="auditor">Auditor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="designation" className="text-xs">
            Designation
          </Label>
          <Input
            id="designation"
            {...form.register("designation")}
            className="h-8 text-xs"
            placeholder="SSE/Design"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department" className="text-xs">
            Department
          </Label>
          <Input
            id="department"
            {...form.register("department")}
            className="h-8 text-xs"
            placeholder="Design"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="section" className="text-xs">
            Section
          </Label>
          <Input
            id="section"
            {...form.register("section")}
            className="h-8 text-xs"
            placeholder="Traction Motor"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employeeId" className="text-xs">
            Employee ID
          </Label>
          <Input
            id="employeeId"
            {...form.register("employeeId")}
            className="h-8 text-xs"
            placeholder="LDO-2024-XXX"
          />
        </div>
      </div>

      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone" className="text-xs">
            Phone
          </Label>
          <Input
            id="phone"
            {...form.register("phone")}
            className="h-8 text-xs"
            placeholder="+91-XXXXXXXXXX"
          />
        </div>
      )}

      {isEdit && (
        <div className="flex items-center gap-2">
          <Switch
            id="isActive"
            checked={form.watch("isActive")}
            onCheckedChange={(v) => form.setValue("isActive", v)}
          />
          <Label htmlFor="isActive" className="text-xs">
            Active Account
          </Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
