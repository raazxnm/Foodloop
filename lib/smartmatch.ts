
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Donation } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_SMARTMATCH_API_URL;

export type SmartMatchResult = {
  organization_id: string;
  organization_name: string;
  match_score: number;
  reasons: string[];
};

type SmartMatchOrganization = {
  id: string;
  name: string;
  organization_type: string;
  city: string;
  state: string;
  verification_status: string;
};

export async function getSmartMatches(donation: Donation) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SmartMatch requires a live Supabase connection.");
  }

  if (!API_URL) {
    throw new Error("SmartMatch API URL is not configured.");
  }

  const { data: organizations, error } = await supabase.rpc(
    "get_verified_smartmatch_organizations"
  );

  if (error) throw error;

  const eligibleOrganizations = (organizations || []) as SmartMatchOrganization[];

  const response = await fetch(`${API_URL}/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      donation: {
        id: donation.id,
        city: donation.city,
        state: donation.state,
        food_type: donation.food_type,
        quantity: donation.quantity,
        safe_until: donation.safe_until
      },
      organizations: eligibleOrganizations
    })
  });

  if (!response.ok) {
    throw new Error("SmartMatch could not generate recommendations.");
  }

  const result = await response.json();

  return result.recommendations as SmartMatchResult[];
}
