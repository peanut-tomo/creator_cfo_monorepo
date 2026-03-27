import { describe, expect, it } from "vitest";

import {
  buildDeviceStateStorageKey,
  buildVaultRelativePath,
  deviceStateContract,
  fileVaultContract,
  structuredStoreContract,
} from "../src/contracts";

describe("storage contracts", () => {
  it("keeps the required finance tables", () => {
    expect(structuredStoreContract.tables).toHaveLength(5);
    expect(structuredStoreContract.tables.map((table) => table.name)).toContain(
      "cash_flow_snapshots",
    );
  });

  it("normalizes file paths for the vault", () => {
    expect(buildVaultRelativePath("receipts", "March Receipt 01.JPG")).toBe(
      "receipts/march-receipt-01.jpg",
    );
    expect(fileVaultContract.collections.map((collection) => collection.slug)).toContain(
      "tax-support",
    );
  });

  it("documents the persisted device state keys", () => {
    expect(deviceStateContract.records.map((record) => record.key)).toEqual([
      "theme_preference",
      "locale_preference",
      "auth_session",
    ]);
    expect(buildDeviceStateStorageKey("auth_session")).toBe(
      "@creator-cfo/mobile/auth_session",
    );
  });
});
