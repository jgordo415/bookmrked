import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export function AuthModal({
  open,
  onOpenChange,
  defaultEmail = "",
  title = "Get Early Access",
  description = "We'll email you a magic link — no password needed.",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEmail?: string;
  title?: string;
  description?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Keep input synced when defaultEmail changes between opens
  if (defaultEmail && defaultEmail !== email && status === "idle") {
    // one-time sync on first render with a default
    setEmail(defaultEmail);
  }

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  };

  const signInWithGoogle = async () => {
    setErrorMsg("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      setErrorMsg(result.error.message ?? "Google sign-in failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface-raised sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-ink">{title}</DialogTitle>
          <DialogDescription className="text-ink-muted">{description}</DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <div className="py-6 text-center">
            <div className="font-mono-tag text-gold">Check your inbox</div>
            <p className="mt-3 text-ink">
              We sent a magic link to <span className="text-gold">{email}</span>.
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Click it to sign in. You can close this window.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={sendMagicLink} className="mt-2 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@somewhere.com"
                disabled={status === "sending"}
                className="rounded-md border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-md bg-gold px-6 py-3 text-base font-medium text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
            </form>

            <div className="my-2 flex items-center gap-3 text-xs text-ink-muted">
              <span className="h-px flex-1 bg-border" />
              <span className="font-mono-tag">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-3 rounded-md border border-border bg-surface px-6 py-3 text-base font-medium text-ink transition-colors hover:border-gold/60 hover:text-gold"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
              </svg>
              Continue with Google
            </button>

            {errorMsg && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}