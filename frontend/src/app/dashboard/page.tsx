"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Contract } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, LogOut, Plus, Trash2, ShieldAlert, CheckCircle, 
  RefreshCw, AlertCircle, FilePlus, Loader2, ArrowRight, BarChart3
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch contracts
  // Poll every 4 seconds if any contract is in 'uploaded' or 'processing' status
  const { data: contracts = [], isLoading, error: queryError } = useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: async () => {
      const response = await api.get<Contract[]>("/contracts");
      return response.data;
    },
    refetchInterval: (query) => {
      const list = query.state.data as Contract[] | undefined;
      const hasPending = list?.some(c => c.status === "uploaded" || c.status === "processing");
      return hasPending ? 4000 : false;
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<Contract>("/contracts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadFile(null);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.detail || "Failed to upload contract. Please try again.");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || "Failed to delete contract.");
    }
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadTitle.trim()) {
      setUploadError("Please provide a contract title.");
      return;
    }
    if (!uploadFile) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }
    if (!uploadFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadError("Only PDF files are supported.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);
    uploadMutation.mutate(formData);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This will permanently erase the contract and all its generated reviews.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Helper calculations for Stats
  const totalContracts = contracts.length;
  const analyzedContracts = contracts.filter(c => c.status === "analyzed").length;
  const processingContracts = contracts.filter(c => c.status === "processing" || c.status === "uploaded").length;
  
  // Calculate average risk score
  // Assuming average of analyzed contracts
  const analyzedWithScore = contracts.filter(c => c.status === "analyzed");
  // We don't have the risk score directly in the contract model schema, 
  // but wait! We can fetch or mock average. Let's calculate if available, 
  // or since contract details has analysis inside we can support it, or keep it standard.
  // Wait! In our SQLAlchemy model, the contract has a relationship to analysis, 
  // but the Contract schema itself doesn't contain risk_score.
  // Let's check: can we return the risk_score directly from backend inside ContractResponse?
  // Ah, the ContractResponse Pydantic schema in contract.py has:
  // title, filename, file_path, status, user_id, id, created_at, updated_at.
  // But wait, it's very helpful if we expose risk_score or if we query it.
  // Let's assume we can fetch the analysis or we can query or display it.
  // Wait, let's keep the average risk score mock or just count total risks, or fetch them.
  // Actually, we can count total files. Let's show:
  // 1. Total Contracts
  // 2. Analyzed Files
  // 3. Pending Reviews
  // 4. System Status ("Active")

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ContractReview
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-200">{user?.full_name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-500/30 hover:bg-red-950/20 text-slate-400 hover:text-red-400 text-sm transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1 flex flex-col gap-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage and audit your legal PDF contracts</p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Upload Contract</span>
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Contracts</span>
              <span className="text-3xl font-bold mt-2 block">{totalContracts}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Analyzed</span>
              <span className="text-3xl font-bold text-emerald-400 mt-2 block">{analyzedContracts}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/20 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Under Review</span>
              <span className="text-3xl font-bold text-blue-400 mt-2 block">{processingContracts}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-950/20 flex items-center justify-center text-blue-400 border border-blue-500/10">
              <RefreshCw className={`w-6 h-6 ${processingContracts > 0 ? "animate-spin" : ""}`} />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">System Status</span>
              <span className="text-xl font-bold text-indigo-400 mt-3.5 block flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-950/20 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Contracts List Section */}
        <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col min-h-[300px]">
          <div className="px-6 py-5 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
            <h2 className="font-bold text-lg">My Contracts</h2>
            {processingContracts > 0 && (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5 bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-500/10">
                <Loader2 className="w-3 h-3 animate-spin" />
                Auto-updating list...
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-slate-400 text-sm">Loading contracts list...</span>
            </div>
          ) : queryError ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm">Failed to load contracts.</span>
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-6">
                <FilePlus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-1">No contracts uploaded yet</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                Get started by uploading your first PDF contract to generate an AI-driven review.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 font-semibold text-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload PDF</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/10">
                    <th className="px-6 py-4">Contract Title</th>
                    <th className="px-6 py-4">Original File</th>
                    <th className="px-6 py-4">Date Uploaded</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{contract.title}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {contract.filename}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(contract.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {contract.status === "uploaded" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            Uploaded
                          </span>
                        )}
                        {contract.status === "processing" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/60 text-blue-400 border border-blue-500/20">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing
                          </span>
                        )}
                        {contract.status === "analyzed" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                            Ready
                          </span>
                        )}
                        {contract.status === "failed" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/60 text-red-400 border border-red-500/20">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {contract.status === "analyzed" ? (
                            <Link
                              href={`/dashboard/contract/${contract.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold border border-indigo-500/10 hover:border-indigo-500 transition-all"
                            >
                              <span>View Review</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-600 text-xs font-semibold border border-slate-800 cursor-not-allowed"
                            >
                              <span>Processing</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(contract.id, contract.title)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-red-500/20 hover:bg-red-950/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete Contract"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Upload Dialog Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => {
              if (!uploadMutation.isPending) setIsUploadOpen(false);
            }}
          />
          
          {/* Dialog content */}
          <div className="glass-panel w-full max-w-md rounded-2xl relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-900 bg-slate-900/10 flex items-center justify-between">
              <h3 className="font-bold text-lg">Upload PDF Contract</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Contract Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-sm placeholder-slate-600 outline-none transition-all"
                  placeholder="e.g. Consulting Agreement 2026"
                  disabled={uploadMutation.isPending}
                  required
                />
              </div>

              {/* File input */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  PDF File
                </label>
                <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadMutation.isPending}
                    required
                  />
                  <FilePlus className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <span className="text-slate-300 text-sm block font-medium">
                    {uploadFile ? uploadFile.name : "Select or drag PDF file"}
                  </span>
                  <span className="text-slate-500 text-xs mt-1 block">
                    PDF format only (Max 10MB)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploadMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload & Analyze</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
