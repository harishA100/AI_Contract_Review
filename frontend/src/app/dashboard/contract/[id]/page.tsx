"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Contract, Analysis } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, FileText, ShieldAlert, Calendar, CreditCard, 
  HelpCircle, AlertTriangle, CheckCircle2, ChevronRight, Loader2
} from "lucide-react";

export default function ContractDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "clauses" | "payments" | "termination" | "obligations" | "risks">("summary");

  // Fetch contract metadata
  const { data: contract, isLoading: contractLoading } = useQuery<Contract>({
    queryKey: ["contract", id],
    queryFn: async () => {
      const response = await api.get<Contract>(`/contracts/${id}`);
      return response.data;
    }
  });

  // Fetch analysis results
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useQuery<Analysis>({
    queryKey: ["analysis", id],
    queryFn: async () => {
      const response = await api.get<Analysis>(`/analyses/${id}`, {
        validateStatus: (status) => status === 200
      });
      return response.data;
    },
    // Don't retry immediately if still processing (FastAPI returns 202)
    retry: (failureCount, error: any) => {
      if (error.response?.status === 202) return false;
      return failureCount < 2;
    }
  });

  // Load PDF file securely as a blob to include Authorization header
  useEffect(() => {
    let objectUrl: string | null = null;
    
    async function loadPdf() {
      setPdfLoading(true);
      setPdfError(false);
      try {
        const response = await api.get(`/contracts/${id}/view`, {
          responseType: "blob"
        });
        const blob = new Blob([response.data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("Failed to load PDF file securely:", err);
        setPdfError(true);
      } finally {
        setPdfLoading(false);
      }
    }

    if (id) loadPdf();

    // Cleanup object URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  if (contractLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span>Loading contract analysis data...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Contract Not Found</h2>
        <Link href="/dashboard" className="text-indigo-400 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  // Determine risk level color scheme
  const getRiskColor = (score: number) => {
    if (score <= 25) return { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-950/20", ring: "stroke-emerald-500" };
    if (score <= 50) return { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-950/20", ring: "stroke-amber-500" };
    if (score <= 75) return { text: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-950/20", ring: "stroke-orange-500" };
    return { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-950/20", ring: "stroke-purple-500" };
  };

  const riskColors = analysis ? getRiskColor(analysis.risk_score) : { text: "text-slate-400", border: "border-slate-800", bg: "bg-slate-900/10", ring: "stroke-slate-800" };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      
      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 h-16 shrink-0 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-base truncate">{contract.title}</h1>
            <p className="text-xs text-slate-500 truncate">{contract.filename}</p>
          </div>
        </div>

        {analysis && (
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${riskColors.border} ${riskColors.bg}`}>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Risk Score</span>
            <span className={`font-bold text-sm ${riskColors.text}`}>{analysis.risk_score} / 100</span>
          </div>
        )}
      </header>

      {/* Main split dashboard */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        
        {/* Left pane: Secure PDF view */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-900 overflow-hidden relative bg-slate-900/10">
          {pdfLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500">Loading document securely...</span>
            </div>
          ) : pdfError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
              <span className="text-sm text-slate-400">Failed to render PDF view.</span>
              <p className="text-xs text-slate-600 max-w-xs">
                The document is securely processed, but your browser could not display it. You can still audit the analysis results on the right panel.
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-none"
              title="Secure PDF Viewer"
            />
          ) : null}
        </div>

        {/* Right pane: Analysis Results */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto flex flex-col min-h-0">
          {analysisLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500">Generating AI audit review details...</span>
            </div>
          ) : analysisError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <h3 className="font-bold text-lg">AI Analysis Unavailable</h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                {(analysisError as any).response?.status === 202 
                  ? "Gemini is still reviewing this contract. Please reload the page in a few seconds." 
                  : "An error occurred while compiling the AI audit. Please try uploading the document again."}
              </p>
              <button
                onClick={() => router.refresh()}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
              >
                Refresh Data
              </button>
            </div>
          ) : analysis ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Tab Navigation buttons */}
              <div className="flex border-b border-slate-900 overflow-x-auto bg-slate-950 shrink-0 sticky top-0 z-10">
                {(["summary", "clauses", "payments", "termination", "obligations", "risks"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === tab 
                        ? "border-indigo-500 text-indigo-400 bg-indigo-950/10" 
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    }`}
                  >
                    {tab === "risks" ? "Risk Assessment" : tab}
                  </button>
                ))}
              </div>

              {/* Tab content view */}
              <div className="flex-1 p-6 overflow-y-auto">
                
                {/* 1. SUMMARY TAB */}
                {activeTab === "summary" && (
                  <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
                        <FileText className="w-5 h-5" />
                        <span>Executive Summary</span>
                      </h3>
                      <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                        {analysis.summary}
                      </p>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Contract Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block">Status</span>
                          <span className="text-slate-300 font-medium capitalize mt-1 block">{contract.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Uploaded On</span>
                          <span className="text-slate-300 font-medium mt-1 block">
                            {new Date(contract.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. KEY CLAUSES TAB */}
                {activeTab === "clauses" && (
                  <div className="space-y-4">
                    {analysis.key_clauses.length === 0 ? (
                      <p className="text-slate-500 text-sm">No key clauses identified.</p>
                    ) : (
                      analysis.key_clauses.map((clause, idx) => (
                        <div key={idx} className="glass-panel p-5 rounded-2xl space-y-3">
                          <h4 className="font-bold text-base text-indigo-300">{clause.clause_name}</h4>
                          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs italic text-slate-400 whitespace-pre-wrap leading-relaxed">
                            &quot;{clause.text}&quot;
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {clause.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. PAYMENT TERMS TAB */}
                {activeTab === "payments" && (
                  <div className="space-y-4">
                    {analysis.payment_terms.length === 0 ? (
                      <p className="text-slate-500 text-sm">No payment terms identified.</p>
                    ) : (
                      analysis.payment_terms.map((term, idx) => (
                        <div key={idx} className="glass-panel p-5 rounded-2xl flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-200">{term.term}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                term.importance === "High" 
                                  ? "bg-red-950 text-red-400 border border-red-500/10" 
                                  : "bg-slate-900 text-slate-400 border border-slate-800"
                              }`}>
                                {term.importance}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{term.details}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. TERMINATION TAB */}
                {activeTab === "termination" && (
                  <div className="space-y-4">
                    {analysis.termination_conditions.length === 0 ? (
                      <p className="text-slate-500 text-sm">No termination conditions identified.</p>
                    ) : (
                      analysis.termination_conditions.map((cond, idx) => (
                        <div key={idx} className="glass-panel p-5 rounded-2xl flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-purple-950/20 border border-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-200">{cond.condition}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                cond.risk_level === "High" 
                                  ? "bg-red-950 text-red-400 border border-red-500/10" 
                                  : "bg-slate-900 text-slate-400 border border-slate-800"
                              }`}>
                                {cond.risk_level} Risk
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{cond.details}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. OBLIGATIONS TAB */}
                {activeTab === "obligations" && (
                  <div className="space-y-4">
                    {analysis.obligations.length === 0 ? (
                      <p className="text-slate-500 text-sm">No specific obligations identified.</p>
                    ) : (
                      analysis.obligations.map((ob, idx) => (
                        <div key={idx} className="glass-panel p-5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                              Party: {ob.party}
                            </span>
                            <span className="text-xs text-slate-500">
                              Deadline: {ob.deadline}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {ob.duty}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 6. RISK ASSESSMENT TAB */}
                {activeTab === "risks" && (
                  <div className="space-y-5">
                    {/* Visual Risk Score display */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                      {/* SVG Circle Progress */}
                      <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className="stroke-slate-800 fill-none"
                            strokeWidth="8"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className={`fill-none ${riskColors.ring}`}
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysis.risk_score / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold">{analysis.risk_score}</span>
                          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Rating</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="font-bold text-lg">AI Risk Audit Summary</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Gemini analyzed contract liabilities, indemnification terms, and warranties to assign this rating. Audit details are shown below.
                        </p>
                      </div>
                    </div>

                    {/* Detailed Risks list */}
                    <div className="space-y-4">
                      {analysis.risk_assessment.length === 0 ? (
                        <p className="text-slate-500 text-sm">No specific risks highlighted.</p>
                      ) : (
                        analysis.risk_assessment.map((r, idx) => {
                          const isHigh = r.severity === "Critical" || r.severity === "High";
                          return (
                            <div 
                              key={idx} 
                              className={`glass-panel p-5 rounded-2xl border-l-4 ${
                                isHigh ? "border-l-purple-500" : "border-l-amber-500"
                              } space-y-3`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                  isHigh ? "text-purple-400" : "text-amber-400"
                                }`}>
                                  <ShieldAlert className="w-4 h-4" />
                                  <span>{r.severity} Severity Risk</span>
                                </span>
                              </div>
                              
                              <p className="text-slate-200 text-sm font-medium leading-relaxed">
                                {r.risk}
                              </p>
                              
                              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  Mitigation / Negotiation Strategy
                                </span>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                  {r.mitigation}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
