import { describe, expect, it } from "vitest";
import { checkDocumentAccess } from "../check-access";

describe("checkDocumentAccess", () => {
  it("allows access when workspace matches and clearance sufficient", () => {
    const result = checkDocumentAccess({
      userWorkspaceId: "ws-1",
      userClearanceLevel: 5,
      documentWorkspaceId: "ws-1",
      documentClearanceRequired: 3,
      isAdmin: false,
    });

    expect(result.allowed).toBe(true);
  });

  it("denies access when workspace mismatch", () => {
    const result = checkDocumentAccess({
      userWorkspaceId: "ws-1",
      userClearanceLevel: 5,
      documentWorkspaceId: "ws-2",
      documentClearanceRequired: 3,
      isAdmin: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("workspace");
  });

  it("allows admin to access any workspace", () => {
    const result = checkDocumentAccess({
      userWorkspaceId: "ws-1",
      userClearanceLevel: 5,
      documentWorkspaceId: "ws-2",
      documentClearanceRequired: 3,
      isAdmin: true,
    });

    expect(result.allowed).toBe(true);
  });

  it("denies access when clearance insufficient", () => {
    const result = checkDocumentAccess({
      userWorkspaceId: "ws-1",
      userClearanceLevel: 1,
      documentWorkspaceId: "ws-1",
      documentClearanceRequired: 3,
      isAdmin: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("clearance");
  });

  it("allows access when clearance exactly meets requirement", () => {
    const result = checkDocumentAccess({
      userWorkspaceId: "ws-1",
      userClearanceLevel: 3,
      documentWorkspaceId: "ws-1",
      documentClearanceRequired: 3,
      isAdmin: false,
    });

    expect(result.allowed).toBe(true);
  });

  it("allows access when document has no workspace (null)", () => {
    const result = checkDocumentAccess({
      userWorkspaceId: "ws-1",
      userClearanceLevel: 3,
      documentWorkspaceId: null,
      documentClearanceRequired: 2,
      isAdmin: false,
    });

    expect(result.allowed).toBe(true);
  });
});
