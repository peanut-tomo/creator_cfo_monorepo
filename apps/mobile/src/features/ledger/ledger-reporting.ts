import {
  accountingPostableRecordStatuses,
  type ReadableStorageDatabase,
} from "@creator-cfo/storage";

import {
  defaultEntityId,
  formatCurrencyFromCents,
  formatDisplayDate,
} from "./ledger-domain";

export type LedgerViewId = "general-ledger" | "balance-sheet" | "profit-loss";
export type LedgerScopeId = "business" | "personal";

export type LedgerPeriodSegmentId =
  | "full-year"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "m01"
  | "m02"
  | "m03"
  | "m04"
  | "m05"
  | "m06"
  | "m07"
  | "m08"
  | "m09"
  | "m10"
  | "m11"
  | "m12";

export interface LedgerYearOption {
  id: string;
  label: string;
  year: number;
}

export interface LedgerPeriodSegmentOption {
  endDate: string;
  id: LedgerPeriodSegmentId;
  label: string;
  startDate: string;
  summary: string;
}

export interface LedgerPeriodOption {
  endDate: string;
  id: string;
  label: string;
  segmentId: LedgerPeriodSegmentId;
  startDate: string;
  summary: string;
  year: number;
}

export interface LedgerMetricCard {
  accent?: "danger" | "neutral" | "success";
  id: string;
  label: string;
  value: string;
}

export interface LedgerSectionRow {
  amount: string;
  id: string;
  label: string;
  note: string;
}

export interface GeneralLedgerPostingLine {
  accountName: string;
  amount: string;
  detail: string;
  id: string;
  side: "credit" | "debit";
}

export interface GeneralLedgerEntry {
  amount: string;
  dateLabel: string;
  id: string;
  kindLabel: string;
  lines: GeneralLedgerPostingLine[];
  subtitle: string;
  title: string;
}

export interface GeneralLedgerSnapshot {
  debitTotal: string;
  entries: GeneralLedgerEntry[];
  metricCards: LedgerMetricCard[];
  recordCountLabel: string;
}

export interface BalanceSheetSnapshot {
  assetRows: LedgerSectionRow[];
  equationSummary: string;
  equityAmount: string;
  equityRows: LedgerSectionRow[];
  liabilityRows: LedgerSectionRow[];
  metricCards: LedgerMetricCard[];
  netPositionLabel: string;
}

export interface ProfitAndLossSnapshot {
  expenseRows: LedgerSectionRow[];
  metricCards: LedgerMetricCard[];
  netIncomeLabel: string;
  revenueRows: LedgerSectionRow[];
}

export interface LedgerScreenSnapshot {
  balanceSheet: BalanceSheetSnapshot;
  generalLedger: GeneralLedgerSnapshot;
  hasData: boolean;
  isEmpty: boolean;
  periodOptions: LedgerPeriodOption[];
  profitAndLoss: ProfitAndLossSnapshot;
  selectedScope: LedgerScopeId;
  segmentOptions: LedgerPeriodSegmentOption[];
  selectedPeriod: LedgerPeriodOption;
  yearOptions: LedgerYearOption[];
}

interface LedgerRecordRow {
  amountCents: number;
  businessUseBps: number;
  createdAt: string;
  currency: string;
  description: string;
  memo: string | null;
  occurredOn: string;
  recordId: string;
  recordKind: "expense" | "income" | "personal_spending";
  sourceLabel: string;
  targetLabel: string;
  taxLineCode: string | null;
}

interface LedgerBoundsRow {
  maxOccurredOn: string | null;
  minOccurredOn: string | null;
}

const earliestLedgerYear = 2018;
const monthSegmentIds = [
  "m01",
  "m02",
  "m03",
  "m04",
  "m05",
  "m06",
  "m07",
  "m08",
  "m09",
  "m10",
  "m11",
  "m12",
] as const satisfies readonly LedgerPeriodSegmentId[];
const quarterSegmentIds = ["q1", "q2", "q3", "q4"] as const satisfies readonly LedgerPeriodSegmentId[];

