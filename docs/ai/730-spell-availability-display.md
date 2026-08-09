# Spell availability display decision

Closes #730.

## Current behavior

The spell HUD already has three separate mechanics:

- Unresearched, research-gated spells are hidden by `ActorActions`.
- Cooldown spells stay visible, disabled, and show a dark top-to-bottom mask with a bottom-right seconds countdown in `ActorAction`.
- Tooltips explain unmet research prerequisites.

The issue screenshot identifies a spell button but does not state which state is incorrect or its expected visual treatment.

## Decision required

For each state, choose a visible policy:

| State               | Recommended treatment                                                    | Why                                                                   |
| ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Ready               | Normal icon, hotkey, and autocast state                                  | No ambiguity.                                                         |
| Cooldown            | Keep visible with a distinct cooldown overlay and numeric countdown      | Players need to predict when it becomes usable.                       |
| Unresearched/locked | Keep visible but disabled with a lock treatment and prerequisite tooltip | Discoverability is better than hiding an available future capability. |

Reply with one:

1. `Accept recommendation`.
2. `Use: <expected treatment for ready, cooldown, locked>`.
3. `Defer`.

## Implementation after approval

1. Centralize the three-state visual contract in the existing `ActorAction`/`ActorActions` rendering path; keep paired Phaser Editor scene assets synchronized if authored style changes are needed.
2. Preserve right-click autocast and hotkey behavior.
3. Add focused state-rendering coverage where the current UI harness permits it.
4. Validate the Phaser project and manually inspect ready, cooldown, and locked states at desktop and narrow HUD widths.

## Continuation prompt

```text
Continue the implementation for #730. The approved spell availability policy is: <paste reviewer response>. Update only ActorAction/ActorActions and any required paired scene assets, preserve cooldown countdown, hotkeys, and autocast behavior, then run Phaser validation plus focused tests and capture ready/cooldown/locked manual checks.
```
