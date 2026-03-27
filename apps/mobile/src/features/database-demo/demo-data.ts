export const databaseDemoIds = {
  cashAccountId: "demo-account-cash",
  counterpartyId: "demo-counterparty-platform",
  entityId: "demo-entity",
  feeAccountId: "demo-account-platform-fees",
  incomeAccountId: "demo-account-platform-income",
  platformAccountId: "demo-platform-youtube",
  recordIdPrefix: "demo-record-platform-payout",
  withholdingAccountId: "demo-account-withholding-tax",
} as const;

export const databaseDemoSourceSystem = "demo-hooks" as const;

export type DatabaseDemoEditableField = "description" | "recordStatus";

export interface DatabaseDemoEditableFieldOption {
  description: string;
  label: string;
  value: DatabaseDemoEditableField;
}

export const databaseDemoEditableFields: readonly DatabaseDemoEditableFieldOption[] = [
  {
    description: "Toggle the selected record description between base and reviewed text.",
    label: "Description",
    value: "description",
  },
  {
    description: "Toggle the selected record status between posted and reconciled.",
    label: "Status",
    value: "recordStatus",
  },
];

export interface DatabaseDemoCounts {
  derivedLineCount: number;
  recordCount: number;
}

export interface DatabaseDemoRecordPreview {
  description: string;
  grossAmountLabel: string;
  netAmountLabel: string;
  recognizedOn: string;
  recordId: string;
  recordKind: string;
  status: string;
}

export interface DatabaseDemoDoubleEntryPreview {
  accountName: string;
  accountRole: string;
  amountLabel: string;
  direction: "credit" | "debit";
  lineNo: number;
}

export interface DatabaseDemoSnapshot {
  counts: DatabaseDemoCounts;
  doubleEntryLines: DatabaseDemoDoubleEntryPreview[];
  recentRecords: DatabaseDemoRecordPreview[];
  summary: string;
}

export interface DatabaseDemoMetric {
  label: string;
  value: string;
}

interface DatabaseDemoEntityFixture {
  baseCurrency: string;
  createdAt: string;
  defaultTimezone: string;
  entityId: string;
  entityType: string;
  legalName: string;
}

interface DatabaseDemoAccountFixture {
  accountCode: string;
  accountId: string;
  accountName: string;
  accountType: string;
  createdAt: string;
  entityId: string;
  normalBalance: string;
}

interface DatabaseDemoCounterpartyFixture {
  counterpartyId: string;
  counterpartyType: string;
  createdAt: string;
  displayName: string;
  entityId: string;
  legalName: string;
  notes: string;
}

interface DatabaseDemoPlatformAccountFixture {
  accountLabel: string;
  activeFrom: string;
  createdAt: string;
  entityId: string;
  externalAccountRef: string;
  platformAccountId: string;
  platformCode: string;
}

export interface DatabaseDemoRecordDraft {
  cashAccountId: string;
  cashOn: string;
  counterpartyId: string;
  createdAt: string;
  currency: string;
  description: string;
  entityId: string;
  evidenceStatus: string;
  feeAccountId: string;
  feeAmountCents: number;
  grossAmountCents: number;
  netCashAmountCents: number;
  platformAccountId: string;
  postingPattern: string;
  primaryAccountId: string;
  recognitionOn: string;
  recordId: string;
  recordKind: string;
  recordStatus: string;
  sourceSystem: string;
  updatedAt: string;
  withholdingAccountId: string;
  withholdingAmountCents: number;
}

export interface DatabaseDemoFixture {
  accounts: DatabaseDemoAccountFixture[];
  counterparty: DatabaseDemoCounterpartyFixture;
  entity: DatabaseDemoEntityFixture;
  platformAccount: DatabaseDemoPlatformAccountFixture;
}

export interface DatabaseDemoFieldUpdateInput {
  description: string;
  recordId: string;
  recordStatus: string;
}

export interface DatabaseDemoFieldUpdate {
  field: DatabaseDemoEditableField;
  nextValue: string;
  updatedAt: string;
}