export async function loadLedgerSnapshot(
  database: ReadableStorageDatabase,
  input: {
    entityId?: string;
    now?: string;
    preferredPeriodId?: string | null;
    scopeId?: LedgerScopeId;
  } = {},
): Promise<LedgerScreenSnapshot> {
  const entityId = input.entityId ?? defaultEntityId;
  const now = normalizeIsoDate(input.now ?? new Date().toISOString().slice(0, 10));
  const scopeId = input.scopeId ?? "business";
  const scopeRecordKinds =
    scopeId === "personal"
      ? "('personal_spending')"
      : "('income', 'expense')";
  const bounds =
    (await database.getFirstAsync<LedgerBoundsRow>(
      `SELECT
        MIN(occurred_on) AS minOccurredOn,
        MAX(occurred_on) AS maxOccurredOn
      FROM records
      WHERE entity_id = ?
        AND record_status IN ('posted', 'reconciled')
        AND record_kind IN ${scopeRecordKinds};`,
      entityId,
    )) ?? { maxOccurredOn: null, minOccurredOn: null };

  const yearOptions = buildLedgerYearOptions({
    maxOccurredOn: bounds.maxOccurredOn,
    now,
  });
  const defaultPeriodId = getDefaultLedgerPeriodId(now);
  const selectedPeriod =
    resolveLedgerPeriodOption(input.preferredPeriodId ?? defaultPeriodId, yearOptions) ??
    resolveLedgerPeriodOption(defaultPeriodId, yearOptions) ??
    resolveLedgerPeriodOption(buildLedgerPeriodId(Number(now.slice(0, 4)), "full-year"), yearOptions) ??
    buildLedgerPeriodOption(Number(now.slice(0, 4)), "full-year");
  const segmentOptions = buildLedgerSegmentOptions(selectedPeriod.year);
  const periodOptions = buildLedgerPeriodOptions(yearOptions);

  const rows = await database.getAllAsync<LedgerRecordRow>(
    `SELECT
      record_id AS recordId,
      description,
      memo,
      occurred_on AS occurredOn,
      created_at AS createdAt,
      currency,
      amount_cents AS amountCents,
      record_kind AS recordKind,
      source_label AS sourceLabel,
      target_label AS targetLabel,
      COALESCE(business_use_bps, 10000) AS businessUseBps,
      tax_line_code AS taxLineCode
    FROM records
    WHERE entity_id = ?
      AND record_status IN ('posted', 'reconciled')
      AND record_kind IN ${scopeRecordKinds}
      AND occurred_on BETWEEN ? AND ?
    ORDER BY occurred_on DESC, created_at DESC, record_id DESC;`,
    entityId,
    selectedPeriod.startDate,
    selectedPeriod.endDate,
  );

  return buildLedgerSnapshotFromRows(rows, {
    periodOptions,
    selectedScope: scopeId,
    segmentOptions,
    selectedPeriod,
    yearOptions,
  });
}

export function buildLedgerPeriodId(year: number, segmentId: LedgerPeriodSegmentId): string {
  return `${year}:${segmentId}`;
}

export function getDefaultLedgerPeriodId(now = new Date().toISOString().slice(0, 10)): string {
  const normalizedNow = normalizeIsoDate(now);
  return buildLedgerPeriodId(
    Number(normalizedNow.slice(0, 4)),
    `m${normalizedNow.slice(5, 7)}` as LedgerPeriodSegmentId,
  );
}

export function buildLedgerYearOptions(input: {
  maxOccurredOn: string | null;
  now: string;
}): LedgerYearOption[] {
  const nowYear = Number(normalizeIsoDate(input.now).slice(0, 4));
  const maxOccurredYear = input.maxOccurredOn ? Number(normalizeIsoDate(input.maxOccurredOn).slice(0, 4)) : nowYear;
  const lastYear = Math.max(nowYear, maxOccurredYear, earliestLedgerYear);
  const options: LedgerYearOption[] = [];

  for (let year = lastYear; year >= earliestLedgerYear; year -= 1) {
    options.push({
      id: String(year),
      label: String(year),
      year,
    });
  }

  return options;
}

