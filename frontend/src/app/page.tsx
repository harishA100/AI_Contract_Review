import Link from "next/link";
import { Shield, Sparkles, FileText, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden bg-slate-950 text-slate-50 min-h-screen">
      {/* Background radial gradients for premium depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px]" />
      
      <main className="max-w-6xl mx-auto px-6 py-20 relative z-10 w-full flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Gemini 1.5 Flash</span>
        </div>

        {/* Hero Header */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6 bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
          AI-Powered Contract Review <br className="hidden sm:inline" />
          Assistant for Fast Auditing
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed">
          Upload PDF contracts, automatically extract key clauses, identify obligations, and conduct AI risk audits in seconds. Save hours of manual review.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full justify-center max-w-md">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-lg shadow-indigo-600/25 transition-all text-center"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 font-semibold transition-all text-center"
          >
            Sign In
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl relative group overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Text Extraction</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              PyMuPDF parses PDF agreements locally, turning unstructured legal documents into clear readable text instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl relative group overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Gemini 1.5 Analysis</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Advanced LLM integration generates structured clause breakdowns, payment structures, and termination conditions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl relative group overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Legal Risk Audits</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Assigns a detailed numerical risk score, flags missing parameters, and outputs actionable contract mitigation advice.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>&copy; {new Date().getFullYear()} AI Contract Review Assistant. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
