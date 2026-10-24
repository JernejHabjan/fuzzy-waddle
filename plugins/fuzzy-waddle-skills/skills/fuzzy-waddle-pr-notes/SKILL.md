---
name: fuzzy-waddle-pr-notes
description: Use when the user explicitly asks for concise PR notes or a short change summary for this repository.
---

# Fuzzy Waddle PR Notes

## Rules

- Keep it short
- Focus on what changed
- State verification and closure-audit status concisely
- Do not add generic value statements
- Mention follow-up risks only when they matter
- When updating a PR body through a shell, pass real line breaks (for example, a PowerShell here-string); never rely on literal `\n` escapes.
- Read the PR body back after an update to confirm Markdown headings and line breaks rendered as intended.

## Preferred shape

```md
## Summary
- ...
- ...

## Reasons for Change
- ...

## Notes
- ...
```

## Section rules

- `## Summary` is expected
- `## Reasons for Change` is optional
- `## Notes` is optional
- Add `## Verification` when verification ran, was blocked, or requires disclosure
- Omit empty sections
- Keep bullets short and factual
