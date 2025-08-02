# Git Commit Instructions

## Commit Message Format

- Start with the ticket number (e\.g\., `#376`)
- Use the present tense ("Add feature" not "Added feature")
- Start with a short summary (max 50 characters)
- Separate subject from body with a blank line
- Use the body to explain what and why (not how). Do that in a few bullet points in short sentences.
- Reference issues and pull requests when relevant

## Example

```
#376 feat: add user authentication

## Changes
- Added JWT-based authentication to the login endpoint.
- Implemented user registration with email verification.
## Motivation
This feature allows users to securely log in and register, enhancing the overall security of the application.
```

## Types

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Code style changes (formatting, missing semi colons, etc)
- refactor: Code changes that neither fix a bug nor add a feature
- test: Adding or fixing tests
- chore: Maintenance tasks
