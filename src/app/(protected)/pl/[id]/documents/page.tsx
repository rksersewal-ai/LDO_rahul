"use client";

import { ArrowLeft, BookText, Plus } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { DocumentAssociationEngine } from "@/components/pl/document-association-engine";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

export default function PlDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: pl } = trpc.pl.getById.useQuery({ id });

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 w-fit gap-1 text-xs"
            render={<Link href={`/pl/${id}`} />}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to {pl?.plNumber ?? "PL Detail"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            render={<Link href="/pl/ledger" />}
          >
            <BookText className="h-3 w-3" />
            Association Ledger
          </Button>
        </div>

        <PageHeader
          title="Linked Documents"
          subtitle={pl ? `Documents linked to ${pl.plNumber} - ${pl.name}` : "Loading..."}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              // biome-ignore lint/a11y/useAnchorContent: Button injects content
              render={<a href="#pl-document-search" />}
            >
              <Plus className="h-3 w-3" />
              Link Document
            </Button>
          }
        />

        <p className="text-xs text-muted-foreground">
          Search the document database and drag results into a category, or use the “Link” menu.
          Documents can belong to multiple PLs, and each PL can hold many documents. Use the
          dedicated columns for Technical Evaluation, Prototype Approval, and Queries &
          Correspondence.
        </p>

        <DocumentAssociationEngine plId={id} />
      </div>
    </PageFrame>
  );
}
