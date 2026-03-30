import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  buildScheduleCAggregation,
  buildSupportedScheduleCNetProfitPreview,
  type ScheduleCCandidateRecord,
} from "@creator-cfo/storage";

import {
  buildFormScheduleSESnapshot,
  createEmptyFormScheduleSESnapshot,
  type FormScheduleSEDatabaseSnapshot,
} from "./form-schedule-se-model";

type ScheduleCCandidateRecordRow = ScheduleCCandidateRecord;

export interface UseFormScheduleSEResult {
  error: string | null;
  isLoaded: boolean;
  snapshot: FormScheduleSEDatabaseSnapshot;
}

export function useFormScheduleSE(): UseFormScheduleSEResult {
  const database = useSQLiteContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<FormScheduleSEDatabaseSnapshot>(createEmptyFormScheduleSESnapshot());

  useEffect(() => {
    let isMounted = true;

    loadFormScheduleSEData(database)
      .then((nextSnapshot) => {
        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);
        setIsLoaded(true);
      })
      .catch((nextError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load Schedule SE preview.");
        setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [database]);

  return {
    error,
    isLoaded,
    snapshot,
  };
}

async function loadFormScheduleSEData(
  database: ReturnType<typeof useSQLiteContext>,
): Promise<FormScheduleSEDatabaseSnapshot> {
  const candidateRows = await database.getAllAsync<ScheduleCCandidateRecordRow>(
    `SELECT
      record_id AS recordId,
      record_kind AS recordKind,
      record_status AS recordStatus,
      cash_on AS cashOn,
      currency,
      description,
      memo,
      category_code AS categoryCode,
      subcategory_code AS subcategoryCode,
      tax_category_code AS taxCategoryCode,
      tax_line_code AS taxLineCode,
      primary_amount_cents AS primaryAmountCents,
      gross_amount_cents AS grossAmountCents,
      business_use_bps AS businessUseBps
    FROM records
    WHERE record_status IN ('posted', 'reconciled')
      AND COALESCE(tax_line_code, '') <> '';`,
  );
  const aggregation = buildScheduleCAggregation(candidateRows);
  const preview = buildSupportedScheduleCNetProfitPreview(aggregation);

  return buildFormScheduleSESnapshot({
    supportedScheduleCNetProfitPreview: preview.netProfitCents !== null ? preview : null,
  });
}
