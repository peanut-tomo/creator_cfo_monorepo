import { productModules, supportedPlatforms, workflowPrinciples } from "@creator-cfo/schemas";
import { deviceStateContract, fileVaultContract, structuredStoreContract } from "@creator-cfo/storage";

import type { AppCopy } from "../app-shell/copy";
import type { AppSession } from "../app-shell/types";

export function buildHomeSections(copy: AppCopy, session: AppSession | null) {
  const sessionTitle =
    session?.kind === "apple"
      ? copy.home.sessionApple
      : session?.kind === "guest"
        ? copy.home.sessionGuest
        : copy.home.sessionSignedOut;

  return {
    focusCards: copy.home.focusCards,
    modules: productModules,
    platforms: supportedPlatforms,
    sessionTitle,
    storageCards: [
      {
        title: copy.home.storageTitle,
        value: structuredStoreContract.tables.length.toString(),
        label: copy.home.storageLabel,
      },
      {
        title: copy.home.collectionsTitle,
        value: fileVaultContract.collections.length.toString(),
        label: copy.home.collectionsLabel,
      },
      {
        title: "Device State",
        value: deviceStateContract.records.length.toString(),
        label: "AsyncStorage keys ready",
      },
    ],
    storageCollections: fileVaultContract.collections,
    workflowPrinciples,
  };
}
