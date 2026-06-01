
CREATE OR REPLACE FUNCTION public.get_shared_collection(_token text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  privacy text,
  share_token text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.title, c.description, c.category, c.privacy, c.share_token
  FROM public.collections c
  WHERE c.share_token = _token
    AND c.privacy = 'shareable'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_places(_token text)
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  category text,
  notes text,
  visited boolean,
  star_rating integer,
  visit_note text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.name,
    l.city,
    l.category,
    l.notes,
    (v.id IS NOT NULL) AS visited,
    v.star_rating,
    v.note AS visit_note
  FROM public.collections c
  JOIN public.locations l ON l.collection_id = c.id
  LEFT JOIN public.visits v
    ON v.location_id = l.id AND v.user_id = c.user_id
  WHERE c.share_token = _token
    AND c.privacy = 'shareable'
  ORDER BY l.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_collection(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_places(text) TO anon, authenticated;
