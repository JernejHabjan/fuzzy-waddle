alter type public.probable_waffle_game_save_kind add value if not exists 'archive';

comment on type public.probable_waffle_game_save_kind is
  'Persistence category for game saves; archive preserves a completed campaign replay without presenting it as a resumable manual save.';
