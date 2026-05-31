
-- Ensure authenticated users can use gen_random_bytes (used by collections.share_token default)
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT EXECUTE ON FUNCTION extensions.gen_random_bytes(integer) TO authenticated;

-- COLLECTIONS: replace the catch-all owner policy with explicit per-action policies
DROP POLICY IF EXISTS "collections owner all" ON public.collections;

CREATE POLICY "Users can select their own collections"
  ON public.collections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON public.collections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- LOCATIONS: explicit per-action policies; ownership is via parent collection
DROP POLICY IF EXISTS "locations owner all" ON public.locations;

CREATE POLICY "Users can select locations in their collections"
  ON public.locations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = locations.collection_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert locations in their collections"
  ON public.locations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = locations.collection_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can update locations in their collections"
  ON public.locations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = locations.collection_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = locations.collection_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete locations in their collections"
  ON public.locations FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = locations.collection_id AND c.user_id = auth.uid()
  ));

-- VISITS: explicit per-action policies on the row owner
DROP POLICY IF EXISTS "visits owner all" ON public.visits;

CREATE POLICY "Users can select their own visits"
  ON public.visits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits"
  ON public.visits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits"
  ON public.visits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits"
  ON public.visits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
