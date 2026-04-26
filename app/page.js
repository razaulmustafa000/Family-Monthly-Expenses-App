"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  History, 
  FileDown, 
  Trash2, 
  BrainCircuit, 
  Wallet, // Wallet was missing in previous import
  ArrowRightCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RazaProfessionalLedger() {
  const [members] = useState(["Asia Fayyaz", "Jam Javed", "Raza", "Baqa", "Arshad (Self)"]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [targetMember, setTargetMember] = useState('Raza');
  const [note, setNote] = useState('');

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  // --- ARSHAD SPECIFIC CALCULATION ---
  const arshadStats = useMemo(() => {
    const totalOwedByArshad = transactions
      .filter(t => t.type === 'SPENT' && t.memberName !== "Arshad (Self)")
      .reduce((a, b) => a + b.amount, 0);
    
    const paidByArshad = transactions
      .filter(t => t.type === 'SETTLED')
      .reduce((a, b) => a + b.amount, 0);

    return {
      toPay: totalOwedByArshad,
      alreadyPaid: paidByArshad,
      remaining: totalOwedByArshad - paidByArshad
    };
  }, [transactions]);

  const memberStats = useMemo(() => {
    return members.map(m => {
      const spent = transactions.filter(t => t.memberName === m && t.type === 'SPENT').reduce((a, b) => a + b.amount, 0);
      const settled = transactions.filter(t => t.memberName === m && t.type === 'SETTLED').reduce((a, b) => a + b.amount, 0);
      return { name: m, totalSpent: spent, pending: spent - settled };
    });
  }, [transactions, members]);

  // --- ACTIONS ---
  const addEntry = async (type) => {
    if (!amount || amount <= 0) return alert("Please enter amount");
    await addDoc(collection(db, "transactions"), {
      memberName: targetMember,
      amount: parseFloat(amount),
      description: note || (type === 'SPENT' ? 'Daily Expense' : 'Debt Settlement'),
      type: type,
      date: new Date().toISOString()
    });
    setAmount(''); setNote('');
  };

  const clearDatabase = async () => {
    if (!confirm("Are you sure? This will delete EVERY transaction forever.")) return;
    const batch = writeBatch(db);
    transactions.forEach((t) => batch.delete(doc(db, "transactions", t.id)));
    await batch.commit();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Family Hissab Report", 14, 15);
    const tableData = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.memberName,
      t.description,
      t.type,
      `Rs ${t.amount}`
    ]);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Member', 'Note', 'Type', 'Amount']],
      body: tableData,
    });
    doc.save("Hissab_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 pb-20">
      {/* Header with Logo */}
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                <BrainCircuit className="text-cyan-400" size={24} />
             </div>
             <div className="leading-tight">
                <h1 className="font-black text-white text-lg tracking-tighter uppercase">RAZA</h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Unar Systems</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white' : 'hover:bg-white/5'}`}><LayoutDashboard size={20}/></button>
            <button onClick={() => setActiveTab('history')} className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-cyan-600 text-white' : 'hover:bg-white/5'}`}><History size={20}/></button>
            <button onClick={clearDatabase} className="p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"><Trash2 size={20}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Jam Arshad Master Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-[2rem] shadow-2xl shadow-cyan-900/20">
                <p className="text-cyan-100 text-[10px] font-black uppercase tracking-[0.2em]">Net Owed by Jam Arshad</p>
                <h2 className="text-5xl font-black text-white mt-2">Rs {arshadStats.remaining.toLocaleString()}</h2>
                <div className="mt-8 flex gap-6 border-t border-white/10 pt-6">
                   <div>
                      <p className="text-[9px] font-bold text-cyan-200 uppercase">Paid Back</p>
                      <p className="text-white font-black">Rs {arshadStats.alreadyPaid.toLocaleString()}</p>
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div>
                      <p className="text-[9px] font-bold text-cyan-200 uppercase">Total Debt</p>
                      <p className="text-white font-black">Rs {arshadStats.toPay.toLocaleString()}</p>
                   </div>
                </div>
              </div>
              
              <button onClick={handleDownloadPDF} className="bg-slate-900 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between hover:border-cyan-500 transition-all group">
                <FileDown size={40} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Export Data</p>
                  <p className="text-lg font-bold text-white">Download PDF</p>
                </div>
              </button>
            </div>

            {/* Member List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {memberStats.filter(m => m.name !== "Arshad (Self)").map(m => (
                <div key={m.name} className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl">
                  <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">{m.name}</p>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Pending</p>
                      <p className="text-lg font-black text-white">Rs {m.pending.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Total</p>
                      <p className="text-xs font-bold text-slate-400">Rs {m.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="bg-slate-900/80 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">New Entry</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={targetMember} onChange={e => setTargetMember(e.target.value)} className="bg-black border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-cyan-500">
                  {members.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter Amount" className="bg-black border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-cyan-500" />
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Payment Note" className="bg-black border border-white/10 rounded-xl p-4 text-white outline-none focus:border-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => addEntry('SPENT')} className="bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase hover:bg-cyan-500 hover:text-white transition-all">Add Expense</button>
                <button onClick={() => addEntry('SETTLED')} className="bg-slate-800 text-white py-4 rounded-xl font-black text-[10px] uppercase hover:bg-slate-700 transition-all border border-white/5">Arshad Paid Back</button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/50 text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                <tr>
                  <th className="p-6">Date</th>
                  <th className="p-6">Details</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6 text-xs text-slate-500 font-medium">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-white">{t.memberName}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t.description}</p>
                    </td>
                    <td className={`p-6 font-black text-sm ${t.type === 'SPENT' ? 'text-cyan-400' : 'text-emerald-400'}`}>
                      {t.type === 'SPENT' ? '-' : '+'} Rs {t.amount.toLocaleString()}
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={async () => { if(confirm("Delete entry?")) await deleteDoc(doc(db, "transactions", t.id)) }} className="text-slate-700 hover:text-rose-500 transition-colors p-2"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="mt-10 flex justify-center">
         <div className="bg-slate-900 border border-white/5 px-6 py-3 rounded-full flex items-center gap-3">
            <Wallet size={14} className="text-cyan-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
               Dev by <span className="text-white">Raza Mustafa</span>
            </p>
         </div>
      </footer>
    </div>
  );
}