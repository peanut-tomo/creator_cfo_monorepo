import {
  buildLedgerPeriodId,
  type LedgerPeriodSegmentId,
} from "./ledger-reporting";

export function buildLedgerPeriodIdForSegment(
  year: number,
  segmentId: LedgerPeriodSegmentId,
): string {
  return buildLedgerPeriodId(year, segmentId);
}

export function buildLedgerPeriodIdForYear(
  yearId: string,
  currentSegmentId: LedgerPeriodSegmentId,
): string | null {
  const year = Number(yearId);

  if (!Number.isInteger(year)) {
    return null;
  }

  return buildLedgerPeriodId(year, currentSegmentId);
}
