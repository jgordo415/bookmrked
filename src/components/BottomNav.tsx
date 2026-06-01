import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, User as UserIcon, Lock } from "lucide-react";
import type { ReactNode } from "react";

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        <NavLink
          to="/dashboard"
          icon={<Home className="h-5 w-5" />}
          label="Home"
          active={pathname === "/dashboard"}
        />
        <NavItem
          icon={<Compass className="h-5 w-5" />}
          label="Discover"
          locked
        />
        <NavLink
          to="/profile"
          icon={<UserIcon className="h-5 w-5" />}
          label="Profile"
          active={pathname === "/profile"}
        />
      </div>
    </nav>
  );
}

function NavLink({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center gap-1 rounded-md px-4 py-2 font-mono-tag transition ${
        active ? "text-gold" : "text-ink-muted hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function NavItem({
  icon,
  label,
  locked,
}: {
  icon: ReactNode;
  label: string;
  locked?: boolean;
}) {
  return (
    <button
      disabled={locked}
      className={`flex flex-1 flex-col items-center gap-1 rounded-md px-4 py-2 font-mono-tag transition ${
        locked ? "text-ink-muted/40" : "text-ink-muted hover:text-ink"
      }`}
    >
      <div className="relative">
        {icon}
        {locked && (
          <Lock className="absolute -right-2 -top-1 h-3 w-3" strokeWidth={2.5} />
        )}
      </div>
      {label}
    </button>
  );
}
