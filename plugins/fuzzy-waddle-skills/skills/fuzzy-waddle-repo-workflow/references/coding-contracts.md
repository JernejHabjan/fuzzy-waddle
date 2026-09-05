# Coding and documentation contracts

Read for implementation or migration of code/contracts, not routine git/status work.

- Prefer one existing authority/helper over parallel implementations. Export one substantial type/class per file; colocate only tightly coupled trivial types.
- Use shared IDs, literal unions, enums and discriminated payloads for relationships. Avoid internal any, non-null assertions, string-key probes or unstructured records when an exact contract exists. Accept unknown at untrusted boundaries, validate immediately, then pass typed values.
- Use satisfies for new/changed inline data with an existing exact contract, not a type assertion to bypass checking. Remove nearby avoidable unsafe types only when local and in scope.

## Documentation without repetition

Evaluate every changed public/private class, interface, type alias, enum, nested member, field, method and helper for documentation. Document most non-self-explanatory symbols; omit boilerplate for trivial constructors/getters/forwarders.

Explain ownership, representation/units, lifecycle, ordering, persistence, invariants, side effects, failures and cleanup where relevant. Properties and enum members are first-class contracts: describe semantic differences and valid states. Link related owners with JSDoc links; scale detail to stateful/branch-heavy logic. Add short class/method docs for non-trivial managers/services/controllers and a local invariant comment for non-obvious repairs.

Review existing docs on changed symbols and their immediate consumers. Preserve existing comments under AGENTS.md; obtain direction for conflicting stale comments rather than silently rewriting them. Never leave knowingly false behavior documentation.

When replacing a requested brief/plan, move durable decisions into owning code/docs, preserve source-to-symbol traceability and distinguish executable behavior from scaffolds/future work. Use a small workflow diagram only when it clarifies multiple dependent stages or authority boundaries. Do not make shipped code depend on a deleted planning document.

For changed SQL migrations/schema, use SQL comments for non-obvious constraints, indexes, policies, triggers and transaction/restore ordering.