export function buildLedgerSegmentOptions(year: number): LedgerPeriodSegmentOption[] {
  const options: LedgerPeriodSegmentOption[] = [
    buildLedgerSegmentOption(year, "full-year"),
  ];

  for (const segmentId of quarterSegmentIds) {
    options.push(buildLedgerSegmentOption(year, segmentId));
  }

  for (const segmentId of monthSegmentIds) {
    options.push(buildLedgerSegmentOption(year, segmentId));
  }

  return options;
}

export function buildLedgerPeriodOptions(
  yearOptions: readonly LedgerYearOption[],
): LedgerPeriodOption[] {
  return yearOptions.flatMap((option) =>
    buildLedgerSegmentOptions(option.year).map((segment) => ({
      ...segment,
      id: buildLedgerPeriodId(option.year, segment.id),
      label: formatLedgerPeriodLabel(option.year, segment.id),
      segmentId: segment.id,
      year: option.year,
    })),
  );
}

export function resolveLedgerPeriodOption(
  periodId: string | null | undefined,
  yearOptions: readonly LedgerYearOption[],
): LedgerPeriodOption | null {
  if (!periodId) {
    return null;
  }

  const parsed = parseLedgerPeriodId(periodId);

  if (!parsed) {
    return null;
  }

  if (!yearOptions.some((option) => option.year === parsed.year)) {
    return null;
  }

  return buildLedgerPeriodOption(parsed.year, parsed.segmentId);
}

