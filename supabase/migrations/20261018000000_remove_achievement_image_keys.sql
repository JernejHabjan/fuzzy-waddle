-- Achievement icons are GUI atlas frames owned by the client's achievement catalogue.
-- Unlocks continue to reference stable achievement IDs; asset changes need no database writes.
alter table public.achievement_definitions
  drop column image_key;
