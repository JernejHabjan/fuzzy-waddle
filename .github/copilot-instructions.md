# Copilot Instructions

## Comment Preservation (Mandatory)

- **Do not remove existing comments** under any circumstances.
- **Do not rewrite, paraphrase, or “clean up” comments**, even if they appear redundant, outdated, or poorly worded.
- **Do not move comments** unless explicitly instructed.

## Comment Integrity

- Preserve all comment types exactly as they are:
  - Explanatory comments
  - TODO / FIXME / NOTE / HACK annotations
  - Inline, block, and file-level comments
- Maintain original formatting, wording, and placement.

## Adding New Comments

- Add new comments **only when necessary** to explain newly introduced logic.
- New comments must:
  - Complement existing comments
  - Never duplicate, contradict, or override existing explanations
  - Be clearly distinguishable from existing comments

## Code Changes

- When refactoring or modifying code:
  - Treat comments as **read-only**.
  - Adapt code around comments, not the other way around.
  - If a comment appears incorrect, **do not fix it silently** — flag it explicitly instead.

## Allowed Exceptions

- Modify comments **only if explicitly instructed** to do so.
- If a comment conflicts with required behavior:
  - Preserve the comment
  - Add a new comment explaining the discrepancy

## Rationale

Comments are a critical part of the codebase’s knowledge system.  
They provide historical context, design intent, and debugging clues that must remain intact for future maintainability.

# Typescript and Angular Best Practices
taken from [Angular develop with AI](https://angular.dev/ai/develop-with-ai)
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
## Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
### Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
