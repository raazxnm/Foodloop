
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Leaf,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2
} from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { ModeNotice } from "@/components/ModeNotice";
import { useAuth } from "@/components/AuthProvider";
import {
  getDonations,
  requestDonation,
  getDonationRequests,
  updateDonationRequest
} from "@/lib/data";
import type { Donation, DonationRequest } from "@/lib/types";

function Content() {
  const { user, mode } = useAuth();

  const [rows, setRows] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const [donations, donationRequests] = await Promise.all([
        getDonations(user),
        getDonationRequests(user)
      ]);

      setRows(donations);
      setRequests(donationRequests);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load FoodLoop records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [user]);

  async function claim(id: string) {
    if (!user) return;

    setProcessing(id);
    setError("");
    setNotice("");

    try {
      await requestDonation(user, id);
      setNotice("Your request has been submitted successfully.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not request donation."
      );
    } finally {
      setProcessing(null);
    }
  }

  async function reviewRequest(
    id: string,
    status: "accepted" | "rejected"
  ) {
    if (!user) return;

    setProcessing(id);
    setError("");
    setNotice("");

    try {
      await updateDonationRequest(user, id, status);

      setNotice(
        status === "accepted"
          ? "Donation request accepted successfully."
          : "Donation request rejected."
      );

      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update the request."
      );
    } finally {
      setProcessing(null);
    }
  }

  const donor = user?.role === "donor";
  const ngo = user?.role === "ngo";

  return (
    <>
      <SiteHeader />
      <ModeNotice />

      <main className="dashboard container">
        <div className="dashboard-top">
          <div>
            <div className="eyebrow">YOUR FOODLOOP SPACE</div>

            <h1>Welcome, {user?.name.split(" ")[0]}.</h1>

            <p>
              {donor
                ? "Every responsible contribution can make a difference."
                : "Find suitable surplus food and help it reach your community."}
            </p>
          </div>

          <div className="dashboard-actions">
            <Link className="btn btn-outline" href="/profile">
              My profile
            </Link>

            <button className="btn btn-outline" onClick={load}>
              <RefreshCw size={14} />
              Refresh
            </button>

            {donor && (
              <Link className="btn btn-primary" href="/donations/new">
                <Plus size={15} />
                List surplus food
              </Link>
            )}
          </div>
        </div>

        <div className="dashboard-status">
          <span>
            <ShieldCheck size={17} />
          </span>

          <div>
            <b>Welcome to your FoodLoop community</b>

            <small>
              {mode === "live"
                ? "Your account is connected to FoodLoop's live authentication system."
                : "Your account is active in demo mode. Data is stored locally in this browser."}
            </small>
          </div>
        </div>

        {notice && <div className="form-success">{notice}</div>}
        {error && <div className="form-error">{error}</div>}

        {donor && (
          <>
            <div className="dashboard-section-title">
              <div>
                <h2>Incoming donation requests</h2>
                <p>Review requests submitted by NGOs for your food listings.</p>
              </div>

              <span className="count-pill">
                {requests.filter(x => x.status === "requested").length} pending
              </span>
            </div>

            {loading ? (
              <div className="empty-state">Loading requests…</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <Building2 size={28} />
                <h3>No requests yet.</h3>
                <p>
                  When an NGO requests one of your donations, its details will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="donation-grid">
                {requests.map(request => (
                  <article className="donation-card" key={request.id}>
                    <div className="donation-card-top">
                      <span className="status-chip">{request.status}</span>
                      <small>{request.id.slice(0, 18)}</small>
                    </div>

                    <h3>{request.ngo_name || "NGO member"}</h3>

                    <div className="donation-meta">
                      <span>
                        <MapPin size={14} />
                        {request.ngo_city || "Location unavailable"}
                      </span>

                      {request.ngo_phone && (
                        <span>
                          <Building2 size={14} />
                          {request.ngo_phone}
                        </span>
                      )}

                      <span>
                        <Clock3 size={14} />
                        {new Date(request.created_at).toLocaleString()}
                      </span>
                    </div>

                    {request.status === "requested" && (
                      <div className="dashboard-actions">
                        <button
                          className="btn btn-primary"
                          disabled={processing === request.id}
                          onClick={() =>
                            reviewRequest(request.id, "accepted")
                          }
                        >
                          <CheckCircle2 size={15} />
                          Accept
                        </button>

                        <button
                          className="btn btn-outline"
                          disabled={processing === request.id}
                          onClick={() =>
                            reviewRequest(request.id, "rejected")
                          }
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {ngo && (
          <>
            <div className="dashboard-section-title">
              <div>
                <h2>Your donation requests</h2>
                <p>Track the decisions on donations you&apos;ve requested.</p>
              </div>

              <span className="count-pill">
                {requests.length} requests
              </span>
            </div>

            {!loading && requests.length > 0 && (
              <div className="donation-grid">
                {requests.map(request => (
                  <article className="donation-card" key={request.id}>
                    <div className="donation-card-top">
                      <span className="status-chip">{request.status}</span>
                      <small>{request.id.slice(0, 18)}</small>
                    </div>

                    <h3>Donation request</h3>

                    <p>
                      Submitted on{" "}
                      {new Date(request.created_at).toLocaleString()}
                    </p>

                    <p>
                      {request.status === "requested"
                        ? "Waiting for the donor's decision."
                        : request.status === "accepted"
                          ? "The donor has accepted your request."
                          : "The donor has rejected your request."}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <Building2 size={28} />
                <h3>No requests submitted yet.</h3>
                <p>Your submitted donation requests will appear here.</p>
              </div>
            )}
          </>
        )}

        <div className="dashboard-section-title">
          <div>
            <h2>
              {donor ? "Your donations" : "Available food nearby"}
            </h2>

            <p>
              {donor
                ? "Track the surplus food you've listed."
                : "Browse listed donations."}
            </p>
          </div>

          <span className="count-pill">{rows.length} records</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading FoodLoop records…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <Leaf size={28} />

            <h3>
              {donor
                ? "Your first contribution starts here."
                : "No available donations right now."}
            </h3>

            <p>
              {donor
                ? "List eligible, unserved surplus food and connect with a distribution partner."
                : "Check back soon for suitable food listings."}
            </p>

            {donor && (
              <Link className="btn btn-primary" href="/donations/new">
                Create a donation
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        ) : (
          <div className="donation-grid">
            {rows.map(d => (
              <article className="donation-card" key={d.id}>
                <div className="donation-card-top">
                  <span className="status-chip">{d.status}</span>
                  <small>{d.id.slice(0, 18)}</small>
                </div>

                <h3>{d.title}</h3>

                <p>
                  {d.category} · {d.food_type.replace("_", " ")}
                </p>

                <div className="donation-meta">
                  <span>
                    <Leaf size={14} />
                    {d.quantity} {d.unit}
                  </span>

                  <span>
                    <MapPin size={14} />
                    {d.city}, {d.state}
                  </span>

                  <span>
                    <Clock3 size={14} />
                    Safe until {new Date(d.safe_until).toLocaleString()}
                  </span>
                </div>

                {d.notes && (
                  <p className="donation-notes">{d.notes}</p>
                )}

                {ngo && d.status === "listed" && (
                  <button
                    className="btn btn-primary full"
                    disabled={processing === d.id}
                    onClick={() => claim(d.id)}
                  >
                    {processing === d.id ? "Submitting…" : "Request this donation"}
                    <ArrowRight size={14} />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="prototype-note">
          <b>Account mode:</b>{" "}
          {mode === "live"
            ? "Live Supabase authentication."
            : "Local demo mode."}

          <b> Platform status:</b>{" "}
          Donation management and verification features are still under development.
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Content />
    </RequireAuth>
  );
}
