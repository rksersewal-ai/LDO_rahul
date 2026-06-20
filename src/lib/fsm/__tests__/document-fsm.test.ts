import { describe, expect, it } from "vitest";
import { canTransition, getValidTransitions, TRANSITION_LABELS } from "../document-fsm";

describe("document-fsm", () => {
  describe("getValidTransitions", () => {
    it("returns [pending_review] for draft status (engineer)", () => {
      const result = getValidTransitions("draft", "engineer");
      expect(result).toEqual(["pending_review"]);
    });

    it("returns [under_review] for pending_review status (engineer)", () => {
      const result = getValidTransitions("pending_review", "engineer");
      expect(result).toEqual(["under_review"]);
    });

    it("returns [approved] for under_review status (engineer, no rejected/archived)", () => {
      const result = getValidTransitions("under_review", "engineer");
      expect(result).toEqual(["approved"]);
    });

    it("returns [superseded] for approved status (engineer, no archived)", () => {
      const result = getValidTransitions("approved", "engineer");
      expect(result).toEqual(["superseded"]);
    });

    it("returns [superseded, archived] for approved status (supervisor)", () => {
      const result = getValidTransitions("approved", "supervisor");
      expect(result).toContain("superseded");
      expect(result).toContain("archived");
    });

    it("returns [draft] for rejected status (engineer)", () => {
      const result = getValidTransitions("rejected", "engineer");
      expect(result).toEqual(["draft"]);
    });

    it("returns empty array for archived status", () => {
      const result = getValidTransitions("archived", "admin");
      expect(result).toEqual([]);
    });

    it("adds archived for supervisor from any non-archived status", () => {
      const statuses = ["draft", "pending_review", "under_review", "rejected", "superseded"];
      for (const status of statuses) {
        const result = getValidTransitions(status, "supervisor");
        expect(result).toContain("archived");
      }
    });

    it("supervisor can see rejected for under_review", () => {
      const result = getValidTransitions("under_review", "supervisor");
      expect(result).toContain("approved");
      expect(result).toContain("rejected");
      expect(result).toContain("archived");
    });

    it("does NOT add archived for engineer role", () => {
      const statuses = ["draft", "pending_review", "under_review", "rejected", "superseded"];
      for (const status of statuses) {
        const result = getValidTransitions(status, "engineer");
        expect(result).not.toContain("archived");
      }
    });

    it("admin can transition to archived from any non-archived status", () => {
      const statuses = ["draft", "pending_review", "under_review", "approved", "rejected", "superseded"];
      for (const status of statuses) {
        const result = getValidTransitions(status, "admin");
        expect(result).toContain("archived");
      }
    });

    it("viewer has no transitions that require supervisor", () => {
      const result = getValidTransitions("approved", "viewer");
      expect(result).not.toContain("archived");
    });
  });

  describe("canTransition", () => {
    it("returns true for valid transition: draft -> pending_review", () => {
      expect(canTransition("draft", "pending_review", "engineer")).toBe(true);
    });

    it("returns true for valid transition: pending_review -> under_review", () => {
      expect(canTransition("pending_review", "under_review", "engineer")).toBe(true);
    });

    it("returns true for valid transition: under_review -> approved", () => {
      expect(canTransition("under_review", "approved", "engineer")).toBe(true);
    });

    it("returns true for valid transition: under_review -> rejected (supervisor)", () => {
      expect(canTransition("under_review", "rejected", "supervisor")).toBe(true);
    });

    it("returns false for engineer trying to reject", () => {
      expect(canTransition("under_review", "rejected", "engineer")).toBe(false);
    });

    it("returns true for valid transition: approved -> superseded", () => {
      expect(canTransition("approved", "superseded", "engineer")).toBe(true);
    });

    it("returns true for supervisor archiving any document", () => {
      expect(canTransition("draft", "archived", "supervisor")).toBe(true);
      expect(canTransition("approved", "archived", "supervisor")).toBe(true);
      expect(canTransition("under_review", "archived", "supervisor")).toBe(true);
    });

    it("returns false for invalid transition: draft -> approved", () => {
      expect(canTransition("draft", "approved", "engineer")).toBe(false);
    });

    it("returns false for invalid transition: draft -> under_review", () => {
      expect(canTransition("draft", "under_review", "engineer")).toBe(false);
    });

    it("returns false for invalid transition: approved -> draft", () => {
      expect(canTransition("approved", "draft", "engineer")).toBe(false);
    });

    it("returns false for engineer trying to archive", () => {
      expect(canTransition("draft", "archived", "engineer")).toBe(false);
      expect(canTransition("approved", "archived", "engineer")).toBe(false);
    });

    it("returns false for transitioning from archived", () => {
      expect(canTransition("archived", "draft", "admin")).toBe(false);
      expect(canTransition("archived", "approved", "admin")).toBe(false);
    });

    it("rejected can only go back to draft", () => {
      expect(canTransition("rejected", "draft", "engineer")).toBe(true);
      expect(canTransition("rejected", "pending_review", "engineer")).toBe(false);
      expect(canTransition("rejected", "approved", "engineer")).toBe(false);
    });

    it("rejected is only valid from under_review (supervisor+ only)", () => {
      expect(canTransition("under_review", "rejected", "supervisor")).toBe(true);
      expect(canTransition("under_review", "rejected", "engineer")).toBe(false);
      expect(canTransition("draft", "rejected", "supervisor")).toBe(false);
      expect(canTransition("pending_review", "rejected", "supervisor")).toBe(false);
      expect(canTransition("approved", "rejected", "supervisor")).toBe(false);
    });
  });

  describe("TRANSITION_LABELS", () => {
    it("has a label for every document status", () => {
      expect(TRANSITION_LABELS.draft).toBe("Return to Draft");
      expect(TRANSITION_LABELS.pending_review).toBe("Submit for Review");
      expect(TRANSITION_LABELS.under_review).toBe("Begin Review");
      expect(TRANSITION_LABELS.approved).toBe("Approve");
      expect(TRANSITION_LABELS.rejected).toBe("Reject");
      expect(TRANSITION_LABELS.superseded).toBe("Supersede");
      expect(TRANSITION_LABELS.archived).toBe("Mark Obsolete");
    });
  });
});