export function buildLedgerSnapshotFromRows(
  rows: readonly LedgerRecordRow[],
  input: {
    periodOptions: readonly LedgerPeriodOption[];
    selectedScope: LedgerScopeId;
    segmentOptions: readonly LedgerPeriodSegmentOption[];
    selectedPeriod: LedgerPeriodOption;
    yearOptions: readonly LedgerYearOption[];
  },
): LedgerScreenSnapshot {
  const normalizedRows = rows
    .map((row) => ({
      ...row,
      effectiveAmountCents: applyScopeAmount(row, input.selectedScope),
    }))
    .filter((row) => row.effectiveAmountCents > 0);
  const incomeRows = normalizedRows.filter((row) => row.recordKind === "income");
  const expenseRows = normalizedRows.filter((row) => row.recordKind === "expense");
  const personalRows = normalizedRows.filter((row) => row.recordKind === "personal_spending");
  const incomeTotalCents = sumAmounts(incomeRows.map((row) => row.effectiveAmountCents));
  const expenseTotalCents = sumAmounts(expenseRows.map((row) => row.effectiveAmountCents));
  const personalTotalCents = sumAmounts(personalRows.map((row) => row.effectiveAmountCents));
  const netIncomeCents = incomeTotalCents - expenseTotalCents;
  const assetTotalCents = Math.max(netIncomeCents, 0);
  const fundingGapCents = Math.max(netIncomeCents * -1, 0);
  const generalLedgerTotalCents =
    input.selectedScope === "personal"
      ? personalTotalCents
      : sumAmounts(normalizedRows.map((row) => row.effectiveAmountCents));

  return {
    balanceSheet: {
      assetRows: [
        {
          amount: formatCurrencyFromCents(assetTotalCents),
          id: "net-business-assets",
          label: "Net operating assets (derived)",
          note: "Positive net operating position from posted or reconciled business records in the selected reporting slice.",
        },
      ],
      equationSummary:
        netIncomeCents >= 0
          ? `${formatCurrencyFromCents(assetTotalCents)} assets = ${formatCurrencyFromCents(0)} liabilities + ${formatCurrencyFromCents(netIncomeCents)} equity`
          : `${formatCurrencyFromCents(assetTotalCents)} assets with ${formatCurrencyFromCents(fundingGapCents)} owner funding gap`,
      equityAmount: formatCurrencyFromCents(netIncomeCents),
      equityRows: [
        {
          amount: formatCurrencyFromCents(netIncomeCents),
          id: "owner-equity",
          label: netIncomeCents >= 0 ? "Owner equity (derived)" : "Owner deficit (derived)",
          note: "Residual position from posted or reconciled business income minus business expenses in the selected reporting slice.",
        },
      ],
      liabilityRows: [
        {
          amount: formatCurrencyFromCents(fundingGapCents),
          id: "funding-gap",
          label: "Owner funding gap (derived)",
          note: "Shown when business expenses exceed business inflows inside the selected reporting slice.",
        },
      ],
      metricCards: [
        {
          accent: "success",
          id: "asset-total",
          label: "Total Assets",
          value: formatCurrencyFromCents(assetTotalCents),
        },
        {
          accent: fundingGapCents > 0 ? "danger" : "neutral",
          id: "funding-gap-total",
          label: fundingGapCents > 0 ? "Funding Gap" : "Total Liabilities",
          value: formatCurrencyFromCents(fundingGapCents),
        },
      ],
      netPositionLabel:
        netIncomeCents >= 0
          ? "Positive owner position for this reporting slice"
          : "Negative owner position for this reporting slice",
    },
    generalLedger: {
      debitTotal: formatCurrencyFromCents(generalLedgerTotalCents),
      entries: normalizedRows.map((row) => buildGeneralLedgerEntry(row)),
      metricCards: [
        {
          accent: input.selectedScope === "personal" ? "danger" : "success",
          id: "scope-total",
          label: input.selectedScope === "personal" ? "Personal Spend" : "Total Debits (Dr)",
          value: formatCurrencyFromCents(generalLedgerTotalCents),
        },
        {
          accent: "neutral",
          id: "scope-count",
          label: input.selectedScope === "personal" ? "Transactions" : "Total Credits (Cr)",
          value:
            input.selectedScope === "personal"
              ? String(normalizedRows.length)
              : formatCurrencyFromCents(generalLedgerTotalCents),
        },
      ],
      recordCountLabel: `${normalizedRows.length} ${normalizedRows.length === 1 ? "record" : "records"}`,
    },
    hasData: normalizedRows.length > 0,
    isEmpty: normalizedRows.length === 0,
    periodOptions: [...input.periodOptions],
    profitAndLoss: {
      expenseRows:
        input.selectedScope === "personal"
          ? []
          : buildGroupedSectionRows(expenseRows, "expense"),
      metricCards: [
        {
          accent: input.selectedScope === "personal" ? "neutral" : "success",
          id: "revenue-total",
          label: input.selectedScope === "personal" ? "Business Revenue" : "Gross Revenue",
          value: formatCurrencyFromCents(input.selectedScope === "personal" ? 0 : incomeTotalCents),
        },
        {
          accent: input.selectedScope === "personal" ? "danger" : "danger",
          id: "expense-total",
          label: input.selectedScope === "personal" ? "Personal Spend" : "Total Expenses",
          value: formatCurrencyFromCents(
            input.selectedScope === "personal" ? personalTotalCents : expenseTotalCents,
          ),
        },
      ],
      netIncomeLabel: formatCurrencyFromCents(
        input.selectedScope === "personal" ? personalTotalCents * -1 : netIncomeCents,
      ),
      revenueRows:
        input.selectedScope === "personal"
          ? []
          : buildGroupedSectionRows(incomeRows, "income"),
    },
    selectedScope: input.selectedScope,
    segmentOptions: [...input.segmentOptions],
    selectedPeriod: input.selectedPeriod,
    yearOptions: [...input.yearOptions],
  };
}

