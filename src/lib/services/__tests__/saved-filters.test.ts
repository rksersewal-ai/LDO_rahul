import { describe, expect, it } from "vitest";
import { generateFilterId, SavedFiltersService } from "../saved-filters";

describe("generateFilterId", () => {
  it("should generate filter IDs with sf_ prefix", () => {
    const id = generateFilterId();
    expect(id).toMatch(/^sf_[A-Za-z0-9_-]+$/);
  });

  it("should generate unique IDs across multiple invocations", () => {
    const ids = new Set<string>();
    const count = 100;
    for (let i = 0; i < count; i++) {
      ids.add(generateFilterId());
    }
    expect(ids.size).toBe(count);
  });
});

describe("SavedFiltersService", () => {
  it("should save a filter with a cryptographically secure ID", () => {
    const service = SavedFiltersService.getInstance();
    const filter = service.save("documents", "My Filter", { status: "active" });

    expect(filter.id).toMatch(/^sf_[A-Za-z0-9_-]+$/);
    expect(filter.label).toBe("My Filter");
    expect(filter.pageKey).toBe("documents");
    expect(filter.filters).toEqual({ status: "active" });
  });
});
