import { useEffect, useState } from "react";

import { useAppShell } from "../app-shell/provider";
import { loadJournalListScreenSnapshot } from "./ledger-runtime";
import type { JournalListSnapshot } from "../home/home-data";

const emptySnapshot: JournalListSnapshot = {
  hasMore: false,
  records: [],
};

export function useJournalListScreen() {
  const { resolvedLocale, storageRevision } = useAppShell();
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<JournalListSnapshot>(emptySnapshot);

  useEffect(() => {
    void refresh();
  }, [resolvedLocale, storageRevision]);

  async function refresh(): Promise<void> {
    setIsRefreshing(true);
    setError(null);

    try {
      const nextSnapshot = await loadJournalListScreenSnapshot();
      setSnapshot(nextSnapshot);
    } catch (nextError: unknown) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : resolvedLocale === "zh-CN"
            ? "分录列表加载失败。"
            : "Journal list failed to load.",
      );
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }

  async function loadMore(): Promise<void> {
    if (!snapshot.hasMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const nextSnapshot = await loadJournalListScreenSnapshot({
        offset: snapshot.records.length,
      });
      setSnapshot((current) => ({
        ...nextSnapshot,
        records: [...current.records, ...nextSnapshot.records],
      }));
    } catch (nextError: unknown) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : resolvedLocale === "zh-CN"
            ? "更多分录记录加载失败。"
            : "More journal records failed to load.",
      );
    } finally {
      setIsLoaded(true);
      setIsLoadingMore(false);
    }
  }

  return {
    error,
    isLoaded,
    isLoadingMore,
    isRefreshing,
    loadMore,
    refresh,
    snapshot,
  };
}
