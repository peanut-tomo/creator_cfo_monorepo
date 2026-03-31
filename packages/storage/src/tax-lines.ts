import type { ReadableStorageDatabase } from "./database";

export const taxLineStatuses = [
  "direct",
  "derived",
  "review_required",
  "manual_required",
] as const;
export type TaxLineStatus = (typeof taxLineStatuses)[number];

export const taxLineKinds = ["amount", "checkbox", "text"] as const;
export type TaxLineKind = (typeof taxLineKinds)[number];

export const taxLineSourceKinds = ["record", "formula", "input", "none"] as const;
export type TaxLineSourceKind = (typeof taxLineSourceKinds)[number];

export interface TaxLineQueryFilters {
  entityId: string;
  taxYear: number;
  formCodes?: string[];
  lineKeys?: string[];
  scheduleCodes?: string[];
  statuses?: TaxLineStatus[];
}

export interface TaxLineRow {
  amountCents: number | null;
  blockingCodes: string[];
  booleanValue: boolean | null;
  currency: string | null;
  entityId: string;
  formCode: string;
  lineCode: string;
  lineKey: string;
  lineKind: TaxLineKind;
  lineLabel: string;
  lineStatus: TaxLineStatus;
  matchedRecordCount: number;
  matchedRecordIds: string[];
  scheduleCode: string;
  sourceKind: TaxLineSourceKind;
  sourceNote: string;
  taxYear: number;
  textValue: string | null;
}

interface TaxLineStorageRow {
  amountCents: number | null;
  blockingCodesCsv: string;
  booleanValue: number | null;
  currency: string | null;
  entityId: string;
  formCode: string;
  lineCode: string;
  lineKey: string;
  lineKind: string;
  lineLabel: string;
  lineStatus: string;
  matchedRecordCount: number;
  matchedRecordIdsCsv: string;
  scheduleCode: string;
  sourceKind: string;
  sourceNote: string;
  taxYear: number;
  textValue: string | null;
}

interface TaxLineTraceStorageRow {
  blockingCode: string | null;
  blockingNote: string | null;
  cashOn: string | null;
  contributionAmountCents: number | null;
  contributionStatus: TaxLineStatus;
  currency: string | null;
  entityId: string;
  lineKey: string;
  recognitionOn: string | null;
  recordId: string;
  taxYear: number;
}

export interface TaxLineTraceRow {
  blockingCode: string | null;
  blockingNote: string | null;
  cashOn: string | null;
  contributionAmountCents: number | null;
  contributionStatus: TaxLineStatus;
  currency: string | null;
  entityId: string;
  lineKey: string;
  recognitionOn: string | null;
  recordId: string;
  taxYear: number;
}

export async function loadTaxLines(
  database: ReadableStorageDatabase,
  filters: TaxLineQueryFilters,
): Promise<TaxLineRow[]> {
  const normalized = normalizeTaxLineFilters(filters);
  const whereClauses = ["entity_id = ?", "tax_year = ?"];
  const params: Array<number | string> = [normalized.entityId, normalized.taxYear];

  appendInFilter(whereClauses, params, "form_code", normalized.formCodes);
  appendInFilter(whereClauses, params, "schedule_code", normalized.scheduleCodes);
  appendInFilter(whereClauses, params, "line_key", normalized.lineKeys);
  appendInFilter(whereClauses, params, "line_status", normalized.statuses);

  const rows = await database.getAllAsync<TaxLineStorageRow>(
    `SELECT
      entity_id AS entityId,
      tax_year AS taxYear,
      form_code AS formCode,
      schedule_code AS scheduleCode,
      line_key AS lineKey,
      line_code AS lineCode,
      line_label AS lineLabel,
      line_kind AS lineKind,
      line_status AS lineStatus,
      source_kind AS sourceKind,
      amount_cents AS amountCents,
      boolean_value AS booleanValue,
      text_value AS textValue,
      currency,
      matched_record_count AS matchedRecordCount,
      matched_record_ids_csv AS matchedRecordIdsCsv,
      blocking_codes_csv AS blockingCodesCsv,
      source_note AS sourceNote
    FROM tax_lines_v
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY form_code ASC, schedule_code ASC, line_key ASC;`,
    ...params,
  );

  return rows.map((row) => ({
    amountCents: row.amountCents,
    blockingCodes: splitCsv(row.blockingCodesCsv),
    booleanValue: row.booleanValue === null ? null : row.booleanValue === 1,
    currency: row.currency,
    entityId: row.entityId,
    formCode: row.formCode,
    lineCode: row.lineCode,
    lineKey: row.lineKey,
    lineKind: normalizeLineKind(row.lineKind),
    lineLabel: row.lineLabel,
    lineStatus: normalizeLineStatus(row.lineStatus),
    matchedRecordCount: row.matchedRecordCount,
    matchedRecordIds: splitCsv(row.matchedRecordIdsCsv),
    scheduleCode: row.scheduleCode,
    sourceKind: normalizeSourceKind(row.sourceKind),
    sourceNote: row.sourceNote,
    taxYear: row.taxYear,
    textValue: row.textValue,
  }));
}

