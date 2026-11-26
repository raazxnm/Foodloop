
export type UserRole = "donor" | "ngo" | "volunteer";

export type OrganizationType =
  | "business"
  | "ngo"
  | "community_kitchen"
  | "event_organizer"
  | "individual";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  state?: string;
  bio?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  address?: string;
};

export type ProfileInput = {
  name: string;
  phone: string;
  city: string;
  state: string;
  bio: string;
};

export type SignUpInput = ProfileInput & {
  email: string;
  password: string;
  role: UserRole;
  organizationName: string;
  organizationType: OrganizationType;
  address: string;
};

export type Donation = {
  id: string;
  donor_id: string;
  title: string;
  category: string;
  food_type: "vegetarian" | "non_vegetarian" | "vegan";
  quantity: number;
  unit: string;
  prepared_at: string;
  safe_until: string;
  pickup_address: string;
  city: string;
  state: string;
  notes: string;
  status:
    | "listed"
    | "requested"
    | "accepted"
    | "collected"
    | "distributed"
    | "expired"
    | "cancelled";
  created_at: string;
  donor_name?: string;
};

export type DonationRequest = {
  id: string;
  donation_id: string;
  ngo_id: string;
  status: "requested" | "accepted" | "rejected";
  created_at: string;
  ngo_name?: string;
  ngo_city?: string;
  ngo_phone?: string;
};
