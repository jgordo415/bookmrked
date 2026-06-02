import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getSharedCollection = createServerFn({ method: "GET" })
  .inputValidator((input: { shareToken: string }) => input)
  .handler(async ({ data }) => {
    const { data: cData } = await supabaseAdmin.rpc("get_shared_collection", {
      _token: data.shareToken,
    });
    const collection = (cData ?? [])[0] as {
      id: string;
      title: string;
      description: string | null;
      category: string | null;
      privacy: string;
      share_token: string;
    } | undefined;

    if (!collection) {
      return { collection: null, places: [] as { id: string }[] };
    }

    const { data: pData } = await supabaseAdmin.rpc("get_shared_places", {
      _token: data.shareToken,
    });

    return {
      collection,
      places: (pData ?? []) as { id: string }[],
    };
  });