export function createEmptyLedgerSnapshot(now = new Date().toISOString().slice(0, 10)): LedgerScreenSnapshot {
  const normalizedNow = normalizeIsoDate(now);
  const yearOptions = buildLedgerYearOptions({
    maxOccurredOn: null,
    now: normalizedNow,
  });
  const selectedPeriod =
    resolveLedgerPeriodOption(getDefaultLedgerPeriodId(normalizedNow), yearOptions) ??
    buildLedgerPeriodOption(Number(normalizedNow.slice(0, 4)), "full-year");

  return buildLedgerSnapshotFromRows([], {
    periodOptions: buildLedgerPeriodOptions(yearOptions),
    selectedScope: "business",
    segmentOptions: buildLedgerSegmentOptions(selectedPeriod.year),
    selectedPeriod,
    yearOptions,
  });
}

function buildLedgerPeriodOption(
  year: number,
  segmentId: LedgerPeriodSegmentId,
): LedgerPeriodOption {
  const segment = buildLedgerSegmentOption(year, segmentId);

  return {
    ...segment,
    id: buildLedgerPeriodId(year, segmentId),
    label: formatLedgerPeriodLabel(year, segmentId),
    segmentId,
    year,
  };
}

function parseLedgerPeriodId(periodId: string): { segmentId: LedgerPeriodSegmentId; year: number } | null {
  const [yearValue, segmentId] = periodId.split(":");
  const year = Number(yearValue);

  if (!Number.isInteger(year) || year < earliestLedgerYear || !isLedgerSegmentId(segmentId)) {
    return null;
  }

  return {
    segmentId,
    year,
  };
}

function isLedgerSegmentId(value: string | undefined): value is LedgerPeriodSegmentId {
  return value === "full-year" || isQuarterSegmentId(value) || isMonthSegmentId(value);
}

function isQuarterSegmentId(value: string | undefined): value is (typeof quarterSegmentIds)[number] {
  return quarterSegmentIds.some((segmentId) => segmentId === value);
}

function isMonthSegmentId(value: string | undefined): value is (typeof monthSegmentIds)[number] {
  return monthSegmentIds.some((segmentId) => segmentId === value);
}

function buildLedgerSegmentOption(
  year: number,
  segmentId: LedgerPeriodSegmentId,
): LedgerPeriodSegmentOption {
  if (segmentId === "full-year") {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return {
      endDate,
      id: segmentId,
      label: "Whole Year",
      startDate,
      summary: formatRangeSummary(startDate, endDate),
    };
  }

  if (isQuarterSegmentId(segmentId)) {
    const quarterIndex = quarterSegmentIds.indexOf(segmentId);
    const startMonth = quarterIndex * 3 + 1;
    const startDate = `${year}-${padMonth(startMonth)}-01`;
    const endDate = endOfMonth(`${year}-${padMonth(startMonth + 2)}-01`);

    return {
      endDate,
      id: segmentId,
      label: segmentId.toUpperCase(),
      startDate,
      summary: formatRangeSummary(startDate, endDate),
    };
  }

  const monthNumber = Number(segmentId.slice(1));
  const startDate = `${year}-${padMonth(monthNumber)}-01`;
  const endDate = endOfMonth(startDate);

  return {
    endDate,
    id: segmentId,
    label: monthNamesShort[monthNumber - 1] ?? "Month",
    startDate,
    summary: formatRangeSummary(startDate, endDate),
  };
}

function formatLedgerPeriodLabel(year: number, segmentId: LedgerPeriodSegmentId): string {
  if (segmentId === "full-year") {
    return String(year);
  }

  if (isQuarterSegmentId(segmentId)) {
    return `${segmentId.toUpperCase()} ${year}`;
  }

  const monthNumber = Number(segmentId.slice(1));
  return `${monthNamesLong[monthNumber - 1] ?? "Month"} ${year}`;
}