export function createDatabaseDemoFixture(): DatabaseDemoFixture {
  const createdAt = "2026-03-27T09:00:00.000Z";

  return {
    entity: {
      baseCurrency: "USD",
      createdAt,
      defaultTimezone: "America/Los_Angeles",
      entityId: databaseDemoIds.entityId,
      entityType: "sole_proprietorship",
      legalName: "Demo Creator LLC",
    },
    accounts: [
      {
        accountCode: "1010",
        accountId: databaseDemoIds.cashAccountId,
        accountName: "Business Checking",
        accountType: "asset",
        createdAt,
        entityId: databaseDemoIds.entityId,
        normalBalance: "debit",
      },
      {
        accountCode: "4010",
        accountId: databaseDemoIds.incomeAccountId,
        accountName: "Platform Revenue",
        accountType: "income",
        createdAt,
        entityId: databaseDemoIds.entityId,
        normalBalance: "credit",
      },
      {
        accountCode: "6050",
        accountId: databaseDemoIds.feeAccountId,
        accountName: "Platform Fees",
        accountType: "expense",
        createdAt,
        entityId: databaseDemoIds.entityId,
        normalBalance: "debit",
      },
      {
        accountCode: "2150",
        accountId: databaseDemoIds.withholdingAccountId,
        accountName: "Withholding Tax Receivable",
        accountType: "asset",
        createdAt,
        entityId: databaseDemoIds.entityId,
        normalBalance: "debit",
      },
    ],
    counterparty: {
      counterpartyId: databaseDemoIds.counterpartyId,
      counterpartyType: "platform",
      createdAt,
      displayName: "YouTube",
      entityId: databaseDemoIds.entityId,
      legalName: "YouTube Partner Program",
      notes: "Fixture row for the database CRUD demo.",
    },
    platformAccount: {
      accountLabel: "Main channel",
      activeFrom: "2026-01-01",
      createdAt,
      entityId: databaseDemoIds.entityId,
      externalAccountRef: "channel-demo-001",
      platformAccountId: databaseDemoIds.platformAccountId,
      platformCode: "youtube",
    },
  };
}

export function createDatabaseDemoRecordDraft(sequence: number): DatabaseDemoRecordDraft {
  const normalizedSequence = Math.max(1, Math.trunc(sequence));
  const baseDate = createDemoBaseDate(normalizedSequence);
  const grossAmountCents = 12_500 + (normalizedSequence - 1) * 2_100;
  const feeAmountCents = 1_250 + (normalizedSequence - 1) * 150;
  const withholdingAmountCents = 450 + (normalizedSequence - 1) * 50;

  return {
    cashAccountId: databaseDemoIds.cashAccountId,
    cashOn: formatDateOnly(baseDate),
    counterpartyId: databaseDemoIds.counterpartyId,
    createdAt: createIsoTimestamp(baseDate, 9, normalizedSequence),
    currency: "USD",
    description: `YouTube payout ${normalizedSequence}`,
    entityId: databaseDemoIds.entityId,
    evidenceStatus: "pending",
    feeAccountId: databaseDemoIds.feeAccountId,
    feeAmountCents,
    grossAmountCents,
    netCashAmountCents: grossAmountCents - feeAmountCents - withholdingAmountCents,
    platformAccountId: databaseDemoIds.platformAccountId,
    postingPattern: "gross_to_net_income",
    primaryAccountId: databaseDemoIds.incomeAccountId,
    recognitionOn: formatDateOnly(baseDate),
    recordId: createDatabaseDemoRecordId(normalizedSequence),
    recordKind: "platform_payout",
    recordStatus: "posted",
    sourceSystem: databaseDemoSourceSystem,
    updatedAt: createIsoTimestamp(baseDate, 10, normalizedSequence),
    withholdingAccountId: databaseDemoIds.withholdingAccountId,
    withholdingAmountCents,
  };
}

export function createDatabaseDemoRecordId(sequence: number): string {
  const normalizedSequence = Math.max(1, Math.trunc(sequence));

  if (normalizedSequence === 1) {
    return databaseDemoIds.recordIdPrefix;
  }

  return `${databaseDemoIds.recordIdPrefix}-${normalizedSequence}`;
}

export function createDatabaseDemoRecordLikePattern(): string {
  return `${databaseDemoIds.recordIdPrefix}%`;
}

export function isDatabaseDemoRecordId(recordId: string): boolean {
  return (
    recordId === databaseDemoIds.recordIdPrefix ||
    recordId.startsWith(`${databaseDemoIds.recordIdPrefix}-`)
  );
}

