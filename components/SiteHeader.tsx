
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  Menu,
  X,
  Heart,
  ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export function SiteHeader() {
  const { user, signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!user || !supabase) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_foodloop_admin");

      if (active) {
        setIsAdmin(!error && data === true);
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <header className="site-header india-header">
      <div className="container nav">
        <Link href="/" className="brand india-brand">
          <span className="brand-mark">
            <Image
              src="/foodloop-mark.svg"
              alt=""
              width={46}
              height={46}
            />
          </span>

          <span>
            <b>FoodLoop</b>
            <small>Food rescue · Feed people · Create impact</small>
          </span>
        </Link>

        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? "nav-links show" : "nav-links"}>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>

          <Link href="/#promise" onClick={() => setOpen(false)}>
            Our promise
          </Link>

          <Link href="/#shloka" onClick={() => setOpen(false)}>
            Our values
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="nav-strong"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>

              <Link href="/profile" onClick={() => setOpen(false)}>
                Profile
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="nav-strong"
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck size={15} />
                  Admin
                </Link>
              )}

              <button
                className="nav-logout"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>

              <Link
                href="/register"
                className="btn btn-nav"
                onClick={() => setOpen(false)}
              >
                <Heart size={15} />
                Join FoodLoop
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