function buildGeneralLedgerEntry(
  row: LedgerRecordRow & { effectiveAmountCents: number },
): GeneralLedgerEntry {
  const amount = formatCurrencyFromCents(row.effectiveAmountCents);
  const counterparty =
    row.recordKind === "income" ? normalizeLabel(row.sourceLabel) : normalizeLabel(row.targetLabel);
  const lines =
    row.recordKind === "income"
      ? [
          {
            accountName: "Cash & Bank",
            amount,
            detail: counterparty,
            id: `${row.recordId}-debit`,
            side: "debit" as const,
          },
          {
            accountName: buildRevenueAccountName(row.sourceLabel),
            amount,
            detail: normalizeLabel(row.description),
            id: `${row.recordId}-credit`,
            side: "credit" as const,
          },
        ]
      : [
          {
            accountName:
              row.recordKind === "personal_spending"
                ? "Personal Spending"
                : buildExpenseAccountName(row.taxLineCode),
            amount,
            detail: normalizeLabel(row.description),
            id: `${row.recordId}-debit`,
            side: "debit" as const,
          },
          {
            accountName: "Cash & Bank",
            amount,
            detail: normalizeLabel(row.sourceLabel),
            id: `${row.recordId}-credit`,
            side: "credit" as const,
          },
        ];

  return {
    amount,
    dateLabel: formatDisplayDate(row.occurredOn),
    id: row.recordId,
    kindLabel:
      row.recordKind === "income"
        ? "Income"
        : row.recordKind === "personal_spending"
          ? "Personal"
          : "Expense",
    lines,
    subtitle: row.memo?.trim() || `${formatDisplayDate(row.occurredOn)} • Ref: ${row.recordId}`,
    title: normalizeLabel(row.description),
  };
}

function buildGroupedSectionRows(
  rows: readonly (LedgerRecordRow & { effectiveAmountCents: number })[],
  kind: "expense" | "income",
): LedgerSectionRow[] {
  const groups = new Map<string, number>();

  for (const row of rows) {
    const key =
      kind === "income"
        ? normalizeLabel(row.sourceLabel || row.description)
        : normalizeLabel(row.targetLabel || row.description);
    groups.set(key, (groups.get(key) ?? 0) + row.effectiveAmountCents);
  }

  return [...groups.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, amountCents], index) => ({
      amount: formatCurrencyFromCents(amountCents),
      id: `${kind}-${index}-${label}`,
      label,
      note:
        kind === "income"
          ? "Grouped by recorded source label for posted or reconciled inflows."
          : "Grouped by recorded target label for posted or reconciled expense outflows.",
    }));
}

function buildExpenseAccountName(taxLineCode: string | null): string {
  if (!taxLineCode) {
    return "Operating Expense";
  }

  if (taxLineCode.toLowerCase() === "line27a") {
    return "Schedule C Other Expense";
  }

  return `Expense ${taxLineCode.toUpperCase()}`;
}

function applyScopeAmount(
  row: LedgerRecordRow,
  scopeId: LedgerScopeId,
): number {
  if (scopeId === "personal" || row.recordKind === "personal_spending") {
    return row.amountCents;
  }

  return applyBusinessUse(row.amountCents, row.businessUseBps);
}

function buildRevenueAccountName(sourceLabel: string): string {
  const normalized = normalizeLabel(sourceLabel);

  if (normalized === "Unlabeled record") {
    return "Creator Revenue";
  }

  return `${normalized} Revenue`;
}

function applyBusinessUse(amountCents: number, businessUseBps: number): number {
  return Math.round((amountCents * normalizeBusinessUseBps(businessUseBps)) / 10_000);
}

function normalizeBusinessUseBps(value: number): number {
  if (!Number.isFinite(value)) {
    return 10_000;
  }

  return Math.max(0, Math.min(10_000, Math.round(value)));
}

function sumAmounts(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatRangeSummary(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDisplayDate(startDate);
  }

  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}

function endOfMonth(dateValue: string): string {
  const date = new Date(`${dateValue.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}

function normalizeIsoDate(value: string): string {
  return value.slice(0, 10);
}

function normalizeLabel(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "Unlabeled record";
}

function padMonth(value: number): string {
  return value.toString().padStart(2, "0");
}

const monthNamesShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const monthNamesLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const ledgerPostableStatuses = [...accountingPostableRecordStatuses];