export async function loadTaxLine(
  database: ReadableStorageDatabase,
  scope: { entityId: string; lineKey: string; taxYear: number },
): Promise<TaxLineRow | null> {
  const rows = await loadTaxLines(database, {
    entityId: scope.entityId,
    lineKeys: [scope.lineKey],
    taxYear: scope.taxYear,
  });

  return rows[0] ?? null;
}

export async function loadTaxLineTrace(
  database: ReadableStorageDatabase,
  scope: { entityId: string; lineKey: string; taxYear: number },
): Promise<TaxLineTraceRow[]> {
  const normalizedEntityId = normalizeEntityId(scope.entityId);
  const normalizedTaxYear = normalizeTaxYear(scope.taxYear);
  const normalizedLineKey = normalizeLineKey(scope.lineKey);
  const rows = await database.getAllAsync<TaxLineTraceStorageRow>(
    `SELECT
      entity_id AS entityId,
      tax_year AS taxYear,
      line_key AS lineKey,
      record_id AS recordId,
      contribution_status AS contributionStatus,
      contribution_amount_cents AS contributionAmountCents,
      currency,
      blocking_code AS blockingCode,
      blocking_note AS blockingNote,
      cash_on AS cashOn,
      recognition_on AS recognitionOn
    FROM tax_line_record_contributions_v
    WHERE entity_id = ?
      AND tax_year = ?
      AND line_key = ?
    ORDER BY contribution_status ASC, record_id ASC;`,
    normalizedEntityId,
    normalizedTaxYear,
    normalizedLineKey,
  );

  return rows.map((row) => ({
    blockingCode: row.blockingCode,
    blockingNote: row.blockingNote,
    cashOn: row.cashOn,
    contributionAmountCents: row.contributionAmountCents,
    contributionStatus: normalizeLineStatus(row.contributionStatus),
    currency: row.currency,
    entityId: row.entityId,
    lineKey: row.lineKey,
    recognitionOn: row.recognitionOn,
    recordId: row.recordId,
    taxYear: row.taxYear,
  }));
}

function appendInFilter(
  whereClauses: string[],
  params: Array<number | string>,
  column: string,
  values: readonly string[] | undefined,
): void {
  if (!values || values.length === 0) {
    return;
  }

  const placeholders = values.map(() => "?").join(", ");
  whereClauses.push(`${column} IN (${placeholders})`);
  params.push(...values);
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeTaxLineFilters(filters: TaxLineQueryFilters): Required<TaxLineQueryFilters> {
  return {
    entityId: normalizeEntityId(filters.entityId),
    formCodes: normalizeStringList(filters.formCodes),
    lineKeys: normalizeStringList(filters.lineKeys),
    scheduleCodes: normalizeStringList(filters.scheduleCodes),
    statuses: (filters.statuses ?? []).map((status) => normalizeLineStatus(status)),
    taxYear: normalizeTaxYear(filters.taxYear),
  };
}

function normalizeEntityId(entityId: string): string {
  const normalized = entityId.trim();

  if (!normalized) {
    throw new Error("Tax-line queries require a non-empty entityId.");
  }

  return normalized;
}

function normalizeLineKey(lineKey: string): string {
  const normalized = lineKey.trim().toLowerCase();

  if (!normalized) {
    throw new Error("Tax-line queries require a non-empty lineKey.");
  }

  return normalized;
}

function normalizeStringList(values: readonly string[] | undefined): string[] {
  if (!values) {
    return [];
  }

  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function normalizeTaxYear(taxYear: number): number {
  if (!Number.isInteger(taxYear) || taxYear < 1900 || taxYear > 9999) {
    throw new Error(`Tax-line queries require a four-digit integer taxYear. Received "${taxYear}".`);
  }

  return taxYear;
}

function normalizeLineKind(value: string): TaxLineKind {
  if (value === "amount" || value === "checkbox" || value === "text") {
    return value;
  }

  throw new Error(`Unsupported tax line_kind "${value}".`);
}

function normalizeLineStatus(value: string): TaxLineStatus {
  if (
    value === "direct" ||
    value === "derived" ||
    value === "review_required" ||
    value === "manual_required"
  ) {
    return value;
  }

  throw new Error(`Unsupported tax line_status "${value}".`);
}

function normalizeSourceKind(value: string): TaxLineSourceKind {
  if (value === "record" || value === "formula" || value === "input" || value === "none") {
    return value;
  }

  throw new Error(`Unsupported tax source_kind "${value}".`);
}
