import type { AppCopy } from "../app-shell/copy";
import type { AppIconName } from "../../components/app-icon";

export interface TabScreenSpec {
  icon: AppIconName;
  iconSize: number;
  name: "index" | "ledger" | "profile";
  title: string;
}

export function buildTabScreenSpecs(copy: AppCopy): TabScreenSpec[] {
  return [
    {
      icon: "home",
      iconSize: 18,
      name: "index",
      title: copy.tabs.home,
    },
    {
      icon: "ledger",
      iconSize: 19,
      name: "ledger",
      title: copy.tabs.ledger,
    },
    {
      icon: "profile",
      iconSize: 20,
      name: "profile",
      title: copy.tabs.profile,
    },
  ];
}
