# Commit Changes

Create a git commit for the current staged changes.

## Instructions

1. Run `git status` to see what files are staged and unstaged
2. Run `git diff --staged` to review the staged changes
3. Run `git log --oneline -5` to see recent commit message style
4. Analyze the changes and create a commit message that:
   - Uses imperative mood (e.g., "Add feature" not "Added feature")
   - Summarizes the "why" rather than just the "what"
   - Keeps the first line under 72 characters
   - Uses conventional commit prefixes when appropriate: feat, fix, refactor, docs, test, chore
5. Stage any unstaged files that should be included (ask if unclear)
6. Create the commit with Co-Authored-By trailer

## Commit Format

```
<type>: <description>

<optional body explaining why>
```

## Important

- Do NOT commit files that contain secrets (.env.local, credentials, etc.)
- Do NOT use `git commit --amend` unless explicitly requested
- Do NOT push to remote unless explicitly requested
