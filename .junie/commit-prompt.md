# Commit Prompt

Use plain Markdown only. Do not wrap output in code fences. Return raw formatted content directly.

Format: `<TICKET> <Area>: <Short title>`

## Changes

Use this optional section only when it adds useful information.

- Extract the ticket number from `$GIT_BRANCH_NAME`; never invent, modify, or increment it.
- Keep the title concise, factual, and high-level. Include the affected module, feature, or area.
- Mention symbols, fields, endpoints, or components only when meaningful.
- Use one to six bullets, with a maximum of 20 words per bullet.
- Describe concrete changes and behavior impact only. Omit testing details, filler, and implementation noise unless behavior changed.
- Start bullets with concrete action verbs such as Added, Removed, Updated, Handled, Prevented, Restricted, Mapped, Renamed, Validated, Hid, or Displayed.
- Avoid subjective wording such as improved, better, cleaner, streamlined, enhanced, optimized, refactored for clarity, simplified, or modernized.
- For a single simple change, return the title only. For two or three tightly related changes, prefer the title only.
