import { DPod } from "@dendronhq/common-all";

export interface PodClassEntryV4 {
  id: string;
  description: string;
  kind: PodKind;
  new (): DPod<any>;
}

export type PodItemV4 = {
  id: string;
  description: string;
  podClass: PodClassEntryV4;
};

export type PodKind = "import" | "export" | "publish";
