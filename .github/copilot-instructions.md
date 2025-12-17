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
