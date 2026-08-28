CREATE TABLE public.game_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.game_errors TO authenticated;
GRANT ALL ON public.game_errors TO service_role;
ALTER TABLE public.game_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert own error reports" ON public.game_errors FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin reads errors" ON public.game_errors FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin clears errors" ON public.game_errors FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.game_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  title text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.game_suggestions TO authenticated;
GRANT ALL ON public.game_suggestions TO service_role;
ALTER TABLE public.game_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert own suggestion" ON public.game_suggestions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read own suggestion" ON public.game_suggestions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin reads suggestions" ON public.game_suggestions FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "delete own suggestion" ON public.game_suggestions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin deletes suggestions" ON public.game_suggestions FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));