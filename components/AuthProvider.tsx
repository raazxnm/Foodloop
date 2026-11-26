
"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AppUser, ProfileInput, SignUpInput, UserRole } from "@/lib/types";

type Ctx = {
  user: AppUser | null;
  loading: boolean;
  mode: "demo" | "live";
  signIn: (e: string, p: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const C = createContext<Ctx | null>(null);

function fromSession(u: User): AppUser {
  const m = u.user_metadata || {};

  return {
    id: u.id,
    name: m.full_name || u.email?.split("@")[0] || "FoodLoop member",
    email: u.email || "",
    role: (m.role || "donor") as UserRole,
    phone: m.phone || "",
    city: m.city || "",
    state: m.state || "",
    bio: m.bio || "",
    organizationName: m.organization_name || "",
    organizationType: m.organization_type || "",
    address: m.address || ""
  };
}

async function hydrateSessionUser(u: User): Promise<AppUser> {
  const base = fromSession(u);

  if (!supabase) return base;

  const [{ data: profile }, { data: org }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,role,phone,city,state,bio")
      .eq("id", u.id)
      .maybeSingle(),

    supabase
      .from("organizations")
      .select("name,organization_type,address")
      .eq("owner_id", u.id)
      .maybeSingle()
  ]);

  return {
    ...base,
    ...(profile
      ? {
          name: profile.full_name,
          role: profile.role as UserRole,
          phone: profile.phone,
          city: profile.city,
          state: profile.state,
          bio: profile.bio
        }
      : {}),
    ...(org
      ? {
          organizationName: org.name,
          organizationType: org.organization_type,
          address: org.address
        }
      : {})
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session) {
          setUser(await hydrateSessionUser(data.session.user));
        }
        setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          void hydrateSessionUser(session.user).then(setUser);
        } else {
          setUser(null);
        }
      });

      return () => data.subscription.unsubscribe();
    }

    try {
      const v = localStorage.getItem("foodloop_demo_user");
      if (v) setUser(JSON.parse(v));
    } catch {}

    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        setUser(await hydrateSessionUser(data.user));
      }

      return;
    }

    const users = JSON.parse(
      localStorage.getItem("foodloop_demo_users") || "[]"
    ) as AppUser[];

    const u = users.find(
      x => x.email.toLowerCase() === email.toLowerCase()
    );

    if (!u || password.length < 6) {
      throw new Error(
        "Demo account not found. Register first with a password of at least 6 characters."
      );
    }

    localStorage.setItem("foodloop_demo_user", JSON.stringify(u));
    setUser(u);
  }

  async function signUp(input: SignUpInput) {
    const {
      name,
      email,
      password,
      role,
      phone,
      city,
      state,
      bio,
      organizationName,
      organizationType,
      address
    } = input;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            phone,
            city,
            state,
            bio,
            organization_name: organizationName,
            organization_type: organizationType,
            address
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("foodloop_demo_users") || "[]"
    ) as AppUser[];

    if (users.some(x => x.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }

    const u: AppUser = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      phone,
      city,
      state,
      bio,
      organizationName,
      organizationType,
      address
    };

    users.push(u);

    localStorage.setItem("foodloop_demo_users", JSON.stringify(users));
    localStorage.setItem("foodloop_demo_user", JSON.stringify(u));
    setUser(u);
  }

  async function updateProfile(input: ProfileInput) {
    if (!user) throw new Error("Please sign in again.");

    const next = {
      ...user,
      name: input.name,
      phone: input.phone,
      city: input.city,
      state: input.state,
      bio: input.bio
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc("update_my_profile", {
        p_full_name: input.name,
        p_phone: input.phone,
        p_city: input.city,
        p_state: input.state,
        p_bio: input.bio
      });

      if (error) throw error;

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: input.name,
          phone: input.phone,
          city: input.city,
          state: input.state,
          bio: input.bio
        }
      });

      if (metaError) throw metaError;
    } else {
      const users = JSON.parse(
        localStorage.getItem("foodloop_demo_users") || "[]"
      ) as AppUser[];

      const updated = users.map(x => x.id === user.id ? next : x);

      localStorage.setItem("foodloop_demo_users", JSON.stringify(updated));
      localStorage.setItem("foodloop_demo_user", JSON.stringify(next));
    }

    setUser(next);
  }

  async function signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("foodloop_demo_user");
    }

    setUser(null);
  }

  return (
    <C.Provider
      value={{
        user,
        loading,
        mode: isSupabaseConfigured ? "live" : "demo",
        signIn,
        signUp,
        updateProfile,
        signOut
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useAuth() {
  const v = useContext(C);

  if (!v) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return v;
}
