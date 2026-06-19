"use client";

import { BookText, Link2, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

const PAGE_SIZE = 25;

export default function PlLedgerPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = trpc.pl.ledger.useQuery({
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Document Association Ledger"
          subtitle="All PL numbers cataloged, with their attached documents by category"
        />

        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search PL number or name…"
              className="h-8 pl-7 pr-7 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={applySearch}>
            Search
          </Button>
        </div>

        {isLoading ? (
          <LoadingState variant="table" rows={10} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load ledger: {error.message}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<BookText className="h-5 w-5" />}
            title="No PL numbers found"
            description="Catalog PL numbers to start associating documents with them."
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {data.totalCount} PL number{data.totalCount !== 1 ? "s" : ""} cataloged
            </p>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50 text-left uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">PL Number</th>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 text-center font-semibold">Total Docs</th>
                    <th className="px-3 py-2 text-center font-semibold">TE</th>
                    <th className="px-3 py-2 text-center font-semibold">Prototype</th>
                    <th className="px-3 py-2 text-center font-semibold">Corresp.</th>
                    <th className="px-3 py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((pl) => (
                    <tr key={pl.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <Link
                          href={`/pl/${pl.id}`}
                          className="font-mono font-medium hover:underline"
                        >
                          {pl.plNumber}
                        </Link>
                        {pl.safetyCritical && (
                          <Badge variant="destructive" className="ml-1.5 text-[10px]">
                            SC
                          </Badge>
                        )}
                      </td>
                      <td className="max-w-[260px] truncate px-3 py-2">{pl.name}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {pl.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">{pl.totalDocs}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{pl.teDocs}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        {pl.prototypeDocs}
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        {pl.correspondenceDocs}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 gap-1 text-[10px]"
                          render={<Link href={`/pl/${pl.id}/documents`} />}
                        >
                          <Link2 className="h-3 w-3" />
                          Manage Links
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageFrame>
  );
}
