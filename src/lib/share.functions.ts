import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type SharedCollectionData = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  privacy: string;
  share_token: string;
};

type SharedPlaceData = {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  notes: string | null;
  visited: boolean;
  star_rating: number | null;
  visit_note: string | null;
};

export const getSharedCollection = createServerFn({ method: "GET" })
  .inputValidator((input: { shareToken: string }) => input)
  .handler(async ({ data }) => {
    const { data: cData } = await supabaseAdmin.rpc("get_shared_collection", {
      _token: data.shareToken,
    });
    const collection = (cData ?? [])[0] as SharedCollectionData | undefined;

    if (!collection) {
      return { collection: null as SharedCollectionData | null, places: [] as SharedPlaceData[] };
    }

    const { data: pData } = await supabaseAdmin.rpc("get_shared_places", {
      _token: data.shareToken,
    });

    return {
      collection,
      places: (pData ?? []) as SharedPlaceData[],
    };
  });
