import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

function parseHashParams(hash: string): Record<string, string> {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const out: Record<string, string> = {};
  for (const pair of raw.split("&")) {
    if (!pair) continue;
    const [k, v = ""] = pair.split("=");
    out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
  }
  return out;
}

export function MagicLinkErrorScreen() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash.includes("error")) return;
    const params = parseHashParams(window.location.hash);
    if (!params.error && !params.error_code) return;
    setVisible(true);
    try {
      setEmail(localStorage.getItem("bookmrked_last_email") ?? "");
    } catch {}
    // Clean the hash so a refresh doesn't keep showing the error
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 text-center">
        <div className="mx-auto flex items-center justify-center gap-2 font-mono-tag text-ink-muted">
          <Bookmark className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
          bookmrked
        </div>
        <h1 className="font-display mt-6 text-3xl leading-tight text-ink">
          This link has expired
        </h1>
        <p className="mt-3 text-ink-muted">
          Magic links can only be used once. Request a fresh one and you'll be back in seconds.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-7 w-full rounded-md bg-gold px-6 py-3 text-base font-medium text-primary-foreground transition-transform hover:-translate-y-px"
        >
          Send me a new link
        </button>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            router.navigate({ to: "/" });
          }}
          className="mt-3 font-mono-tag text-ink-muted transition-colors hover:text-gold"
        >
          Back to home
        </button>
      </div>
      <AuthModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultEmail={email}
        title="Get a new magic link"
        description="We'll email you a fresh link — it expires after one use."
      />
    </div>
  );
}