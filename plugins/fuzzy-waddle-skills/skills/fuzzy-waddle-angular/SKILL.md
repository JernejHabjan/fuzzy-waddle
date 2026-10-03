---
name: fuzzy-waddle-angular
description: Use for Angular implementation or review work in this repository.
---

# Fuzzy Waddle Angular

- Use standalone components
- Do not set `standalone: true`
- Use `input()` and `output()`
- Use signals, `computed()`, and `effect()`
- Use `set()` or `update()` instead of signal `mutate`
- Use `inject()` instead of constructor injection
- Set `ChangeDetectionStrategy.OnPush`
- Use `@if`, `@for`, and `@switch`
- Prefer reactive forms
- Add or update tests for every new or behaviorally changed service and component
- Exempt documentation-only, styling-only, and file-move changes from mandatory Angular test updates
- Match existing component and service patterns before introducing new abstractions
- New services must implement a named service interface/abstract contract and provide a matching stub that implements or satisfies the same contract
- Keep view logic close to the owning feature area
- Avoid broad UI cleanup unless requested
- Keep templates simple
- Do not use arrow functions in templates
- Do not assume globals like `new Date()` in templates
- Use relative paths for external templates and styles
- Add short docs only for non-obvious service or orchestration logic
- Add concise class/member/method docs for non-trivial state, persistence, lifecycle, and orchestration code
- Evaluate every created or changed public **and private** component, service, signal field, method, interface, enum, and helper for documentation. Review and improve existing docs whenever behavior or clarity changes. Document non-obvious state ownership, reactive lifecycle, persistence, side effects, and error paths; omit trivial constructors/getters/setters and never restate the symbol name.
- Treat interfaces, type aliases, enums, discriminated unions, and nested request/state members as documented APIs: explain non-trivial properties/members, their valid representation and persistence/reactive role, and link them to the owning contract with `{@link Symbol}`.
- Match documentation depth to complexity: longer or more branch-heavy UI/service methods must explain state transitions, authority boundaries, and cleanup behavior. Keep docs updated with implementation changes, migrate durable issue/design-brief decisions into the owning code, and link related contracts with `{@link Symbol}` when useful.
- When a feature exposes authored or planned content, make UI availability reflect executable status rather than the mere presence of a schema or design brief; document that boundary alongside the owning contract or service.
- Use `satisfies ExactContract` for inline UI state, request, event, and configuration objects that do not have a direct type annotation but do have an exact known contract. Do not replace an available contract with a broad assertion.
- Document component SCSS class blocks with short comments describing the UI element or layout responsibility
- Keep feature-specific Sass imports and tokens in feature component styles; do not add feature styling to generic `styles.scss`
- Strongly type route IDs, entity links, and related-record keys with shared types, literal unions, or enums instead of plain `string`
- Prefer one exported component, service, interface, or substantial type per file; colocate only tiny, tightly coupled contracts
- Type event emitters as discriminated unions when event names determine payload shape
- Avoid component-local `Record<string, unknown>` guards when shared interfaces can express the payload

## Review focus

- Signal and RxJS interop mistakes
- Over-coupled components
- DI lifetime issues
- Template control flow regressions
- Unclear state ownership between service and component
- Unsafe casts, non-null assertions, or broad payload types crossing Angular/Phaser boundaries
