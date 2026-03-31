import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  loadScheduleSEPreview,
  type TaxQueryScope,
} from "@creator-cfo/storage";

import {
  buildFormScheduleSESnapshot,
  createEmptyFormScheduleSESnapshot,
  type FormScheduleSEDatabaseSnapshot,
} from "./form-schedule-se-model";
import { createReadableStorageDatabase } from "../../storage/storage-adapter";

interface EntityIdRow {
  entityId: string;
}

export interface FormScheduleSEDataScope {
  entityId?: string | null;
  taxYear: number;
}

export interface UseFormScheduleSEResult {
  error: string | null;
  isLoaded: boolean;
  snapshot: FormScheduleSEDatabaseSnapshot;
}

export function useFormScheduleSE(scope: FormScheduleSEDataScope): UseFormScheduleSEResult {
  const database = useSQLiteContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<FormScheduleSEDatabaseSnapshot>(createEmptyFormScheduleSESnapshot());

  useEffect(() => {
    let isMounted = true;
    setError(null);
    setIsLoaded(false);
    setSnapshot(createEmptyFormScheduleSESnapshot());

    loadFormScheduleSEData(database, scope)
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

        setError(nextError instanceof Error ? nextError.message : "Unable to load Schedule SE preview.");
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

async function loadFormScheduleSEData(
  database: ReturnType<typeof useSQLiteContext>,
  scope: FormScheduleSEDataScope,
): Promise<FormScheduleSEDatabaseSnapshot> {
  const storageDatabase = createReadableStorageDatabase(database);
  const resolvedScope = await resolveTaxQueryScope(database, scope);

  if (!resolvedScope) {
    return createEmptyFormScheduleSESnapshot();
  }

  const preview = await loadScheduleSEPreview(storageDatabase, resolvedScope);

  return buildFormScheduleSESnapshot({
    supportedScheduleCNetProfitPreview: preview.netProfitCents !== null ? preview : null,
  });
}

async function resolveTaxQueryScope(
  database: ReturnType<typeof useSQLiteContext>,
  scope: FormScheduleSEDataScope,
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
