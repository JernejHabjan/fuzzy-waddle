/** Coverage state for one capability seam. Planned entries name their evidence owner explicitly. */
export type AiCapabilityCoverageDisposition =
  | { readonly status: "implemented"; readonly symbol: string }
  | { readonly status: "planned"; readonly owner: string; readonly symbol: string }
  | { readonly status: "unsupported"; readonly reason: string }
  | { readonly status: "not_applicable"; readonly reason: string };
