
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  UserRound,
  ShieldCheck,
  Building2,
  Globe
} from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { ModeNotice } from "@/components/ModeNotice";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function ProfileForm() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [bio, setBio] = useState(user?.bio || "");

  const [orgName, setOrgName] = useState(user?.organizationName || "");
const [orgType, setOrgType] = useState<
  "business" | "ngo" | "community_kitchen" | "event_organizer" | "individual"
>(user?.organizationType || "individual");
  const [address, setAddress] = useState(user?.address || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [website, setWebsite] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("pending");

  const [busy, setBusy] = useState(false);
  const [orgBusy, setOrgBusy] = useState(false);
  const [error, setError] = useState("");
  const [orgError, setOrgError] = useState("");
  const [success, setSuccess] = useState("");
  const [orgSuccess, setOrgSuccess] = useState("");
  const [loadingOrg, setLoadingOrg] = useState(true);

  useEffect(() => {
    async function loadOrganization() {
      if (!user || user.role === "volunteer") {
        setLoadingOrg(false);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setLoadingOrg(false);
        return;
      }

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) {
        setOrgError(error.message);
      } else if (data) {
        setOrgName(data.name || "");
        setOrgType(data.organization_type || "individual");
        setCity(data.city || user.city || "");
        setState(data.state || user.state || "");
        setAddress(data.address || "");
        setPhone(data.phone || user.phone || "");
        setContactEmail(data.contact_email || user.email || "");
        setWebsite(data.website || "");
        setRegistrationNumber(data.registration_number || "");
        setDescription(data.description || "");
        setVerificationStatus(data.verification_status || "pending");
      }

      setLoadingOrg(false);
    }

    loadOrganization();
  }, [user]);

  async function submitPersonal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({ name, phone, city, state, bio });
      setSuccess("Your personal profile has been updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update profile."
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitOrganization(e: React.FormEvent) {
    e.preventDefault();
    setOrgBusy(true);
    setOrgError("");
    setOrgSuccess("");

    try {
      if (!user) throw new Error("Please sign in again.");

      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Connect Supabase to save organisation details.");
      }

      const values = {
        name: orgName.trim(),
        organization_type: orgType,
        city: city.trim(),
        state: state.trim(),
        address: address.trim(),
        phone: phone.trim(),
        contact_email: contactEmail.trim(),
        website: website.trim() || null,
        registration_number: registrationNumber.trim() || null,
        description: description.trim() || null
      };

      if (!values.name || !values.city || !values.state) {
        throw new Error("Organisation name, city and state are required.");
      }

      const { data: existing, error: lookupError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing) {
        const { error } = await supabase
          .from("organizations")
          .update(values)
          .eq("owner_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("organizations")
          .insert({
            ...values,
            owner_id: user.id,
            verification_status: "pending"
          });

        if (error) throw error;
      }

      setOrgSuccess("Organisation information saved successfully.");
    } catch (err) {
      setOrgError(
        err instanceof Error
          ? err.message
          : "Could not save organisation information."
      );
    } finally {
      setOrgBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <ModeNotice />

      <main className="profile-page container">
        <Link href="/dashboard" className="back-link">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <div className="profile-heading">
          <div className="eyebrow">YOUR COMMUNITY IDENTITY</div>
          <h1>Your <em>profile.</em></h1>
          <p>
            Keep your details accurate so FoodLoop can coordinate with you
            responsibly.
          </p>
        </div>

        <div className="profile-layout">
          <aside className="profile-summary">
            <div className="profile-avatar">
              <UserRound size={34} />
            </div>

            <h2>{user?.name}</h2>

            <span className="profile-role">
              {user?.role === "ngo"
                ? "NGO / Community partner"
                : user?.role === "volunteer"
                ? "Volunteer"
                : "Donor"}
            </span>

            <p>{user?.email}</p>

            <div className="profile-status">
              <ShieldCheck size={17} />
              <span>
                <b>
                  {verificationStatus.charAt(0).toUpperCase() +
                    verificationStatus.slice(1)}
                </b>
                <small>Organisation verification status</small>
              </span>
            </div>

            {orgName && (
              <div className="profile-org">
                <b>{orgName}</b>
                <small>{orgType.replace(/_/g, " ")}</small>
              </div>
            )}

            <Link href="/dashboard" className="back-link">
              View dashboard <ArrowRight size={14} />
            </Link>
          </aside>

          <div className="profile-edit">
            <form onSubmit={submitPersonal}>
              <h2>Personal information</h2>

              <label>
                Full name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </label>

              <label>
                Email address
                <input value={user?.email || ""} disabled />
              </label>

              <label>
                Phone number
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  inputMode="tel"
                />
              </label>

              <div className="form-row">
                <label>
                  City
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                  />
                </label>

                <label>
                  State
                  <input
                    value={state}
                    onChange={e => setState(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                About you
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  placeholder="A short introduction..."
                />
              </label>

              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <button className="btn btn-primary full" disabled={busy}>
                {busy ? "Saving..." : "Save personal profile"}
                <ArrowRight size={15} />
              </button>
            </form>

            {user?.role !== "volunteer" && (
              <form onSubmit={submitOrganization} style={{ marginTop: 40 }}>
                <h2>
                  <Building2 size={20} /> Organisation information
                </h2>

                {loadingOrg ? (
                  <p>Loading organisation details...</p>
                ) : (
                  <>
                    <label>
                      Organisation name
                      <input
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        required
                      />
                    </label>

<select
  value={orgType}
  onChange={e => setOrgType(e.target.value as typeof orgType)}
  required
>
  <option value="ngo">NGO</option>
  <option value="business">Business</option>
  <option value="community_kitchen">Community Kitchen</option>
  <option value="event_organizer">Event Organiser</option>
  <option value="individual">Individual</option>
</select>

                    <label>
                      Organisation description
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe your organisation and its work..."
                      />
                    </label>

                    <label>
                      Registration number
                      <input
                        value={registrationNumber}
                        onChange={e => setRegistrationNumber(e.target.value)}
                        placeholder="Enter official registration number"
                      />
                    </label>

                    <label>
                      <Globe size={15} /> Website
                      <input
                        type="url"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://example.org"
                      />
                    </label>

                    <label>
                      Organisation address
                      <input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Complete address"
                      />
                    </label>

                    <label>
                      Contact email
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        required
                      />
                    </label>

                    {orgError && (
                      <div className="form-error">{orgError}</div>
                    )}

                    {orgSuccess && (
                      <div className="form-success">{orgSuccess}</div>
                    )}

                    <button
                      className="btn btn-primary full"
                      disabled={orgBusy}
                    >
                      {orgBusy ? "Saving..." : "Save organisation"}
                      <ArrowRight size={15} />
                    </button>
                  </>
                )}
              </form>
            )}

            {user?.role !== "volunteer" && (
              <div style={{ marginTop: 30 }}>
                <h2>
                  <ShieldCheck size={20} /> Verification
                </h2>

                <p>
                  Your current organisation verification status is{" "}
                  <b>{verificationStatus}</b>.
                </p>

                <Link href="/verification" className="btn btn-primary">
                  Open verification centre <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileForm />
    </RequireAuth>
  );
}
