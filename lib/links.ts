import { appUrl } from "@/lib/env";

export function candidateLink(token: string) {
  return `${appUrl()}/test/${token}`;
}
