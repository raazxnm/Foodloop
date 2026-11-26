
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AppUser, Donation, DonationRequest } from "@/lib/types";

const KEY = "foodloop_demo_donations";
const REQUEST_KEY = "foodloop_demo_requests";

const seed: Donation[] = [
  {
    id: "FL-DEMO-1001",
    donor_id: "demo-kitchen",
    title: "Fresh vegetarian lunch packs",
    category: "Prepared meals",
    food_type: "vegetarian",
    quantity: 25,
    unit: "meals",
    prepared_at: new Date(Date.now() - 1800000).toISOString(),
    safe_until: new Date(Date.now() + 10800000).toISOString(),
    pickup_address: "Saheed Nagar, near community hall",
    city: "Bhubaneswar",
    state: "Odisha",
    notes: "Sealed containers. Please bring insulated transport.",
    status: "listed",
    created_at: new Date().toISOString(),
    donor_name: "Demo Kitchen (sample)"
  },
  {
    id: "FL-DEMO-1002",
    donor_id: "demo-bakery",
    title: "Unserved bakery bread and buns",
    category: "Bakery",
    food_type: "vegetarian",
    quantity: 40,
    unit: "pieces",
    prepared_at: new Date(Date.now() - 3600000).toISOString(),
    safe_until: new Date(Date.now() + 14400000).toISOString(),
    pickup_address: "Unit 4 Market",
    city: "Bhubaneswar",
    state: "Odisha",
    notes: "Unserved items, packed for pickup.",
    status: "listed",
    created_at: new Date().toISOString(),
    donor_name: "Demo Bakery (sample)"
  }
];

