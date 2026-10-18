---
name: fuzzy-waddle-commit-message
description: Use when the user explicitly asks for a commit message for this repository.
---

# Fuzzy Waddle Commit Message

- Use this skill only to draft a requested commit message; follow the repo workflow for authorized automatic stage commits

## Workflow

- Inspect the staged diff
- Reuse a ticket number when one is known
- Keep the message specific to the staged chunk only
- Do not claim work that is not in the staged diff
- Do not mention tests or builds unless they actually ran

## Format

- Use Markdown
- Start with a short subject line
- Preferred subject: `<type>: <summary>`
- Acceptable ticket form when useful: `<ticket> <summary>`
- After the subject, use short sections with bullet points

## Preferred shape

```md
<subject>

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
- `## Reasons for Change` is optional but preferred when it adds context
- `## Notes` is optional
- Omit empty sections
- Keep bullets short and factual