export function getDatabaseDemoRecordSequence(recordId: string): number | null {
  if (recordId === databaseDemoIds.recordIdPrefix) {
    return 1;
  }

  if (!recordId.startsWith(`${databaseDemoIds.recordIdPrefix}-`)) {
    return null;
  }

  const suffix = recordId.slice(databaseDemoIds.recordIdPrefix.length + 1);
  const sequence = Number.parseInt(suffix, 10);

  if (!Number.isInteger(sequence) || sequence < 2) {
    return null;
  }

  return sequence;
}

export function getNextDatabaseDemoRecordSequence(recordIds: readonly string[]): number {
  const sequences = recordIds
    .map((recordId) => getDatabaseDemoRecordSequence(recordId))
    .filter((sequence): sequence is number => sequence !== null);

  if (sequences.length === 0) {
    return 1;
  }

  return Math.max(...sequences) + 1;
}

export function buildDatabaseDemoFieldUpdate(
  record: DatabaseDemoFieldUpdateInput,
  field: DatabaseDemoEditableField,
): DatabaseDemoFieldUpdate {
  const sequence = getDatabaseDemoRecordSequence(record.recordId) ?? 1;
  const baseDraft = createDatabaseDemoRecordDraft(sequence);
  const updatedAt = createIsoTimestamp(createDemoBaseDate(sequence), field === "description" ? 12 : 13, sequence);

  if (field === "description") {
    const reviewedDescription = `${baseDraft.description} reviewed`;

    return {
      field,
      nextValue: record.description === reviewedDescription ? baseDraft.description : reviewedDescription,
      updatedAt,
    };
  }

  return {
    field,
    nextValue: record.recordStatus === "reconciled" ? "posted" : "reconciled",
    updatedAt,
  };
}

export function createEmptyDatabaseDemoSnapshot(): DatabaseDemoSnapshot {
  return {
    counts: {
      derivedLineCount: 0,
      recordCount: 0,
    },
    doubleEntryLines: [],
    recentRecords: [],
    summary:
      "No demo records exist yet. Use Create record to insert one or more deterministic rows, then inspect the selected record's derived posting lines.",
  };
}

export function buildDatabaseDemoMetrics(snapshot: DatabaseDemoSnapshot): DatabaseDemoMetric[] {
  return [
    {
      label: "Records",
      value: snapshot.counts.recordCount.toString(),
    },
    {
      label: "Derived lines",
      value: snapshot.counts.derivedLineCount.toString(),
    },
  ];
}

export function buildDatabaseDemoSummary(
  snapshot: DatabaseDemoSnapshot,
  selectedRecordId: string | null,
): string {
  if (snapshot.counts.recordCount === 0) {
    return "No demo records exist yet. Use Create record to insert one or more deterministic rows, then inspect the selected record's derived posting lines.";
  }

  const recordLabel = snapshot.counts.recordCount === 1 ? "record is" : "records are";
  const derivedLineLabel = snapshot.counts.derivedLineCount === 1 ? "line" : "lines";

  if (!selectedRecordId) {
    return `${snapshot.counts.recordCount} demo ${recordLabel} present. Select a record to inspect its derived double-entry lines through the hook.`;
  }

  return `${snapshot.counts.recordCount} demo ${recordLabel} present. Selected record ${selectedRecordId} exposes ${snapshot.counts.derivedLineCount} derived double-entry ${derivedLineLabel} through the hook.`;
}

export function formatAmountLabel(amountCents: number, currency: string): string {
  const absoluteAmount = Math.abs(amountCents);
  const wholeUnits = Math.floor(absoluteAmount / 100);
  const minorUnits = (absoluteAmount % 100).toString().padStart(2, "0");
  const sign = amountCents < 0 ? "-" : "";

  return `${sign}${currency} ${wholeUnits}.${minorUnits}`;
}

function createDemoBaseDate(sequence: number): Date {
  return new Date(Date.UTC(2026, 2, 26 + sequence, 0, 0, 0));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function createIsoTimestamp(date: Date, hour: number, minuteOffset: number): string {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour,
      minuteOffset,
      0,
      0,
    ),
  ).toISOString();
}
