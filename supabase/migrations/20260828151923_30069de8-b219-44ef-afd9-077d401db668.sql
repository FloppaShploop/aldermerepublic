DELETE FROM public.game_progress a USING public.game_progress b WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.game_id = b.game_id;
ALTER TABLE public.game_progress ADD CONSTRAINT game_progress_user_game_key UNIQUE (user_id, game_id);
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.games ALTER COLUMN html SET DEFAULT '';