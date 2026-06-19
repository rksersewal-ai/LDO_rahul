import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/types/auth";
import { db } from "@/lib/db";
import {
  bomEntries,
  bomProducts,
  documentPlLinks,
  documents,
  ocrPlCandidates,
  plAliases,
  plNumbers,
  plRelationships,
  workRecords,
} from "@/lib/db/schema";
import { logWarn } from "@/lib/logging/structured-logger";
import { assertValidPl, normalizePlNumber } from "@/lib/pl/validation";
import { sanitizeUserInput } from "@/lib/security/sanitize";
import {
  createPlSchema,
  plAliasSchema,
  plBulkImportSchema,
  plChangeStatusSchema,
  plLinkDocumentSchema,
  plListSchema,
  plRelationshipSchema,
  searchDocumentsForLinkingSchema,
  updatePlSchema,
} from "@/lib/validators/pl-numbers";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user: { workspaceId: string | null } } }): string {
  const wsId = ctx.session.user.workspaceId;
  if (!wsId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No workspace assigned. Contact an administrator.",
    });
  }
  return wsId;
}

export const plRouter = router({
  // --- 3. pl.list ---
  list: protectedProcedure.input(plListSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const conditions = [eq(plNumbers.workspaceId, workspaceId)];

    if (input.search) {
      const searchTerm = `%${input.search}%`;
      conditions.push(
        or(
          ilike(plNumbers.plNumber, searchTerm),
          ilike(plNumbers.name, searchTerm),
          ilike(plNumbers.drawingRef, searchTerm),
          ilike(plNumbers.specification, searchTerm),
        )!,
      );
    }
    if (input.category) {
      conditions.push(eq(plNumbers.category, input.category));
    }
    if (input.status) {
      conditions.push(eq(plNumbers.status, input.status));
    }
    if (input.lifecycleStage) {
      conditions.push(eq(plNumbers.lifecycleStage, input.lifecycleStage));
    }
    if (input.safetyCritical !== undefined) {
      conditions.push(eq(plNumbers.safetyCritical, input.safetyCritical));
    }
    if (input.workshop) {
      conditions.push(eq(plNumbers.workshop, input.workshop));
    }

    const whereClause = and(...conditions);

    // Sort
    const sortColumn = (() => {
      switch (input.sortBy) {
        case "plNumber":
          return plNumbers.plNumber;
        case "name":
          return plNumbers.name;
        case "category":
          return plNumbers.category;
        case "status":
          return plNumbers.status;
        case "createdAt":
          return plNumbers.createdAt;
        case "updatedAt":
          return plNumbers.updatedAt;
        default:
          return plNumbers.plNumber;
      }
    })();
    const orderFn = input.sortDir === "desc" ? desc : asc;

    const offset = (input.page - 1) * input.pageSize;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(plNumbers)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .offset(offset)
        .limit(input.pageSize),
      db.select({ totalCount: count() }).from(plNumbers).where(whereClause),
    ]);

    return {
      data,
      totalCount: totalResult[0]?.totalCount ?? 0,
      page: input.page,
      pageSize: input.pageSize,
    };
  }),

  // --- 4. pl.getById ---
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [pl] = await db
        .select()
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.id), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const [aliases, relationshipsAsSource, relationshipsAsTarget] = await Promise.all([
        db.select().from(plAliases).where(eq(plAliases.plId, input.id)),
        db.select().from(plRelationships).where(eq(plRelationships.sourcePlId, input.id)),
        db.select().from(plRelationships).where(eq(plRelationships.targetPlId, input.id)),
      ]);

      return {
        ...pl,
        aliases,
        relationships: [...relationshipsAsSource, ...relationshipsAsTarget],
      };
    }),

  // --- 5. pl.getByPlNumber ---
  getByPlNumber: protectedProcedure
    .input(z.object({ plNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const normalized = normalizePlNumber(input.plNumber);

      const [pl] = await db
        .select()
        .from(plNumbers)
        .where(and(eq(plNumbers.plNumber, normalized), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      return pl;
    }),

  // --- 6. pl.create ---
  create: engineerProcedure.input(createPlSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Validate format
    assertValidPl(input.plNumber);

    // Check uniqueness within workspace
    const [existing] = await db
      .select({ id: plNumbers.id })
      .from(plNumbers)
      .where(and(eq(plNumbers.plNumber, input.plNumber), eq(plNumbers.workspaceId, workspaceId)));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `PL number ${input.plNumber} already exists in this workspace`,
      });
    }

    const id = randomUUID();
    const now = new Date();

    // Business rule advisories for railway-specific fields
    if (input.itemType === "VD" && !input.uvamItemId) {
      logWarn(`[pl.create] Advisory: VD item ${input.plNumber} created without uvamItemId`);
    }
    if (input.itemType === "NVD" && !input.eligibilityCriteriaText && !input.eligibilityCriteriaDocId) {
      logWarn(`[pl.create] Advisory: NVD item ${input.plNumber} created without eligibility criteria`);
    }

    const [created] = await db
      .insert(plNumbers)
      .values({
        id,
        plNumber: input.plNumber,
        name: sanitizeUserInput(input.name),
        description: input.description ? sanitizeUserInput(input.description) : input.description,
        category: input.category,
        status: input.status,
        safetyCritical: input.safetyCritical,
        drawingRef: input.drawingRef ?? null,
        specification: input.specification ?? null,
        unit: input.unit,
        workshop: input.workshop,
        manufacturer: input.manufacturer ?? null,
        vendorCode: input.vendorCode ?? null,
        partFamily: input.partFamily ?? null,
        lifecycleStage: input.lifecycleStage ?? "active",
        // Railway-specific fields
        itemType: input.itemType ?? null,
        uvamItemId: input.uvamItemId ?? null,
        eligibilityCriteriaText: input.eligibilityCriteriaText ?? null,
        eligibilityCriteriaDocId: input.eligibilityCriteriaDocId ?? null,
        strDocId: input.strDocId ?? null,
        qapDocId: input.qapDocId ?? null,
        inspectionAgency: input.inspectionAgency ?? null,
        unitOfMeasurement: input.unitOfMeasurement ?? null,
        shelfLifeMonths: input.shelfLifeMonths ?? null,
        lastProcurementRate: input.lastProcurementRate ?? null,
        lastProcurementDate: input.lastProcurementDate ? new Date(input.lastProcurementDate) : null,
        workspaceId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "pl.create",
      resourceType: "pl_number",
      resourceId: id,
      resourceTitle: `${input.plNumber} - ${input.name}`,
      details: `Created PL number ${input.plNumber}`,
      workspaceId,
    });

    return created;
  }),

  // --- 7. pl.update ---
  update: engineerProcedure.input(updatePlSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";
    const userRole = ctx.session.user.role as UserRole;

    const [oldPl] = await db
      .select()
      .from(plNumbers)
      .where(and(eq(plNumbers.id, input.id), eq(plNumbers.workspaceId, workspaceId)));

    if (!oldPl) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
    }

    // If safetyCritical is being changed, require supervisor+ role
    if (input.safetyCritical !== undefined && input.safetyCritical !== oldPl.safetyCritical) {
      if (!isRoleAtLeast(userRole, "supervisor")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Changing safety-critical status requires supervisor role or higher",
        });
      }
    }

    // If status is being set to deprecated/obsolete, check for open work records (same guard as changeStatus)
    if (
      input.status !== undefined &&
      (input.status === "deprecated" || input.status === "obsolete") &&
      input.status !== oldPl.status
    ) {
      const openRecords = await db
        .select({ id: workRecords.id })
        .from(workRecords)
        .where(
          and(
            eq(workRecords.plNumberId, input.id),
            inArray(workRecords.status, ["open", "in_progress"]),
          ),
        )
        .limit(1);

      if (openRecords.length > 0 && userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Cannot set status to deprecated/obsolete while open work records exist. Admin override required.",
        });
      }
    }

    const { id, ...updates } = input;
    const setValues: Record<string, unknown> = { updatedAt: new Date(), updatedBy: userId };

    if (updates.name !== undefined) setValues.name = sanitizeUserInput(updates.name);
    if (updates.description !== undefined) setValues.description = updates.description ? sanitizeUserInput(updates.description) : updates.description;
    if (updates.category !== undefined) setValues.category = updates.category;
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.safetyCritical !== undefined) setValues.safetyCritical = updates.safetyCritical;
    if (updates.drawingRef !== undefined) setValues.drawingRef = updates.drawingRef;
    if (updates.specification !== undefined) setValues.specification = updates.specification;
    if (updates.unit !== undefined) setValues.unit = updates.unit;
    if (updates.workshop !== undefined) setValues.workshop = updates.workshop;
    if (updates.manufacturer !== undefined) setValues.manufacturer = updates.manufacturer;
    if (updates.vendorCode !== undefined) setValues.vendorCode = updates.vendorCode;
    if (updates.partFamily !== undefined) setValues.partFamily = updates.partFamily;
    if (updates.lifecycleStage !== undefined) setValues.lifecycleStage = updates.lifecycleStage;
    // Railway-specific fields
    if (updates.itemType !== undefined) setValues.itemType = updates.itemType;
    if (updates.uvamItemId !== undefined) setValues.uvamItemId = updates.uvamItemId;
    if (updates.eligibilityCriteriaText !== undefined) setValues.eligibilityCriteriaText = updates.eligibilityCriteriaText;
    if (updates.eligibilityCriteriaDocId !== undefined) setValues.eligibilityCriteriaDocId = updates.eligibilityCriteriaDocId;
    if (updates.strDocId !== undefined) setValues.strDocId = updates.strDocId;
    if (updates.qapDocId !== undefined) setValues.qapDocId = updates.qapDocId;
    if (updates.inspectionAgency !== undefined) setValues.inspectionAgency = updates.inspectionAgency;
    if (updates.unitOfMeasurement !== undefined) setValues.unitOfMeasurement = updates.unitOfMeasurement;
    if (updates.shelfLifeMonths !== undefined) setValues.shelfLifeMonths = updates.shelfLifeMonths;
    if (updates.lastProcurementRate !== undefined) setValues.lastProcurementRate = updates.lastProcurementRate;
    if (updates.lastProcurementDate !== undefined) setValues.lastProcurementDate = updates.lastProcurementDate ? new Date(updates.lastProcurementDate) : null;

    // Business rule advisories for railway-specific fields
    const effectiveItemType = (updates.itemType !== undefined ? updates.itemType : oldPl.itemType) as string | null;
    if (effectiveItemType === "VD") {
      const effectiveUvamId = updates.uvamItemId !== undefined ? updates.uvamItemId : (oldPl as Record<string, unknown>).uvamItemId;
      if (!effectiveUvamId) {
        logWarn(`[pl.update] Advisory: VD item ${oldPl.plNumber} updated without uvamItemId`);
      }
    }
    if (effectiveItemType === "NVD") {
      const effectiveEcText = updates.eligibilityCriteriaText !== undefined ? updates.eligibilityCriteriaText : (oldPl as Record<string, unknown>).eligibilityCriteriaText;
      const effectiveEcDoc = updates.eligibilityCriteriaDocId !== undefined ? updates.eligibilityCriteriaDocId : (oldPl as Record<string, unknown>).eligibilityCriteriaDocId;
      if (!effectiveEcText && !effectiveEcDoc) {
        logWarn(`[pl.update] Advisory: NVD item ${oldPl.plNumber} updated without eligibility criteria`);
      }
    }

    const [updated] = await db
      .update(plNumbers)
      .set(setValues)
      .where(eq(plNumbers.id, id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "pl.update",
      resourceType: "pl_number",
      resourceId: id,
      resourceTitle: oldPl.name,
      details: `Updated PL ${oldPl.plNumber} fields: ${Object.keys(updates).join(", ")}`,
      oldValue: JSON.stringify(
        Object.fromEntries(
          Object.keys(updates).map((k) => [k, (oldPl as Record<string, unknown>)[k]]),
        ),
      ),
      newValue: JSON.stringify(
        Object.fromEntries(
          Object.keys(updates).map((k) => [k, (updated as Record<string, unknown>)[k]]),
        ),
      ),
      workspaceId,
    });

    return updated;
  }),

  // --- 8. pl.changeStatus ---
  changeStatus: engineerProcedure.input(plChangeStatusSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";
    const userRole = ctx.session.user.role as UserRole;

    const [pl] = await db
      .select()
      .from(plNumbers)
      .where(and(eq(plNumbers.id, input.id), eq(plNumbers.workspaceId, workspaceId)));

    if (!pl) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
    }

    // For deprecated/obsolete transitions, check for open work records
    if (input.status === "deprecated" || input.status === "obsolete") {
      const openRecords = await db
        .select({ id: workRecords.id })
        .from(workRecords)
        .where(
          and(
            eq(workRecords.plNumberId, input.id),
            inArray(workRecords.status, ["open", "in_progress"]),
          ),
        )
        .limit(1);

      if (openRecords.length > 0 && userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Cannot change status to deprecated/obsolete while open work records exist. Admin override required.",
        });
      }
    }

    const [updated] = await db
      .update(plNumbers)
      .set({ status: input.status, updatedAt: new Date(), updatedBy: userId })
      .where(eq(plNumbers.id, input.id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "pl.changeStatus",
      resourceType: "pl_number",
      resourceId: input.id,
      resourceTitle: pl.name,
      details: `Status changed from ${pl.status} to ${input.status}. Reason: ${input.reason}`,
      oldValue: pl.status,
      newValue: input.status,
      workspaceId,
    });

    return updated;
  }),

  // --- 9. pl.addAlias ---
  addAlias: engineerProcedure.input(plAliasSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Verify PL belongs to workspace
    const [pl] = await db
      .select({ id: plNumbers.id, plNumber: plNumbers.plNumber })
      .from(plNumbers)
      .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

    if (!pl) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
    }

    // Normalize alias
    const normalizedAlias = input.alias.trim().toLowerCase();

    // Check uniqueness within workspace
    const [existing] = await db
      .select({ id: plAliases.id })
      .from(plAliases)
      .where(and(eq(plAliases.workspaceId, workspaceId), eq(plAliases.alias, normalizedAlias)));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Alias "${normalizedAlias}" already exists in this workspace`,
      });
    }

    const id = randomUUID();

    const [created] = await db
      .insert(plAliases)
      .values({
        id,
        plId: input.plId,
        workspaceId,
        alias: normalizedAlias,
        aliasType: input.aliasType,
        createdBy: userId,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "pl.addAlias",
      resourceType: "pl_alias",
      resourceId: id,
      resourceTitle: normalizedAlias,
      details: `Added alias "${normalizedAlias}" (${input.aliasType}) to PL ${pl.plNumber}`,
      workspaceId,
    });

    return created;
  }),

  // --- 10. pl.removeAlias ---
  removeAlias: engineerProcedure
    .input(z.object({ aliasId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Verify alias belongs to a PL in user's workspace
      const [alias] = await db
        .select()
        .from(plAliases)
        .where(and(eq(plAliases.id, input.aliasId), eq(plAliases.workspaceId, workspaceId)));

      if (!alias) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Alias not found" });
      }

      await db.delete(plAliases).where(eq(plAliases.id, input.aliasId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "pl.removeAlias",
        resourceType: "pl_alias",
        resourceId: input.aliasId,
        resourceTitle: alias.alias,
        details: `Removed alias "${alias.alias}" from PL ${alias.plId}`,
        workspaceId,
      });

      return { success: true };
    }),

  // --- 11. pl.addRelationship ---
  addRelationship: engineerProcedure.input(plRelationshipSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // No self-reference
    if (input.sourcePlId === input.targetPlId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot create a relationship between a PL and itself",
      });
    }

    // Verify both PLs belong to workspace
    const sourcePls = await db
      .select({ id: plNumbers.id })
      .from(plNumbers)
      .where(
        and(
          inArray(plNumbers.id, [input.sourcePlId, input.targetPlId]),
          eq(plNumbers.workspaceId, workspaceId),
        ),
      );

    if (sourcePls.length < 2) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "One or both PL numbers not found in this workspace",
      });
    }

    // Check unique constraint
    const [existing] = await db
      .select({ id: plRelationships.id })
      .from(plRelationships)
      .where(
        and(
          eq(plRelationships.sourcePlId, input.sourcePlId),
          eq(plRelationships.targetPlId, input.targetPlId),
          eq(plRelationships.relationType, input.relationType),
        ),
      );

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This relationship already exists",
      });
    }

    const id = randomUUID();

    const [created] = await db
      .insert(plRelationships)
      .values({
        id,
        workspaceId,
        sourcePlId: input.sourcePlId,
        targetPlId: input.targetPlId,
        relationType: input.relationType,
        notes: input.notes ?? null,
        createdBy: userId,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "pl.addRelationship",
      resourceType: "pl_relationship",
      resourceId: id,
      details: `Created ${input.relationType} relationship from ${input.sourcePlId} to ${input.targetPlId}`,
      workspaceId,
    });

    return created;
  }),

  // --- 12. pl.removeRelationship ---
  removeRelationship: engineerProcedure
    .input(z.object({ relationshipId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Verify workspace ownership
      const [rel] = await db
        .select()
        .from(plRelationships)
        .where(
          and(
            eq(plRelationships.id, input.relationshipId),
            eq(plRelationships.workspaceId, workspaceId),
          ),
        );

      if (!rel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Relationship not found" });
      }

      await db.delete(plRelationships).where(eq(plRelationships.id, input.relationshipId));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "pl.removeRelationship",
        resourceType: "pl_relationship",
        resourceId: input.relationshipId,
        details: `Removed ${rel.relationType} relationship from ${rel.sourcePlId} to ${rel.targetPlId}`,
        workspaceId,
      });

      return { success: true };
    }),

  // --- 13. pl.linkDocument ---
  linkDocument: engineerProcedure.input(plLinkDocumentSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Verify PL belongs to workspace
    const [pl] = await db
      .select({ id: plNumbers.id, plNumber: plNumbers.plNumber })
      .from(plNumbers)
      .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

    if (!pl) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
    }

    // Check if link already exists (upsert)
    const [existingLink] = await db
      .select()
      .from(documentPlLinks)
      .where(
        and(
          eq(documentPlLinks.documentId, input.documentId),
          eq(documentPlLinks.plNumberId, input.plId),
        ),
      );

    let result;
    if (existingLink) {
      // Update existing link
      [result] = await db
        .update(documentPlLinks)
        .set({
          linkType: input.linkType,
          confidence: input.confidence ?? null,
          notes: input.notes ?? null,
          linkedBy: userId,
          linkedAt: new Date(),
        })
        .where(eq(documentPlLinks.id, existingLink.id))
        .returning();
    } else {
      // Insert new link
      const id = randomUUID();
      [result] = await db
        .insert(documentPlLinks)
        .values({
          id,
          documentId: input.documentId,
          plNumberId: input.plId,
          linkType: input.linkType,
          confidence: input.confidence ?? null,
          notes: input.notes ?? null,
          linkedBy: userId,
          linkedAt: new Date(),
        })
        .returning();
    }

    await createAuditEntry(db, {
      userId,
      userName,
      action: "pl.linkDocument",
      resourceType: "document_pl_link",
      resourceId: result.id,
      details: `Linked document ${input.documentId} to PL ${pl.plNumber} (${input.linkType})`,
      workspaceId,
    });

    return result;
  }),

  // --- 14. pl.unlinkDocument ---
  unlinkDocument: engineerProcedure
    .input(z.object({ plId: z.string(), documentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";
      const userRole = ctx.session.user.role as UserRole;

      // Verify PL belongs to workspace
      const [pl] = await db
        .select({ id: plNumbers.id, plNumber: plNumbers.plNumber })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const [link] = await db
        .select()
        .from(documentPlLinks)
        .where(
          and(
            eq(documentPlLinks.documentId, input.documentId),
            eq(documentPlLinks.plNumberId, input.plId),
          ),
        );

      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link not found" });
      }

      // For ocr_accepted links, require supervisor+ role
      if (link.linkType === "ocr_accepted") {
        if (!isRoleAtLeast(userRole, "supervisor")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unlinking OCR-accepted links requires supervisor role or higher",
          });
        }
      }

      await db.delete(documentPlLinks).where(eq(documentPlLinks.id, link.id));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "pl.unlinkDocument",
        resourceType: "document_pl_link",
        resourceId: link.id,
        details: `Unlinked document ${input.documentId} from PL ${pl.plNumber}`,
        workspaceId,
      });

      return { success: true };
    }),

  // --- 15. pl.getDocuments ---
  getDocuments: protectedProcedure
    .input(
      z.object({
        plId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
        status: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify PL belongs to workspace
      const [pl] = await db
        .select({ id: plNumbers.id })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const conditions = [eq(documentPlLinks.plNumberId, input.plId)];

      if (input.status) {
        conditions.push(
          eq(documents.status, input.status as "draft" | "pending_review" | "under_review" | "approved" | "rejected" | "superseded" | "archived"),
        );
      }
      if (input.category) {
        conditions.push(
          eq(documents.category, input.category as "DRAWING" | "SPECIFICATION" | "ELIGIBILITY_CRITERIA" | "INSPECTION_REPORT" | "TEST_CERTIFICATE" | "MATERIAL_CERTIFICATE" | "PROCEDURE" | "WORK_ORDER" | "CORRESPONDENCE" | "MANUAL" | "OTHER" | "STR" | "EC" | "SOS" | "SOR" | "QAP" | "SET_LIST" | "GAD" | "WIRING_DIAGRAM" | "BOM_DOCUMENT" | "VENDOR_DOCUMENT"),
        );
      }

      const whereClause = and(...conditions);
      const offset = (input.page - 1) * input.pageSize;

      const [data, totalResult] = await Promise.all([
        db
          .select({
            linkId: documentPlLinks.id,
            documentId: documents.id,
            documentNumber: documents.documentNumber,
            title: documents.title,
            category: documents.category,
            status: documents.status,
            linkType: documentPlLinks.linkType,
            confidence: documentPlLinks.confidence,
            linkedAt: documentPlLinks.linkedAt,
            notes: documentPlLinks.notes,
          })
          .from(documentPlLinks)
          .innerJoin(documents, eq(documentPlLinks.documentId, documents.id))
          .where(whereClause)
          .orderBy(desc(documentPlLinks.linkedAt))
          .offset(offset)
          .limit(input.pageSize),
        db
          .select({ totalCount: count() })
          .from(documentPlLinks)
          .innerJoin(documents, eq(documentPlLinks.documentId, documents.id))
          .where(whereClause),
      ]);

      return {
        data,
        totalCount: totalResult[0]?.totalCount ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // --- 16. pl.getBomUsage ---
  getBomUsage: protectedProcedure
    .input(z.object({ plId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify PL belongs to workspace
      const [pl] = await db
        .select({ id: plNumbers.id })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      // As product: this PL is the product itself
      const asProduct = await db
        .select()
        .from(bomProducts)
        .where(eq(bomProducts.plNumberId, input.plId));

      // As component: this PL is used as a BOM entry in other products
      const asComponent = await db
        .select({
          entryId: bomEntries.id,
          itemNumber: bomEntries.itemNumber,
          partName: bomEntries.partName,
          partNumber: bomEntries.partNumber,
          quantity: bomEntries.quantity,
          unit: bomEntries.unit,
          productId: bomProducts.id,
          productCode: bomProducts.productCode,
          productName: bomProducts.name,
        })
        .from(bomEntries)
        .innerJoin(bomProducts, eq(bomEntries.bomProductId, bomProducts.id))
        .where(eq(bomEntries.plNumberId, input.plId));

      return { asProduct, asComponent };
    }),

  // --- 17. pl.getWorkRecords ---
  getWorkRecords: protectedProcedure
    .input(
      z.object({
        plId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
        status: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify PL belongs to workspace
      const [pl] = await db
        .select({ id: plNumbers.id })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const conditions = [eq(workRecords.plNumberId, input.plId)];
      if (input.status) {
        conditions.push(
          eq(workRecords.status, input.status as "open" | "in_progress" | "completed" | "on_hold" | "cancelled"),
        );
      }

      const whereClause = and(...conditions);
      const offset = (input.page - 1) * input.pageSize;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(workRecords)
          .where(whereClause)
          .orderBy(desc(workRecords.createdAt))
          .offset(offset)
          .limit(input.pageSize),
        db.select({ totalCount: count() }).from(workRecords).where(whereClause),
      ]);

      return {
        data,
        totalCount: totalResult[0]?.totalCount ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // --- 18. pl.getOcrHits ---
  getOcrHits: protectedProcedure
    .input(z.object({ plId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Get the PL's plNumber first
      const [pl] = await db
        .select({ id: plNumbers.id, plNumber: plNumbers.plNumber })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const hits = await db
        .select({
          id: ocrPlCandidates.id,
          documentId: ocrPlCandidates.documentId,
          plNumber: ocrPlCandidates.plNumber,
          confidence: ocrPlCandidates.confidence,
          pageNumber: ocrPlCandidates.pageNumber,
          context: ocrPlCandidates.context,
          mod11Valid: ocrPlCandidates.mod11Valid,
          status: ocrPlCandidates.status,
          createdAt: ocrPlCandidates.createdAt,
          documentTitle: documents.title,
          documentNumber: documents.documentNumber,
        })
        .from(ocrPlCandidates)
        .innerJoin(documents, eq(ocrPlCandidates.documentId, documents.id))
        .where(
          and(
            eq(ocrPlCandidates.plNumber, pl.plNumber),
            eq(ocrPlCandidates.workspaceId, workspaceId),
          ),
        );

      return hits;
    }),

  // --- 19. pl.getTraceabilitySummary ---
  getTraceabilitySummary: protectedProcedure
    .input(z.object({ plId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify PL belongs to workspace
      const [pl] = await db
        .select({ id: plNumbers.id, plNumber: plNumbers.plNumber })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const [documentsCount, bomProductsCount, bomComponentsCount, workRecordsCount, ocrHitsCount] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(documentPlLinks)
            .where(eq(documentPlLinks.plNumberId, input.plId)),
          db
            .select({ count: count() })
            .from(bomProducts)
            .where(eq(bomProducts.plNumberId, input.plId)),
          db
            .select({ count: count() })
            .from(bomEntries)
            .where(eq(bomEntries.plNumberId, input.plId)),
          db
            .select({ count: count() })
            .from(workRecords)
            .where(eq(workRecords.plNumberId, input.plId)),
          db
            .select({ count: count() })
            .from(ocrPlCandidates)
            .where(eq(ocrPlCandidates.plNumber, pl.plNumber)),
        ]);

      return {
        documents: documentsCount[0]?.count ?? 0,
        bomProducts: bomProductsCount[0]?.count ?? 0,
        bomComponents: bomComponentsCount[0]?.count ?? 0,
        workRecords: workRecordsCount[0]?.count ?? 0,
        ocrHits: ocrHitsCount[0]?.count ?? 0,
      };
    }),

  // --- 20. pl.searchCandidates ---
  searchCandidates: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const searchQuery = input.query.trim();
      const limit = input.limit;

      // Try exact pl_number match first
      const exactMatches = await db
        .select()
        .from(plNumbers)
        .where(and(eq(plNumbers.plNumber, searchQuery), eq(plNumbers.workspaceId, workspaceId)))
        .limit(limit);

      if (exactMatches.length > 0) {
        return exactMatches;
      }

      // Then prefix match on pl_number
      const prefixMatches = await db
        .select()
        .from(plNumbers)
        .where(
          and(
            ilike(plNumbers.plNumber, `${searchQuery}%`),
            eq(plNumbers.workspaceId, workspaceId),
          ),
        )
        .limit(limit);

      if (prefixMatches.length > 0) {
        return prefixMatches;
      }

      // Then alias match
      const aliasMatches = await db
        .select({
          aliasId: plAliases.id,
          plId: plAliases.plId,
        })
        .from(plAliases)
        .where(
          and(
            ilike(plAliases.alias, `%${searchQuery}%`),
            eq(plAliases.workspaceId, workspaceId),
          ),
        )
        .limit(limit);

      if (aliasMatches.length > 0) {
        const plIds = aliasMatches.map((a) => a.plId);
        const results = await db
          .select()
          .from(plNumbers)
          .where(inArray(plNumbers.id, plIds))
          .limit(limit);
        return results;
      }

      // Finally ILIKE on name/drawingRef/specification
      const searchTerm = `%${searchQuery}%`;
      const results = await db
        .select()
        .from(plNumbers)
        .where(
          and(
            eq(plNumbers.workspaceId, workspaceId),
            or(
              ilike(plNumbers.name, searchTerm),
              ilike(plNumbers.drawingRef, searchTerm),
              ilike(plNumbers.specification, searchTerm),
            ),
          ),
        )
        .limit(limit);

      return results;
    }),

  // --- Backward-compatible aliases ---
  getLinkedDocs: protectedProcedure
    .input(z.object({ plId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [pl] = await db
        .select({ id: plNumbers.id })
        .from(plNumbers)
        .where(and(eq(plNumbers.id, input.plId), eq(plNumbers.workspaceId, workspaceId)));

      if (!pl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PL number not found" });
      }

      const data = await db
        .select({
          linkId: documentPlLinks.id,
          documentId: documents.id,
          documentNumber: documents.documentNumber,
          title: documents.title,
          category: documents.category,
          status: documents.status,
          linkType: documentPlLinks.linkType,
          confidence: documentPlLinks.confidence,
          linkedAt: documentPlLinks.linkedAt,
          notes: documentPlLinks.notes,
        })
        .from(documentPlLinks)
        .innerJoin(documents, eq(documentPlLinks.documentId, documents.id))
        .where(eq(documentPlLinks.plNumberId, input.plId))
        .orderBy(desc(documentPlLinks.linkedAt));

      return data;
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(2), limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const searchTerm = `%${input.query}%`;

      const results = await db
        .select()
        .from(plNumbers)
        .where(
          and(
            eq(plNumbers.workspaceId, workspaceId),
            or(
              ilike(plNumbers.plNumber, searchTerm),
              ilike(plNumbers.name, searchTerm),
              ilike(plNumbers.drawingRef, searchTerm),
              ilike(plNumbers.specification, searchTerm),
            ),
          ),
        )
        .limit(input.limit);

      return results;
    }),

  // --- 21. pl.searchDocumentsForLinking ---
  searchDocumentsForLinking: protectedProcedure
    .input(searchDocumentsForLinkingSchema)
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const searchTerm = `%${input.query.trim()}%`;

      const results = await db
        .select({
          id: documents.id,
          documentNumber: documents.documentNumber,
          title: documents.title,
          category: documents.category,
        })
        .from(documents)
        .where(
          and(
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, false),
            or(
              ilike(documents.documentNumber, searchTerm),
              ilike(documents.title, searchTerm),
            ),
          ),
        )
        .limit(input.limit);

      return results;
    }),

  // --- 22. pl.bulkImport ---
  bulkImport: engineerProcedure.input(plBulkImportSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const errors: Array<{ index: number; plNumber: string; error: string }> = [];
    const validRows: Array<{ index: number; row: (typeof input.rows)[number] }> = [];

    // Get all existing PL numbers in workspace to check uniqueness
    const existingPls = await db
      .select({ plNumber: plNumbers.plNumber })
      .from(plNumbers)
      .where(eq(plNumbers.workspaceId, workspaceId));

    const existingSet = new Set(existingPls.map((p) => p.plNumber));
    const newNumbersInBatch = new Set<string>();

    // Validate all rows before inserting (fail-fast on format/uniqueness issues)
    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i];

      // Validate format
      try {
        assertValidPl(row.plNumber);
      } catch (e) {
        errors.push({
          index: i,
          plNumber: row.plNumber,
          error: e instanceof TRPCError ? e.message : "Invalid PL number format",
        });
        continue;
      }

      // Check uniqueness
      if (existingSet.has(row.plNumber) || newNumbersInBatch.has(row.plNumber)) {
        errors.push({
          index: i,
          plNumber: row.plNumber,
          error: `PL number ${row.plNumber} already exists`,
        });
        continue;
      }

      newNumbersInBatch.add(row.plNumber);
      validRows.push({ index: i, row });
    }

    // Insert all valid rows inside a transaction for atomicity
    let importedCount = 0;
    if (validRows.length > 0) {
      await db.transaction(async (tx) => {
        for (const { row } of validRows) {
          const id = randomUUID();
          const now = new Date();

          await tx.insert(plNumbers).values({
            id,
            plNumber: row.plNumber,
            name: row.name,
            description: row.description,
            category: row.category,
            status: row.status,
            safetyCritical: row.safetyCritical,
            drawingRef: row.drawingRef ?? null,
            specification: row.specification ?? null,
            unit: row.unit,
            workshop: row.workshop,
            manufacturer: row.manufacturer ?? null,
            vendorCode: row.vendorCode ?? null,
            partFamily: row.partFamily ?? null,
            lifecycleStage: row.lifecycleStage ?? "active",
            workspaceId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
          });

          await createAuditEntry(tx, {
            userId,
            userName,
            action: "pl.bulkImport",
            resourceType: "pl_number",
            resourceId: id,
            resourceTitle: `${row.plNumber} - ${row.name}`,
            details: `Bulk imported PL number ${row.plNumber}`,
            workspaceId,
          });

          importedCount++;
        }
      });
    }

    return { imported: importedCount, errors };
  }),
});
