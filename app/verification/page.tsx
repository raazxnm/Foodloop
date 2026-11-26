
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { ModeNotice } from "@/components/ModeNotice";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function VerificationContent() {
  const { user } = useAuth();

  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState("");
  const [documentPath, setDocumentPath] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadVerification() {
      if (!user || user.role === "volunteer") {
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase connection is required for verification.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("organizations")
        .select(
          "id, verification_status, verification_document_path, verification_rejection_reason"
        )
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else if (data) {
        setStatus(data.verification_status);
        setDocumentPath(data.verification_document_path || "");
        setReason(data.verification_rejection_reason || "");
      } else {
        setError("Please complete and save your organisation profile first.");
      }

      setLoading(false);
    }

    loadVerification();
  }, [user]);

async function submitApplication(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !supabase) {
      setError("Please sign in and connect Supabase.");
      return;
    }

    if (!file && !documentPath) {
      setError("Please select a verification document.");
      return;
    }

    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPG and PNG files are allowed.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File size must not exceed 5 MB.");
        return;
      }
    }

    setBusy(true);

    try {
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id, verification_status")
        .eq("owner_id", user.id)
        .single();

      if (orgError) throw orgError;

      if (organization.verification_status === "verified") {
        throw new Error("Your organisation is already verified.");
      }

      let path = documentPath;

      if (file) {
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!extension) {
          throw new Error("Invalid file name.");
        }

        path = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("verification-documents")
          .upload(path, file, {
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;
      }

      const { error: updateError } = await supabase.rpc(
        "submit_verification_application",
        { p_document_path: path }
      );

      if (updateError) throw updateError;

      setDocumentPath(path);
      setFile(null);
      setStatus("pending");
      setReason("");
      setSuccess("Your verification application has been submitted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit verification application."
      );
    } finally {
      setBusy(false);
    }
  }

  const statusColor =
    status === "verified"
      ? "verified"
      : status === "rejected" || status === "suspended"
      ? "rejected"
      : "pending";

  return (
    <>
      <SiteHeader />
      <ModeNotice />

      <main className="container profile-page">
        <Link href="/profile" className="back-link">
          <ArrowLeft size={14} /> Back to profile
        </Link>

        <div className="profile-heading">
          <div className="eyebrow">TRUST AND ACCOUNTABILITY</div>
          <h1>Verification <em>centre.</em></h1>
          <p>
            Submit official documents to establish your organisation&apos;s
            identity and build trust within FoodLoop.
          </p>
        </div>

        {user?.role === "volunteer" ? (
          <div className="form-error">
            Organisation verification is not available for volunteer accounts.
          </div>
        ) : loading ? (
          <p>Loading verification details...</p>
        ) : (
          <div className="profile-edit">
            <div className="profile-status">
              <ShieldCheck size={22} />
              <span>
                <b>Verification status</b>
                <small className={statusColor}>
                  {status.toUpperCase()}
                </small>
              </span>
            </div>

            {status === "verified" && (
              <div className="form-success">
                <CheckCircle2 size={18} />
                Your organisation has been verified.
              </div>
            )}

            {status === "pending" && (
              <div className="profile-status">
                <Clock size={18} />
                <span>
                  <b>Application pending</b>
                  <small>Your application is awaiting admin review.</small>
                </span>
              </div>
            )}

            {status === "rejected" && (
              <div className="form-error">
                <AlertCircle size={18} />
                <span>
                  <b>Application rejected</b>
                  <small>{reason || "Please review your details and resubmit."}</small>
                </span>
              </div>
            )}

            {status === "suspended" && (
              <div className="form-error">
                Your organisation&apos;s verification has been suspended.
                Contact FoodLoop administration for assistance.
              </div>
            )}

            <form onSubmit={submitApplication} style={{ marginTop: 30 }}>
              <h2>Verification documents</h2>

              <p>
                Upload a valid organisation registration certificate or
                another official supporting document.
              </p>

              <label className="upload-area">
                <Upload size={28} />
                <b>{file ? file.name : "Choose verification document"}</b>
                <small>PDF, JPG or PNG · Maximum 5 MB</small>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  required={!documentPath}
                />
              </label>

              {documentPath && (
                <div className="profile-status">
                  <FileText size={18} />
                  <span>
                    <b>Document uploaded</b>
                    <small>Existing document attached to your application.</small>
                  </span>
                </div>
              )}

              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              {status !== "verified" && status !== "suspended" && (
                <button
                  className="btn btn-primary full"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Submitting..." : "Submit for verification"}
                  <ArrowRight size={15} />
                </button>
              )}
            </form>
          </div>
        )}
      </main>
    </>
  );
}

export default function VerificationPage() {
  return (
    <RequireAuth>
      <VerificationContent />
    </RequireAuth>
  );
}
