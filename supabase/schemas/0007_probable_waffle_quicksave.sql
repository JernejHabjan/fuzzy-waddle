-- Quicksaves are a separate one-slot save kind, shared by the offline and authenticated save flows.
alter type public.probable_waffle_game_save_kind add value if not exists 'quicksave';
