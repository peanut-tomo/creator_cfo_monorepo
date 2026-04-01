export type LedgerFilter = "income" | "expenses" | "spending";

export interface LedgerRecordCard {
  amountLabel: string;
  dateLabel: string;
  iconLabel: string;
  id: string;
  kind: LedgerFilter;
  title: string;
}

export interface ParseCategoryOption {
  description: string;
  id: "income" | "expense" | "spending";
  title: string;
}

export interface ParseFieldSeed {
  id: "amount" | "date" | "fundFlow" | "summary" | "vendor";
  label: string;
  value: string;
}

export const ledgerFilters: ReadonlyArray<{ id: LedgerFilter; label: string }> = [
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "spending", label: "Spending" },
];

export const ledgerRecordCards: ReadonlyArray<LedgerRecordCard> = [
  {
    id: "youtube",
    kind: "income",
    title: "YouTube Partner Program",
    dateLabel: "Oct 12, 2023",
    amountLabel: "$12,450.00",
    iconLabel: "YT",
  },
  {
    id: "spotify",
    kind: "income",
    title: "Spotify Technology S.A.",
    dateLabel: "Oct 08, 2023",
    amountLabel: "$4,210.88",
    iconLabel: "SP",
  },
  {
    id: "adobe",
    kind: "income",
    title: "Adobe Brand Sponsorship",
    dateLabel: "Sep 29, 2023",
    amountLabel: "$8,000.00",
    iconLabel: "AD",
  },
  {
    id: "merch",
    kind: "income",
    title: "Merchandise Sales - Q3",
    dateLabel: "Sep 24, 2023",
    amountLabel: "$22,140.50",
    iconLabel: "MS",
  },
  {
    id: "masterclass",
    kind: "income",
    title: "Masterclass Royalties",
    dateLabel: "Sep 15, 2023",
    amountLabel: "$3,105.00",
    iconLabel: "MC",
  },
  {
    id: "camera-rental",
    kind: "expenses",
    title: "Camera Rental House",
    dateLabel: "Oct 05, 2023",
    amountLabel: "$540.00",
    iconLabel: "CR",
  },
  {
    id: "travel",
    kind: "expenses",
    title: "West Coast Creator Summit",
    dateLabel: "Sep 21, 2023",
    amountLabel: "$1,240.30",
    iconLabel: "TR",
  },
  {
    id: "invoice-q4",
    kind: "spending",
    title: "Brand Studio Retainer - Q4",
    dateLabel: "Due Nov 01, 2023",
    amountLabel: "$6,800.00",
    iconLabel: "IV",
  },
];

export const parseCategoryOptions: ReadonlyArray<ParseCategoryOption> = [
  {
    id: "income",
    title: "Income",
    description: "Revenue, payouts, and client receipts.",
  },
  {
    id: "expense",
    title: "Expense",
    description: "Subscriptions, gear, and travel.",
  },
  {
    id: "spending",
    title: "Spending",
    description: "Outgoing spend, bills, and cash outflow.",
  },
];

export const parseFieldSeeds: ReadonlyArray<ParseFieldSeed> = [
  {
    id: "vendor",
    label: "Vendor",
    value: "Adobe Systems Inc.",
  },
  {
    id: "amount",
    label: "Amount",
    value: "$52.99",
  },
  {
    id: "date",
    label: "Date",
    value: "Oct 24, 2025",
  },
  {
    id: "fundFlow",
    label: "Fund Flow",
    value: "Outgoing",
  },
  {
    id: "summary",
    label: "Summary / Description",
    value: "Creative Cloud monthly plan for editing, review, and publishing workflow.",
  },
];

export function getLedgerCardsForFilter(filter: LedgerFilter): readonly LedgerRecordCard[] {
  return ledgerRecordCards.filter((card) => card.kind === filter);
}
