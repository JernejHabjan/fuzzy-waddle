# Trusted campaign hooks

First-party mission JSON may name a trusted TypeScript hook only when the reusable action and condition registries cannot express the behavior without distorting their contracts.

Every hook must:

- register one stable hook ID through `CampaignDefinitionRegistries.trustedHooks`;
- document deterministic inputs, simulation-tick ordering, and every world authority it calls;
- serialize any continuation or owned gameplay state needed by save, snapshot, reconnect, hash, and replay paths;
- clean up subscriptions, locks, modifiers, timers, and spawned resources through its owning mission/phase/action lifecycle;
- include focused deterministic, save/restore, cancellation, and cleanup tests;
- avoid camera, audio, subtitle, HUD, or other local presentation mutation.

Hooks are repository-trusted code. They are not a public mod API and must never execute code embedded in JSON.
