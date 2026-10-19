# Spell availability display implementation plan

Closes #730.

## Current behavior

The spell HUD already has three separate mechanics:

- Unresearched, research-gated spells are hidden by `ActorActions`.
- Cooldown spells stay visible, disabled, and show a dark top-to-bottom mask with a bottom-right seconds countdown in `ActorAction`.
- Tooltips explain unmet research prerequisites.

The issue screenshot identifies a spell button but does not state which state is incorrect or its expected visual treatment.

## Approved policy

The reviewer accepted the recommended three-state treatment:

The approved policy is:

| State               | Recommended treatment                                                    | Why                                                                   |
| ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Ready               | Normal icon, hotkey, and autocast state                                  | No ambiguity.                                                         |
| Cooldown            | Keep visible with a distinct cooldown overlay and numeric countdown      | Players need to predict when it becomes usable.                       |
| Unresearched/locked | Keep visible but disabled with a lock treatment and prerequisite tooltip | Discoverability is better than hiding an available future capability. |

## Implementation stages

1. Add one explicit availability state (`ready`, `cooldown`, or `locked`) at the existing `ActorActions` setup boundary. Keep research and cooldown calculation in their current owners.
2. Render locked actions instead of filtering them out. Disable pointer/hotkey casting, retain the icon and hotkey label, add a visually distinct lock treatment, and keep the prerequisite explanation in the tooltip.
3. Preserve the existing cooldown mask, seconds countdown, right-click autocast behavior, and ready-state presentation. A locked action must never display as a cooldown action.
4. Keep `ActorAction.ts` and its paired Phaser Editor scene asset synchronized if the lock treatment requires authored objects.
5. Add focused coverage for state precedence and interaction guards, then validate the Phaser project and manually inspect all three states at desktop and narrow HUD widths.

## Acceptance criteria

- Every known spell remains discoverable in its normal action slot.
- Locked spells cannot cast from click or hotkey and explain their prerequisite.
- Cooldown spells remain visible with an updating numeric countdown.
- Ready spells, hotkeys, and autocast behave exactly as before.
- A transition caused by research completion or cooldown expiry updates without rebuilding or duplicating HUD controls.

## Continuation prompt

```text
Implement #730 from docs/ai/730-spell-availability-display.md. The three-state policy is approved. Update only ActorAction/ActorActions and any required paired scene assets, preserve cooldown countdown, hotkeys, and autocast behavior, then run Phaser validation plus focused tests and capture ready/cooldown/locked manual checks. Open a separate draft implementation PR.
```
