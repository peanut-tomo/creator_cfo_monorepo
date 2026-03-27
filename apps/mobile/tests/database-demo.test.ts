import { describe, expect, it } from "vitest";

import {
  buildDatabaseDemoFieldUpdate,
  buildDatabaseDemoMetrics,
  buildDatabaseDemoSummary,
  createDatabaseDemoFixture,
  createDatabaseDemoRecordDraft,
  createDatabaseDemoRecordId,
  createEmptyDatabaseDemoSnapshot,
  databaseDemoIds,
  databaseDemoSourceSystem,
  formatAmountLabel,
  getDatabaseDemoRecordSequence,
  getNextDatabaseDemoRecordSequence,
} from "../src/features/database-demo/demo-data";

describe("database hook demo helpers", () => {
  it("creates deterministic fixtures and sequenced record drafts for the demo", () => {
    const fixture = createDatabaseDemoFixture();
    const firstRecord = createDatabaseDemoRecordDraft(1);
    const thirdRecord = createDatabaseDemoRecordDraft(3);

    expect(fixture.entity.entityId).toBe(databaseDemoIds.entityId);
    expect(firstRecord.recordId).toBe(databaseDemoIds.recordIdPrefix);
    expect(firstRecord.sourceSystem).toBe(databaseDemoSourceSystem);
    expect(thirdRecord.recordId).toBe(`${databaseDemoIds.recordIdPrefix}-3`);
    expect(getDatabaseDemoRecordSequence(thirdRecord.recordId)).toBe(3);
    expect(getNextDatabaseDemoRecordSequence([firstRecord.recordId, thirdRecord.recordId])).toBe(4);
  });

  it("builds field-scoped updates for the selected record", () => {
    const descriptionUpdate = buildDatabaseDemoFieldUpdate(
      {
        description: "YouTube payout 2",
        recordId: createDatabaseDemoRecordId(2),
        recordStatus: "posted",
      },
      "description",
    );
    const statusUpdate = buildDatabaseDemoFieldUpdate(
      {
        description: "YouTube payout 2 reviewed",
        recordId: createDatabaseDemoRecordId(2),
        recordStatus: "posted",
      },
      "recordStatus",
    );

    expect(descriptionUpdate.nextValue).toBe("YouTube payout 2 reviewed");
    expect(statusUpdate.nextValue).toBe("reconciled");
  });

  it("summarizes empty and populated snapshots", () => {
    const emptySnapshot = createEmptyDatabaseDemoSnapshot();

    expect(buildDatabaseDemoSummary(emptySnapshot, null)).toContain("No demo records exist yet");
    expect(buildDatabaseDemoMetrics(emptySnapshot)[0]?.value).toBe("0");

    const populatedSnapshot = {
      ...emptySnapshot,
      counts: {
        derivedLineCount: 4,
        recordCount: 2,
      },
      doubleEntryLines: [
        {
          accountName: "Business Checking",
          accountRole: "cash",
          amountLabel: "USD 108.00",
          direction: "debit" as const,
          lineNo: 10,
        },
      ],
    };

    expect(buildDatabaseDemoSummary(populatedSnapshot, createDatabaseDemoRecordId(2))).toContain(
      "2 demo records are present",
    );
    expect(buildDatabaseDemoSummary(populatedSnapshot, createDatabaseDemoRecordId(2))).toContain(
      createDatabaseDemoRecordId(2),
    );
    expect(buildDatabaseDemoMetrics(populatedSnapshot)[1]?.label).toBe("Derived lines");
  });

  it("formats money labels in minor units", () => {
    expect(formatAmountLabel(10800, "USD")).toBe("USD 108.00");
    expect(formatAmountLabel(-1250, "USD")).toBe("-USD 12.50");
  });
});
