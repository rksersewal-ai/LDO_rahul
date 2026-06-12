"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Rows3,
} from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRowIds: string[]) => void;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableSelection?: boolean;
  onSelectionChange?: (selection: RowSelectionState) => void;
  className?: string;
  /** Number of rows per page. Defaults to 25. */
  pageSize?: number;
  /** Show toolbar with density and column toggles. Defaults to true. */
  showToolbar?: boolean;
  /** Show pagination controls. Defaults to true. */
  showPagination?: boolean;
  /** Show density toggle in toolbar. Defaults to true. */
  showDensityToggle?: boolean;
  /** Show column visibility toggle in toolbar. Defaults to true. */
  showColumnToggle?: boolean;
  /** Callback when a bulk action is triggered with selected row IDs. */
  onBulkAction?: (selectedIds: string[]) => void;
  /** Array of bulk actions to show when rows are selected. */
  bulkActions?: BulkAction[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableSelection = false,
  onSelectionChange,
  className,
  pageSize = 25,
  showToolbar = true,
  showPagination = true,
  showDensityToggle = true,
  showColumnToggle = true,
  onBulkAction,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [density, setDensity] = useState<"dense" | "normal">("normal");

  const allColumns: ColumnDef<TData, TValue>[] = enableSelection
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className="translate-y-[2px]"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="translate-y-[2px]"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          size: 32,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      onSelectionChange?.(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const rowHeight = density === "dense" ? "34px" : "38px";

  // Get selected row IDs for bulk actions
  const getSelectedRowIds = (): string[] => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  };

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {/* Bulk Action Toolbar */}
      {enableSelection && selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-t-md border border-b-0 bg-accent/50 px-3 py-1.5">
          <span className="text-xs font-medium text-foreground">{selectedCount} selected</span>
          {bulkActions?.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="xs"
              onClick={() => action.onClick(getSelectedRowIds())}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          {onBulkAction && !bulkActions?.length && (
            <Button variant="ghost" size="xs" onClick={() => onBulkAction(getSelectedRowIds())}>
              Apply
            </Button>
          )}
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && (showDensityToggle || showColumnToggle) && (
        <div
          className={cn(
            "flex items-center justify-end gap-1 border border-b-0 bg-muted/30 px-2 py-1",
            enableSelection && selectedCount > 0 ? "rounded-none" : "rounded-t-md",
          )}
        >
          {showDensityToggle && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDensity(density === "dense" ? "normal" : "dense")}
              title={density === "dense" ? "Normal density" : "Dense view"}
            >
              <Rows3 className="h-3.5 w-3.5" />
            </Button>
          )}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-[min(var(--radius-md),10px)] text-sm outline-none transition-all hover:bg-muted hover:text-foreground [&_svg:not([class*='size-'])]:size-3",
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Table */}
      <div
        className={cn(
          "rounded-md border shadow-[var(--shadow-table)]",
          showToolbar && (showDensityToggle || showColumnToggle) && "rounded-t-none border-t-0",
          enableSelection && selectedCount > 0 && !showToolbar && "rounded-t-none border-t-0",
        )}
        style={{ "--table-row-height": rowHeight } as React.CSSProperties}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-[var(--table-row-height)] text-[var(--text-xs)] font-semibold uppercase tracking-wider text-muted-foreground"
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        role={header.column.getCanSort() ? "button" : undefined}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIndicator direction={header.column.getIsSorted()} />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-[var(--table-row-height)] transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1.5 text-[var(--text-sm)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2 py-2 text-xs text-muted-foreground">
          <span>
            Showing{" "}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}{" "}
            of {table.getFilteredRowModel().rows.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}
