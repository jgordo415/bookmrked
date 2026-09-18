import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Star, MapPin, Bookmark } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import ogImage from "@/assets/og-default.jpg";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => {
    const title = "Bookmrked — Save it. Visit it. Come back to it.";
    const description = "A quiet, deliberate place to keep the spots worth remembering — the coffee, the record store, the gallery you walked past twice and finally went in.";
    const ogImageUrl = `https://bookmrked.com${ogImage}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://bookmrked.com" },
        { property: "og:image", content: ogImageUrl },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImageUrl },
      ],
      links: [
        { rel: "canonical", href: "https://bookmrked.com" },
      ],
    };
  },
  component: Landing,
});

type Spot = {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  rating: number;
  blurb: string;
};

const SPOTS: Spot[] = [
  {
    id: "jane",
    name: "Jane on Larkin",
    neighborhood: "Tenderloin · SF",
    category: "Coffee",
    rating: 5,
    blurb: "Sunlit corner. Almond croissant, oat latte, a stack of magazines.",
  },
  {
    id: "arsicault",
    name: "Arsicault",
    neighborhood: "Chase Center · SF",
    category: "Bakery",
    rating: 5,
    blurb: "The kouign-amann. The croissant. Show up early or don't show up.",
  },
  {
    id: "caffe",
    name: "The Caffè by Mr. Espresso",
    neighborhood: "Oakland",
    category: "Coffee",
    rating: 4,
    blurb: "Oak-roasted beans, marble counter, the cappuccino you'll measure others against.",
  },
];

function Landing() {
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const visitedCount = Object.values(visited).filter(Boolean).length;
  const progress = Math.round((visitedCount / SPOTS.length) * 100);
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("signin") === "1") {
      setSignInOpen(true);
      params.delete("signin");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        navigate({ to: "/dashboard", replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* TOP NAV */}
      <nav className="absolute left-0 right-0 top-0 z-10 px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 font-mono-tag text-ink-muted">
            <Bookmark className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
            bookmrked
          </div>
          <button
            type="button"
            onClick={() => setSignInOpen(true)}
            className="font-mono-tag text-ink-muted transition-colors hover:text-gold"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-5 pt-14 pb-20 sm:px-8 sm:pt-20 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-5xl">

          <h1 className="font-display mt-6 text-[clamp(4.5rem,16vw,11rem)] font-semibold leading-[0.85] tracking-[-0.04em] text-ink">
            Bookmrked
          </h1>

          <h2 className="font-display mt-8 text-[clamp(2rem,6vw,4rem)] leading-[0.95] tracking-tight text-ink-muted">
            Save it. <span className="italic text-gold">Visit it.</span>
            <br />
            Come back to it.
          </h2>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
            A quiet, deliberate place to keep the spots worth remembering — the coffee, the
            record store, the gallery you walked past twice and finally went in.
          </p>

          <EmailCapture id="hero-email" cta="Start your first collection" className="mt-10" />

          <div className="mt-6 font-mono-tag text-ink-muted">
            Free to start. No credit card required.
          </div>
        </div>

        {/* subtle hairline */}
        <div className="mx-auto mt-20 h-px max-w-5xl bg-border" />
      </section>

      {/* DEMO COLLECTION */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="font-mono-tag text-gold">Featured Collection · Demo</div>
              <h2 className="font-display mt-3 text-4xl leading-tight text-ink sm:text-5xl">
                SF Coffee Crawl
              </h2>
              <p className="mt-2 text-ink-muted">Three rooms. One morning. Tap to mark visited.</p>
            </div>
            <div className="hidden text-right sm:block">
              <div className="font-display text-5xl text-gold">{progress}%</div>
              <div className="font-mono-tag text-ink-muted">
                {visitedCount} / {SPOTS.length} visited
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-6 h-[2px] w-full overflow-hidden bg-border/60">
            <div
              className="h-full bg-gold transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ul className="mt-8 grid gap-4 sm:gap-5">
            {SPOTS.map((spot, i) => {
              const isVisited = !!visited[spot.id];
              return (
                <li
                  key={spot.id}
                  className="group relative rounded-lg border border-border bg-surface/60 p-5 backdrop-blur-sm transition-colors hover:border-gold/40 sm:p-7"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 font-mono-tag text-ink-muted">
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <span className="h-px w-6 bg-border" />
                        <span className="rounded-full border border-border px-2 py-0.5 text-ink">
                          {spot.category}
                        </span>
                      </div>

                      <h3 className="font-display mt-3 text-2xl text-ink sm:text-3xl">
                        {spot.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                        {spot.neighborhood}
                      </div>

                      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                        {spot.blurb}
                      </p>

                      <div className="mt-4 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={
                              idx < spot.rating
                                ? "h-3.5 w-3.5 fill-gold text-gold"
                                : "h-3.5 w-3.5 text-border"
                            }
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setVisited((v) => ({ ...v, [spot.id]: !v[spot.id] }))
                      }
                      aria-pressed={isVisited}
                      aria-label={isVisited ? `Mark ${spot.name} as not visited` : `Mark ${spot.name} as visited`}
                      className={[
                        "shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                        isVisited
                          ? "border-gold bg-gold text-primary-foreground"
                          : "border-border text-ink hover:border-gold/60 hover:text-gold",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                          isVisited ? "border-primary-foreground bg-primary-foreground/20" : "border-current",
                        ].join(" ")}
                      >
                        {isVisited && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {isVisited ? "Visited" : "Mark visited"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 text-center font-mono-tag text-ink-muted sm:hidden">
            {visitedCount} / {SPOTS.length} visited · {progress}%
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section className="border-t border-border px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="font-mono-tag text-gold">Pricing</div>
          <h2 className="font-display mt-3 text-4xl text-ink sm:text-5xl">
            Free to start. <span className="italic">More when you want it.</span>
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <TierCard
              kicker="Free"
              price="$0"
              note="forever"
              features={[
                "Up to 5 active collections",
                "15 locations per collection",
                "150-character notes",
                "Share collections via link",
              ]}
            />
            <TierCard
              kicker="Premium"
              price="$7.99"
              note="/month · or $59/year"
              highlight
              features={[
                "Unlimited collections & locations",
                "Photo uploads (up to 5 per spot)",
                "Extended notes",
                "Gordo Certified curated library",
                "Map view & smart filters",
                "Export & personal stats",
              ]}
            />
          </div>
        </div>
      </section>

      {/* GORDO CERTIFIED */}
      <section className="border-t border-border px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="font-mono-tag text-gold">🌮 Gordo Certified</div>
              <h2 className="font-display mt-3 text-4xl text-ink sm:text-5xl">
                Curation, by someone who actually goes.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
                A growing library of collections hand-built by Gordo Certified — a real Bay Area
                food and culture creator. SF Coffee Crawl, Oakland Eats, Toronto Finds, and more
                arriving with every drop. Save them, customize them, make them yours.
              </p>
              <div className="mt-6 font-mono-tag text-ink-muted">
                Available to Premium members at launch.
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-gold/10 blur-2xl" />
              <div className="rounded-xl border border-border bg-surface-raised p-6">
                {[
                  { name: "SF Coffee Crawl", count: 12 },
                  { name: "Oakland Eats", count: 18 },
                  { name: "Bay Area Brunch", count: 14 },
                  { name: "Toronto Finds", count: 9 },
                ].map((c, i) => (
                  <div
                    key={c.name}
                    className={[
                      "flex items-center justify-between py-4",
                      i !== 0 ? "border-t border-border" : "",
                    ].join(" ")}
                  >
                    <div>
                      <div className="font-display text-xl text-ink">{c.name}</div>
                      <div className="font-mono-tag text-ink-muted">{c.count} spots</div>
                    </div>
                    <div className="font-mono-tag text-gold">Premium</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-border px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="font-mono-tag text-gold">Start today</div>
          <h2 className="font-display mt-4 text-4xl leading-tight text-ink sm:text-6xl">
            Build your map of the world <span className="italic">worth coming back to.</span>
          </h2>
          <EmailCapture id="footer-email" cta="Start your first collection" className="mx-auto mt-10 max-w-md" />
        </div>

        <div className="mx-auto mt-24 flex max-w-5xl items-center justify-between border-t border-border pt-8 font-mono-tag text-ink-muted">
          <div className="flex items-center gap-2">
            <Bookmark className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
            bookmrked.com
          </div>
          <div>© {new Date().getFullYear()} Bookmrked</div>
        </div>
      </section>

      <AuthModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        title="Welcome back"
        description="We'll email you a magic link to sign in."
      />
    </main>
  );
}

function EmailCapture({
  id,
  cta,
  className = "",
}: {
  id: string;
  cta: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className={`flex flex-col gap-3 sm:flex-row sm:items-stretch ${className}`}
      >
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@somewhere.com"
          className="flex-1 rounded-md border border-border bg-surface/70 px-4 py-3.5 text-base text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
        <button
          type="submit"
          className="rounded-md bg-gold px-6 py-3.5 text-base font-medium text-primary-foreground transition-transform hover:-translate-y-px active:translate-y-0"
        >
          {cta}
        </button>
      </form>
      <AuthModal open={open} onOpenChange={setOpen} defaultEmail={email} />
    </>
  );
}

function TierCard({
  kicker,
  price,
  note,
  features,
  highlight = false,
}: {
  kicker: string;
  price: string;
  note: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "relative rounded-xl border p-7 sm:p-8",
        highlight
          ? "border-gold/50 bg-surface-raised"
          : "border-border bg-surface/60",
      ].join(" ")}
    >
      {highlight && (
        <div className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 font-mono-tag text-primary-foreground">
          Recommended
        </div>
      )}
      <div className="font-mono-tag text-ink-muted">{kicker}</div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-5xl text-ink">{price}</span>
        <span className="text-sm text-ink-muted">{note}</span>
      </div>
      <ul className="mt-7 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-ink">
            <Check
              className={highlight ? "mt-1 h-4 w-4 shrink-0 text-gold" : "mt-1 h-4 w-4 shrink-0 text-ink-muted"}
              strokeWidth={2.5}
            />
            <span className="text-[15px] leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
