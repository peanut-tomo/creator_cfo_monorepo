import { SQLiteProvider } from "expo-sqlite";
import { getLocalStorageBootstrapPlan } from "@creator-cfo/storage";

import { LedgerScreen } from "../../src/features/ledger/ledger-screen";
import { initializeLocalDatabase } from "../../src/storage/database";

const storagePlan = getLocalStorageBootstrapPlan();

export default function LedgerTabRoute() {
  return (
    <SQLiteProvider
      databaseName={storagePlan.databaseName}
      onInit={initializeLocalDatabase}
    >
      <LedgerScreen />
    </SQLiteProvider>
  );
}
