import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  createEmptyLedgerSnapshot,
  getDefaultLedgerPeriodId,
  loadLedgerSnapshot,
  type LedgerPeriodSegmentId,
  type LedgerScopeId,
  type LedgerScreenSnapshot,
  type LedgerViewId,
} from "./ledger-reporting";
import {
  buildLedgerPeriodIdForSegment,
  buildLedgerPeriodIdForYear,
} from "./ledger-screen-state";
import { createReadableStorageDatabase } from "../../storage/storage-adapter";

type LedgerDatabase = ReturnType<typeof useSQLiteContext>;

export interface UseLedgerScreenResult {
  error: string | null;
  isLoaded: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  selectPeriodSegment: (segmentId: LedgerPeriodSegmentId) => void;
  selectScope: (scopeId: LedgerScopeId) => void;
  selectView: (view: LedgerViewId) => void;
  selectYear: (yearId: string) => void;
  selectedPeriodId: string;
  selectedSegmentId: LedgerPeriodSegmentId;
  selectedScope: LedgerScopeId;
  selectedView: LedgerViewId;
  selectedYearId: string;
  snapshot: LedgerScreenSnapshot;
}

export function useLedgerScreen(): UseLedgerScreenResult {
  const database = useSQLiteContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [selectedPeriodId, setSelectedPeriodId] = useState(getDefaultLedgerPeriodId);
  const [selectedScope, setSelectedScope] = useState<LedgerScopeId>("business");
  const [selectedView, setSelectedView] = useState<LedgerViewId>("general-ledger");
  const [snapshot, setSnapshot] = useState<LedgerScreenSnapshot>(createEmptyLedgerSnapshot);

  useEffect(() => {
    let isMounted = true;

    setIsRefreshing(true);
    setError(null);

    loadSnapshot(database, selectedPeriodId, selectedScope)
      .then((nextSnapshot) => {
        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);

        if (nextSnapshot.selectedPeriod.id !== selectedPeriodId) {
          setSelectedPeriodId(nextSnapshot.selectedPeriod.id);
        }
      })
      .catch((nextError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(nextError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [database, refreshNonce, selectedPeriodId, selectedScope]);

  return {
    error,
    isLoaded,
    isRefreshing,
    refresh: async () => {
      setRefreshNonce((current) => current + 1);
    },
    selectPeriodSegment: (segmentId) => {
      setSelectedPeriodId(buildLedgerPeriodIdForSegment(snapshot.selectedPeriod.year, segmentId));
    },
    selectScope: setSelectedScope,
    selectView: setSelectedView,
    selectYear: (yearId) => {
      const nextPeriodId = buildLedgerPeriodIdForYear(yearId, snapshot.selectedPeriod.segmentId);

      if (!nextPeriodId) {
        return;
      }

      setSelectedPeriodId(nextPeriodId);
    },
    selectedPeriodId,
    selectedSegmentId: snapshot.selectedPeriod.segmentId,
    selectedScope,
    selectedView,
    selectedYearId: String(snapshot.selectedPeriod.year),
    snapshot,
  };
}

async function loadSnapshot(
  database: LedgerDatabase,
  preferredPeriodId: string,
  scopeId: LedgerScopeId,
) {
  return loadLedgerSnapshot(createReadableStorageDatabase(database), {
    preferredPeriodId,
    scopeId,
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ledger data failed to load.";
}
