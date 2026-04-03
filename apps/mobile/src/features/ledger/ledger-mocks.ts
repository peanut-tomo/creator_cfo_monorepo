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
