import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeatureFlagService } from "../feature-flags";

describe("FeatureFlagService", () => {
  beforeEach(() => {
    FeatureFlagService.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setEnabled", () => {
    it("should update the enabled state of an existing feature flag", () => {
      const service = FeatureFlagService.getInstance();
      const testKey = "ocr_processing"; // known key from mock data

      const initialFlag = service.getFlag(testKey);
      expect(initialFlag).toBeDefined();
      const initialState = initialFlag?.enabled;

      // Update the flag to the opposite of its initial state
      service.setEnabled(testKey, !initialState);

      const updatedFlag = service.getFlag(testKey);
      expect(updatedFlag?.enabled).toBe(!initialState);
      expect(service.isEnabled(testKey)).toBe(!initialState);
    });

    it("should update the lastModified property of the feature flag", () => {
      const service = FeatureFlagService.getInstance();
      const testKey = "ocr_processing";

      const mockDate = new Date("2025-01-01T12:00:00Z");

      // Mock the global Date object for new Date()
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as unknown as Date);

      service.setEnabled(testKey, false);

      const updatedFlag = service.getFlag(testKey);
      expect(updatedFlag?.lastModified).toBe(mockDate.toISOString());
    });

    it("should not throw an error or update anything when the key does not exist", () => {
      const service = FeatureFlagService.getInstance();
      const nonExistentKey = "this_key_does_not_exist";

      expect(() => {
        service.setEnabled(nonExistentKey, true);
      }).not.toThrow();

      const flag = service.getFlag(nonExistentKey);
      expect(flag).toBeUndefined();
    });
  });
});