function read(): Donation[] {
  const raw = localStorage.getItem(KEY);

  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function write(rows: Donation[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function readRequests(): DonationRequest[] {
  try {
    return JSON.parse(localStorage.getItem(REQUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeRequests(rows: DonationRequest[]) {
  localStorage.setItem(REQUEST_KEY, JSON.stringify(rows));
}

export async function getDonations(user: AppUser): Promise<Donation[]> {
  if (user.role === "volunteer") return [];

  if (isSupabaseConfigured && supabase) {
    let q = supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    q = user.role === "donor"
      ? q.eq("donor_id", user.id)
      : q.eq("status", "listed");

    const { data, error } = await q;

    if (error) throw error;

    return (data || []) as Donation[];
  }

  const all = read();

  return user.role === "donor"
    ? all.filter(x => x.donor_id === user.id)
    : all.filter(x => x.status === "listed");
}

export async function createDonation(
  user: AppUser,
  input: Omit<Donation, "id" | "donor_id" | "status" | "created_at" | "donor_name">
) {
  if (new Date(input.safe_until).getTime() <= Date.now()) {
    throw new Error("Safe consumption deadline must be in the future.");
  }

  if (new Date(input.prepared_at).getTime() > Date.now()) {
    throw new Error("Preparation time cannot be in the future.");
  }

  if (input.quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("donations").insert({
      ...input,
      donor_id: user.id,
      status: "listed"
    });

    if (error) throw error;
    return;
  }

  const rows = read();

  rows.unshift({
    ...input,
    id: `FL-DEMO-${Date.now()}`,
    donor_id: user.id,
    status: "listed",
    created_at: new Date().toISOString(),
    donor_name: user.name
  });

  write(rows);
}

export async function requestDonation(user: AppUser, id: string) {
  if (user.role !== "ngo") {
    throw new Error("Only NGO accounts can request donations.");
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("donation_claims").insert({
      donation_id: id,
      ngo_id: user.id,
      status: "requested"
    });

    if (error) throw error;
    return;
  }

  const rows = read();
  const donation = rows.find(x => x.id === id);

  if (!donation || donation.status !== "listed") {
    throw new Error("This donation is no longer available.");
  }

  const requests = readRequests();

  if (requests.some(x => x.donation_id === id && x.ngo_id === user.id)) {
    throw new Error("You have already requested this donation.");
  }

  requests.unshift({
    id: `FL-REQ-${Date.now()}`,
    donation_id: id,
    ngo_id: user.id,
    status: "requested",
    created_at: new Date().toISOString(),
    ngo_name: user.organizationName || user.name,
    ngo_city: user.city,
    ngo_phone: user.phone
  });

  writeRequests(requests);
}

export async function getDonationRequests(
  user: AppUser
): Promise<DonationRequest[]> {
  if (user.role === "volunteer") return [];

  if (isSupabaseConfigured && supabase) {
    type ClaimRecord = {
  id: string;
  donation_id: string;
  ngo_id: string;
  status: "requested" | "accepted" | "rejected";
  created_at: string;
};

let claims: ClaimRecord[] = [];

    if (user.role === "donor") {
      const { data: donations, error: donationError } = await supabase
        .from("donations")
        .select("id")
        .eq("donor_id", user.id);

      if (donationError) throw donationError;

      const donationIds = (donations || []).map(x => x.id);

      if (donationIds.length === 0) return [];

      const { data, error } = await supabase
        .from("donation_claims")
        .select("*")
        .in("donation_id", donationIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      claims = data || [];
    } else {
      const { data, error } = await supabase
        .from("donation_claims")
        .select("*")
        .eq("ngo_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      claims = data || [];
    }

    if (claims.length === 0) return [];

    const ngoIds = [...new Set(claims.map(x => x.ngo_id))];

    const [{ data: profiles, error: profileError }, { data: organizations, error: orgError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,phone,city")
          .in("id", ngoIds),

        supabase
          .from("organizations")
          .select("owner_id,name")
          .in("owner_id", ngoIds)
      ]);

    if (profileError) throw profileError;
    if (orgError) throw orgError;

    return claims.map(claim => {
      const profile = profiles?.find(x => x.id === claim.ngo_id);
      const organization = organizations?.find(x => x.owner_id === claim.ngo_id);

      return {
        ...claim,
        ngo_name: organization?.name || profile?.full_name || "NGO member",
        ngo_city: profile?.city || "",
        ngo_phone: profile?.phone || ""
      };
    }) as DonationRequest[];
  }

  const requests = readRequests();

  return user.role === "donor"
    ? requests.filter(request =>
        read().some(
          donation =>
            donation.id === request.donation_id &&
            donation.donor_id === user.id
        )
      )
    : requests.filter(request => request.ngo_id === user.id);
}


export async function updateDonationRequest(
  user: AppUser,
  requestId: string,
  status: "accepted" | "rejected"
) {
  if (user.role !== "donor") {
    throw new Error("Only donors can approve or reject requests.");
  }

  if (isSupabaseConfigured && supabase) {
    if (status === "accepted") {
      const { error } = await supabase.rpc(
        "accept_donation_request",
        { p_request_id: requestId }
      );

      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from("donation_claims")
      .update({ status: "rejected" })
      .eq("id", requestId)
      .eq("status", "requested");

    if (error) throw error;
    return;
  }

  const requests = readRequests();
  const request = requests.find(x => x.id === requestId);

  if (!request || request.status !== "requested") {
    throw new Error("This request is no longer pending.");
  }

  const donations = read();
  const donation = donations.find(x => x.id === request.donation_id);

  if (!donation || donation.donor_id !== user.id) {
    throw new Error("You cannot update this request.");
  }

  if (status === "accepted") {
    if (donation.status !== "listed") {
      throw new Error("This donation is no longer available.");
    }

    if (new Date(donation.safe_until).getTime() <= Date.now()) {
      throw new Error("This donation has expired.");
    }

    donation.status = "accepted";

    requests.forEach(item => {
      if (
        item.donation_id === donation.id &&
        item.status === "requested"
      ) {
        item.status = item.id === requestId ? "accepted" : "rejected";
      }
    });

    write(donations);
  } else {
    request.status = "rejected";
  }

  writeRequests(requests);
}
