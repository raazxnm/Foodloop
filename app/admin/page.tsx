
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  Ban,
  ExternalLink
} from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Organization = {
  id: string;
  owner_id: string;
  name: string;
  organization_type: string;
  city: string;
  state: string;
  address: string | null;
  phone: string;
  contact_email: string;
  description: string | null;
  registration_number: string | null;
  verification_status: string;
  verification_document_path: string | null;
  verification_submitted_at: string | null;
  verification_rejection_reason: string | null;
  created_at: string;
};

type Filter = "all" | "pending" | "verified" | "rejected" | "suspended";

function AdminContent() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const loadOrganizations = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: admin, error: adminError } = await supabase.rpc(
      "is_foodloop_admin"
    );

    if (adminError || !admin) {
      setIsAdmin(false);
      setError("Access denied. Administrator privileges are required.");
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    let query = supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("verification_status", filter);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setOrganizations((data || []) as Organization[]);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  async function reviewOrganization(
    organizationId: string,
    decision: "verified" | "rejected" | "suspended"
  ) {
    if (!supabase) return;

    const reason = reasons[organizationId]?.trim() || "";

    if (decision === "rejected" && !reason) {
      setError("Please enter a rejection reason.");
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to ${decision} this organisation?`
    );

    if (!confirmation) return;

    setProcessing(organizationId);
    setError("");
    setMessage("");

    const { error: reviewError } = await supabase.rpc(
      "review_verification_application",
      {
        p_organization_id: organizationId,
        p_decision: decision,
        p_rejection_reason: decision === "rejected" ? reason : null
      }
    );

    if (reviewError) {
      setError(reviewError.message);
    } else {
      setMessage(`Organisation successfully marked as ${decision}.`);
      setReasons(previous => ({
        ...previous,
        [organizationId]: ""
      }));
      await loadOrganizations();
    }

    setProcessing("");
  }

  async function openDocument(path: string) {
    if (!supabase) return;

    setError("");

    const { data, error: documentError } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(path, 60);

    if (documentError) {
      setError(documentError.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const counts = {
    all: organizations.length,
    pending: organizations.filter(x => x.verification_status === "pending").length,
    verified: organizations.filter(x => x.verification_status === "verified").length,
    rejected: organizations.filter(x => x.verification_status === "rejected").length,
    suspended: organizations.filter(x => x.verification_status === "suspended").length
  };

  return (
    <>
      <SiteHeader />

      <main className="container profile-page">
        <Link href="/dashboard" className="back-link">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <div className="profile-heading">
          <div className="eyebrow">FOODLOOP CONTROL CENTRE</div>
          <h1>Admin <em>dashboard.</em></h1>
          <p>Manage organisation verification and platform trust.</p>
        </div>

        {!isAdmin && !loading ? (
          <div className="form-error">
            <ShieldCheck size={20} />
            {error || "You are not authorised to access this page."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "All organisations", value: counts.all },
                { label: "Pending", value: counts.pending },
                { label: "Verified", value: counts.verified },
                { label: "Rejected", value: counts.rejected }
              ].map(item => (
                <div className="profile-summary" key={item.label}>
                  <Building2 size={22} />
                  <p>{item.label}</p>
                  <h2>{item.value}</h2>
                </div>
              ))}
            </div>

            <div className="profile-edit" style={{ marginTop: 30 }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2>
                  <ShieldCheck size={20} /> Organisation applications
                </h2>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={loadOrganizations}
                  disabled={loading}
                >
                  <RefreshCw size={15} />
                  Refresh
                </button>
              </div>

              <div className="flex flex-wrap gap-2" style={{ marginTop: 20 }}>
                {(
                  ["all", "pending", "verified", "rejected", "suspended"] as Filter[]
                ).map(item => (
                  <button
                    key={item}
                    type="button"
                    className={`btn ${filter === item ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setFilter(item)}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>

              {error && (
                <div className="form-error" style={{ marginTop: 20 }}>
                  {error}
                </div>
              )}

              {message && (
                <div className="form-success" style={{ marginTop: 20 }}>
                  {message}
                </div>
              )}

              {loading ? (
                <p style={{ marginTop: 25 }}>Loading organisations...</p>
              ) : organizations.length === 0 ? (
                <p style={{ marginTop: 25 }}>
                  No organisations found in this category.
                </p>
              ) : (
                <div className="flex flex-col gap-5" style={{ marginTop: 25 }}>
                  {organizations.map(org => (
                    <div
                      key={org.id}
                      className="profile-summary"
                      style={{ width: "100%" }}
                    >
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h2>{org.name}</h2>
                          <p>{org.organization_type.replace(/_/g, " ")}</p>
                          <p>{org.city}, {org.state}</p>
                        </div>

                        <span className="profile-role">
                          {org.verification_status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ marginTop: 15 }}>
                        <p><b>Contact:</b> {org.contact_email}</p>
                        <p><b>Phone:</b> {org.phone}</p>
                        <p><b>Registration:</b> {org.registration_number || "Not provided"}</p>
                        <p><b>Address:</b> {org.address || "Not provided"}</p>
                        <p><b>Description:</b> {org.description || "Not provided"}</p>
                        <p>
                          <b>Submitted:</b>{" "}
                          {org.verification_submitted_at
                            ? new Date(org.verification_submitted_at).toLocaleString()
                            : "Not submitted"}
                        </p>
                      </div>

                      {org.verification_document_path && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ marginTop: 15 }}
                          onClick={() => openDocument(org.verification_document_path!)}
                        >
                          <FileText size={16} />
                          View verification document
                          <ExternalLink size={14} />
                        </button>
                      )}

                      {org.verification_rejection_reason && (
                        <p style={{ marginTop: 15 }}>
                          <b>Previous rejection reason:</b>{" "}
                          {org.verification_rejection_reason}
                        </p>
                      )}

                      {org.verification_status !== "verified" &&
                        org.verification_status !== "suspended" && (
                          <div style={{ marginTop: 20 }}>
                            <label>
                              Rejection reason
                              <textarea
                                rows={2}
                                value={reasons[org.id] || ""}
                                onChange={e =>
                                  setReasons(previous => ({
                                    ...previous,
                                    [org.id]: e.target.value
                                  }))
                                }
                                placeholder="Required when rejecting an application"
                              />
                            </label>

                            <div className="flex flex-wrap gap-2" style={{ marginTop: 15 }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                disabled={processing === org.id}
                                onClick={() =>
                                  reviewOrganization(org.id, "verified")
                                }
                              >
                                <CheckCircle2 size={15} />
                                Approve
                              </button>

                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={processing === org.id}
                                onClick={() =>
                                  reviewOrganization(org.id, "rejected")
                                }
                              >
                                <XCircle size={15} />
                                Reject
                              </button>
                            </div>
                          </div>
                        )}

                      {org.verification_status === "verified" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ marginTop: 15 }}
                          disabled={processing === org.id}
                          onClick={() =>
                            reviewOrganization(org.id, "suspended")
                          }
                        >
                          <Ban size={15} />
                          Suspend organisation
                        </button>
                      )}

                      {processing === org.id && (
                        <p style={{ marginTop: 12 }}>Processing...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminContent />
    </RequireAuth>
  );
}
