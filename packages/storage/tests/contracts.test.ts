import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildDeviceStateStorageKey,
  buildEvidenceDerivedPath,
  buildEvidenceManifestPath,
  buildEvidenceObjectPath,
  buildInvoiceExportPath,
  buildTaxSupportPath,
  buildVaultRelativePath,
  createLocalStorageBootstrapManifest,
  deviceStateContract,
  fileVaultContract,
  getLocalStorageBootstrapPlan,
  getLocalStorageOverview,
  getVaultCollectionSamplePath,
  sanitizeVaultFileName,
  structuredStoreContract,
} from "../src/index";

describe("storage contracts", () => {
  it("implements the required version-2 finance tables and views", () => {
    expect(structuredStoreContract.version).toBe(2);
    expect(structuredStoreContract.tables.map((table) => table.name)).toEqual([
      "entities",
      "accounts",
      "counterparties",
      "platform_accounts",
      "records",
      "evidences",
      "evidence_files",
      "record_evidence_links",
    ]);
    expect(structuredStoreContract.views.map((view) => view.name)).toEqual([
      "record_double_entry_lines_v",
      "income_snapshots_v",
      "invoice_records_v",
      "expense_records_v",
    ]);
    expect(structuredStoreContract.indexes.map((index) => index.name)).toEqual([
      "accounts_entity_code_idx",
      "records_entity_recognition_idx",
      "records_status_due_idx",
      "records_platform_idx",
      "evidence_files_sha_idx",
      "record_evidence_primary_idx",
    ]);
  });

  it("exposes a bootstrap plan that other components can consume directly", () => {
    const plan = getLocalStorageBootstrapPlan();
    const overview = getLocalStorageOverview();

    expect(plan.databaseName).toBe("creator-cfo-local.db");
    expect(plan.version).toBe(2);
    expect(plan.pragmas).toContain("PRAGMA foreign_keys = ON;");
    expect(plan.schemaStatements).toHaveLength(
      structuredStoreContract.tables.length +
        structuredStoreContract.views.length +
        structuredStoreContract.indexes.length,
    );
    expect(overview.tableCount).toBe(structuredStoreContract.tables.length);
    expect(overview.viewCount).toBe(structuredStoreContract.views.length);
    expect(overview.collectionCount).toBe(fileVaultContract.collections.length);
  });

  it("builds version-2 evidence and export paths", () => {
    expect(
      buildEvidenceObjectPath(
        "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789",
        ".PDF",
      ),
    ).toBe(
      "evidence-objects/ab/cd/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789.pdf",
    );
    expect(buildEvidenceManifestPath("Evidence 001")).toBe(
      "evidence-manifests/evidence-001.json",
    );
    expect(buildEvidenceDerivedPath("Evidence 001", "Preview 1.JPG")).toBe(
      "evidence-derived/evidence-001/preview-1.jpg",
    );
    expect(buildInvoiceExportPath("Record 99", 2026)).toBe("invoice-exports/2026/record-99.pdf");
    expect(buildTaxSupportPath("2026/Q1", "Evidence Package.ZIP")).toBe(
      "tax-support/2026-q1/evidence-package.zip",
    );
    expect(buildVaultRelativePath("evidence-manifests", "Statement 01.PDF")).toBe(
      "evidence-manifests/statement-01.pdf",
    );
    expect(sanitizeVaultFileName("...")).toBe("file");
  });

  it("builds a bootstrap manifest for the version-2 vault layout", () => {
    const manifest = createLocalStorageBootstrapManifest();

    expect(manifest.version).toBe(2);
    expect(manifest.fileCollections.map((collection) => collection.slug)).toContain(
      "evidence-objects",
    );
    expect(manifest.schemaObjects.views).toContain("record_double_entry_lines_v");
    expect(getVaultCollectionSamplePath("tax-support")).toBe(
      "tax-support/2026-q1/evidence-package.zip",
    );
  });

  it("keeps the canonical contract doc aligned with the implemented version", () => {
    const contractDocPath = fileURLToPath(
      new URL("../../../docs/contracts/local-storage.md", import.meta.url),
    );
    const contractDoc = readFileSync(contractDocPath, "utf8");

    expect(contractDoc).toContain("Current implemented contract version: `2`");
    expect(contractDoc).toContain("Implemented tables:");
    expect(contractDoc).toContain("Implemented views:");
    expect(contractDoc).toContain("Many-to-many record-to-evidence linkage is required.");
    expect(contractDoc).toContain("buildDeviceStateStorageKey()");
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
