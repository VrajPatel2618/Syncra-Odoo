"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Link2, ShieldCheck, Database, Search, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function BlockchainPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Verification Tab
  const [verifyRef, setVerifyRef] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Stock History Tab
  const [stockCode, setStockCode] = useState("");
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/blockchain/stats');
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const { data } = await api.post('/blockchain/verify', { reference: verifyRef, computedHash: verifyHash });
      setVerifyResult(data);
    } catch (e: any) {
      setVerifyResult({ error: e.response?.data?.error || e.message });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleStockSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockLoading(true);
    try {
      const { data } = await api.get(`/blockchain/stock-history?productCode=${stockCode}`);
      setStockHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setStockLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Blockchain Transparency" 
        description="Verify ERP records securely on the Polygon ledger"
        icon={Link2} 
      />

      {/* Stats Banner */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Database className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-stone-500 font-medium">On-Chain Records</p>
              <h3 className="text-2xl font-bold">{stats.totalRecords || '0'}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Link2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-stone-500 font-medium">Network</p>
              <h3 className="text-xl font-bold">{stats.network || 'Disabled'}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-stone-500 font-medium">ERP Contract</p>
              <h3 className="text-xs font-mono truncate w-40 text-stone-900">{stats.erpContract || 'None'}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500"/> Verify Record Integrity</h2>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Reference Number</label>
              <input required type="text" value={verifyRef} onChange={(e) => setVerifyRef(e.target.value)} placeholder="e.g. SO-2024-00001" className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Computed SHA-256 Hash</label>
              <input required type="text" value={verifyHash} onChange={(e) => setVerifyHash(e.target.value)} placeholder="Computed hash of the record data" className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm" />
            </div>
            <button disabled={verifyLoading} className="w-full py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50">
              {verifyLoading ? "Verifying..." : "Verify on Blockchain"}
            </button>
          </form>

          {verifyResult && (
            <div className={`mt-6 p-4 rounded-xl border ${verifyResult.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {verifyResult.error ? (
                <div className="flex items-center gap-2 text-red-700"><XCircle className="w-5 h-5"/> {verifyResult.error}</div>
              ) : (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-bold ${verifyResult.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                    {verifyResult.isValid ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                    {verifyResult.isValid ? 'Valid & Verified' : 'Invalid Hash Mismatch'}
                  </div>
                  <div className="text-xs font-mono break-all text-stone-600">On-Chain: {verifyResult.onChainHash}</div>
                  <div className="text-xs font-mono break-all text-stone-600">Computed: {verifyResult.computedHash}</div>
                  {verifyResult.polygonscanUrl && (
                    <a href={verifyResult.polygonscanUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm font-medium hover:underline inline-block mt-2">View Contract on Polygonscan &rarr;</a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock History Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-indigo-500"/> Product Stock History</h2>
          <form onSubmit={handleStockSearch} className="flex gap-3 mb-6">
            <input required type="text" value={stockCode} onChange={(e) => setStockCode(e.target.value)} placeholder="Product SKU (e.g. ELE-001)" className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <button disabled={stockLoading} className="px-6 py-2 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50">
              {stockLoading ? "Searching..." : "Search"}
            </button>
          </form>

          <div className="space-y-3">
            {stockHistory.length === 0 && !stockLoading ? (
               <p className="text-stone-500 text-sm text-center py-4">No on-chain stock history found.</p>
            ) : (
              stockHistory.map((h, i) => (
                <div key={i} className="p-4 border border-stone-100 rounded-xl bg-stone-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-stone-900">{h.moveType.toUpperCase()} - {h.moveReference}</span>
                    <span className="text-xs font-medium text-stone-500">{new Date(Number(h.timestamp) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-stone-600">Moved <strong className="text-indigo-600">{h.quantity} {h.uom}</strong></div>
                  <div className="text-xs text-stone-500 mt-1">From: {h.fromLocation} &rarr; To: {h.toLocation}</div>
                  <div className="text-[10px] text-stone-400 font-mono mt-2 truncate" title={h.dataHash}>{h.dataHash}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
