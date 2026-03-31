import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  loadEntityLegalName,
  loadScheduleCAggregation,
  type TaxQueryScope,
} from "@creator-cfo/storage";

import {
  buildFormScheduleCSnapshot,
  createEmptyFormScheduleCSnapshot,
  type FormScheduleCDatabaseSnapshot,
} from "./form-schedule-c-model";
import { createReadableStorageDatabase } from "../../storage/storage-adapter";

interface EntityIdRow {
  entityId: string;
}

export interface FormScheduleCDataScope {
  entityId?: string | null;
  taxYear: number;
}

export interface UseFormScheduleCResult {
  error: string | null;
  isLoaded: boolean;
  snapshot: FormScheduleCDatabaseSnapshot;
}

export function useFormScheduleC(scope: FormScheduleCDataScope): UseFormScheduleCResult {
  const database = useSQLiteContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<FormScheduleCDatabaseSnapshot>(createEmptyFormScheduleCSnapshot());

  useEffect(() => {
    let isMounted = true;
    setError(null);
    setIsLoaded(false);
    setSnapshot(createEmptyFormScheduleCSnapshot());

    loadFormScheduleCData(database, scope)
      .then((nextSnapshot) => {
        if (!isMounted) {
          return;
        }

        setError(null);
        setSnapshot(nextSnapshot);
        setIsLoaded(true);
      })
      .catch((nextError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load Schedule C preview.");
        setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [database, scope.entityId, scope.taxYear]);

  return {
    error,
    isLoaded,
    snapshot,
  };
}

async function loadFormScheduleCData(
  database: ReturnType<typeof useSQLiteContext>,
  scope: FormScheduleCDataScope,
): Promise<FormScheduleCDatabaseSnapshot> {
  const storageDatabase = createReadableStorageDatabase(database);
  const resolvedScope = await resolveTaxQueryScope(database, scope);

  if (!resolvedScope) {
    return createEmptyFormScheduleCSnapshot();
  }

  const proprietorName = await loadEntityLegalName(storageDatabase, resolvedScope.entityId);
  const aggregation = await loadScheduleCAggregation(storageDatabase, resolvedScope);
  const hasScheduleCData =
    Object.keys(aggregation.lineAmounts).length > 0 ||
    Object.keys(aggregation.lineReviewNotes).length > 0 ||
    aggregation.partVRows.length > 0 ||
    aggregation.partVReviewNote !== null;

  return buildFormScheduleCSnapshot({
    currency: hasScheduleCData ? "USD" : null,
    lineAmounts: aggregation.lineAmounts,
    lineReviewNotes: aggregation.lineReviewNotes,
    partVReviewNote: aggregation.partVReviewNote,
    partVRows: aggregation.partVRows,
    proprietorName,
  });
}

async function resolveTaxQueryScope(
  database: ReturnType<typeof useSQLiteContext>,
  scope: FormScheduleCDataScope,
): Promise<TaxQueryScope | null> {
  const normalizedEntityId = scope.entityId?.trim();

  if (normalizedEntityId) {
    return {
      entityId: normalizedEntityId,
      taxYear: scope.taxYear,
    };
  }

  const entityRow = await database.getFirstAsync<EntityIdRow>(
    `SELECT entity_id AS entityId
    FROM entities
    ORDER BY created_at ASC
    LIMIT 1;`,
  );

  return entityRow
    ? {
        entityId: entityRow.entityId,
        taxYear: scope.taxYear,
      }
    : null;
}
