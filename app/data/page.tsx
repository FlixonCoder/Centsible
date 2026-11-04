"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle,
  Building2,
  CreditCard,
  Layers,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatINR } from "@/lib/format";

export default function DataConsentPage() {
  const [sources, setSources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const fetchData = () => {
    fetch("/api/data/sources")
      .then((res) => res.json())
      .then((json) => {
        setSources(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/data/simulate-sync", { method: "POST" });
      const data = await res.json();
      setSyncMessage(data.message || "Synced successfully");
      fetchData();
    } catch {
      setSyncMessage("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    try {
      await fetch(`/api/consent/${consentId}/revoke`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm("Are you sure you want to delete your decisions and custom rules under DPDP rights?")) return;
    try {
      await fetch("/api/account", { method: "DELETE" });
      alert("Custom decision snapshots and plan actions deleted successfully.");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !sources) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const { accounts, consentRecords } = sources;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white border border-[#E8EAF3] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DPDP & Account Aggregator</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1E1B4B]">
            Data Sources & Consent Controls
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            You own your financial data. In compliance with DPDP 2025/2026 rules, you can review purposes, revoke consent anytime, or export your full history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleSimulateSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] disabled:opacity-50 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Simulating AA Sync..." : "Simulate AA Refresh"}</span>
          </button>

          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON (DPDP)</span>
          </a>
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Connected Accounts</h3>
            <p className="text-xs text-slate-500">
              Fetched via simulated Account Aggregator (Setu/Finvu architecture)
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {accounts.length} linked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc: any) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl border border-slate-200/80 bg-[#FAFBFC] space-y-2 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {acc.type.replace(/_/g, " ")}
                </span>
                <span className="text-[10.5px] text-slate-400 font-mono">
                  {acc.mask ? `••• ${acc.mask}` : ""}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1E1B4B]">{acc.name}</h4>
                <p className="text-xs text-slate-500">{acc.institution}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="font-mono font-bold text-[#1E1B4B]">
                  {acc.balance !== null ? `Balance: ${formatINR(acc.balance)}` : `Outstanding: ${formatINR(acc.outstanding || 0)}`}
                </span>
                <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Synced
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consent Records Table */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Active Consent Records</h3>
            <p className="text-xs text-slate-500">
              Granular purpose and duration records stored per DPDP compliance guidelines
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {consentRecords.map((cr: any) => {
            const isRevoked = Boolean(cr.revokedAt);

            return (
              <div
                key={cr.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isRevoked
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-[#FAFBFC] border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E1B4B]">{cr.purpose}</span>
                    {isRevoked ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        Revoked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Data types: <span className="font-mono text-slate-700">{cr.dataTypes}</span> · Valid: {cr.fromDate} to {cr.toDate}
                  </p>
                </div>

                {!isRevoked && (
                  <button
                    onClick={() => handleRevokeConsent(cr.id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors shrink-0"
                  >
                    Revoke Consent
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* DPDP Delete Account Section */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Danger Zone · DPDP Right to Erasure
            </h4>
            <p className="text-xs text-slate-500">
              Permanently wipe decisions, plan actions, and custom rules from local SQLite storage.
            </p>
          </div>

          <button
            onClick={handleDeleteData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete My Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

