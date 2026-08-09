---
name: fuzzy-waddle-nestjs
description: Use for NestJS implementation or review work in this repository.
---

# Fuzzy Waddle NestJS

- Backend app: `apps/api`
- Shared contracts: `libs/api-interfaces`
- Realtime transport: Socket.IO gateways
- Auth and guards live under `apps/api/src/auth/`

- Follow existing module, service, gateway, and DTO patterns before adding new architecture
- New services must implement a named service interface and provide a stub that implements or satisfies that same interface
- Keep game-specific backend logic inside the relevant game module
- Prefer shared contracts from `libs/api-interfaces` over duplicating request or event shapes
- Prefer one authoritative validation or auth hook over duplicating the same guard logic across services and gateways
- Keep websocket payload parsing at the boundary: narrow from `unknown` with named guards, then validate typed DTO/shared-contract objects internally
- Avoid `any`, broad `Record<string, unknown>`, and non-null assertions in validators/gateways when a shared event type or explicit raw payload type can be used
- Add short docs only for non-obvious service, gateway, or sync logic
- Add concise class/member/method docs for non-trivial persistence, authorization, lifecycle, and orchestration code
- Evaluate every created or changed public **and private** controller, service, gateway, DTO, interface, enum, field, method, and helper for documentation. Review and improve existing docs whenever behavior or clarity changes. Document non-obvious authorization, persistence, transaction, transport, ordering, and error invariants; omit trivial constructors/getters/setters and never restate the symbol name.
- Treat interfaces, type aliases, enums, discriminated unions, DTO members, and nested transport/database payload members as documented APIs: explain non-trivial properties/members, their valid representation and authorization/persistence role, and link them to the owning contract with `{@link Symbol}`.
- Scale documentation with complexity: longer or branch-heavy methods must explain authority boundaries, side effects, failure/retry behavior, and cleanup. Update docs with behavior changes, migrate durable issue/design-brief decisions into the owning code, and link related contracts with `{@link Symbol}` when useful.
- When persistence receives authored/planned content, document and enforce the boundary between validated planning data and launchable or reward-eligible behavior; a stored contract alone is not completion evidence.
- Use `satisfies ExactContract` for inline DTO, event, database, and configuration objects without a direct annotation when an exact contract exists. Do not use assertions to bypass an available contract.
- Strongly type entity IDs and foreign-key-style links with shared types or enums instead of unconstrained `string`
- Prefer database enums for stable closed value sets such as status, scope, kind, or outcome
- Prefer one exported controller, service, DTO, interface, or substantial type per file; colocate only tiny, tightly coupled contracts
- After fixing a non-obvious realtime or auth bug, add short comments near the fix describing the invariant and why the check must stay in that layer

## Review focus

- Guard coverage on websocket and controller entry points
- Event contract drift between API and client
- State mutation hidden inside service chains
- Module boundary leaks
- Missing cleanup or disconnect handling in gateways
- Validation code that trusts typed client payloads without runtime checks, or keeps values untyped after checks
