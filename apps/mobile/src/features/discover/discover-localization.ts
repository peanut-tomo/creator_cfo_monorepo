import type { ResolvedLocale } from "../app-shell/types";

export function formatDiscoverPublishedDate(
  dateValue: string,
  locale: ResolvedLocale,
): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return locale === "zh-CN"
    ? `${year}/${month}/${day}`
    : `${month}/${day}/${year}`;
}
