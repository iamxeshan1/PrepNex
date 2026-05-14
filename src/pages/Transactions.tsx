import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useItemTitles } from '../hooks/useItemTitles';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CreditCard, Receipt, Calendar, Search, Loader2, Download, Tag, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Transactions() {
  const { user } = useAuth();
  const { getItemTitle } = useItemTitles();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const subsQuery = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
        const premiumQuery = query(collection(db, 'premium_subscriptions'), where('userId', '==', user.uid));
        
        const [subsSnap, premiumSnap] = await Promise.all([getDocs(subsQuery), getDocs(premiumQuery)]);
        
        const allTx: any[] = [];
        
        subsSnap.forEach(doc => {
          allTx.push({ id: doc.id, collection: 'subscriptions', ...doc.data() });
        });
        
        premiumSnap.forEach(doc => {
          allTx.push({ id: doc.id, collection: 'premium_subscriptions', ...doc.data() });
        });
        
        allTx.sort((a, b) => {
           const timeA = new Date(a.purchaseDate || a.createdAt || 0).getTime();
           const timeB = new Date(b.purchaseDate || b.createdAt || 0).getTime();
           return timeB - timeA;
        });

        setTransactions(allTx);
      } catch (error) {
        console.error("Error fetching transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const filtered = transactions.filter(t => {
    const title = getItemTitle(t.examId || (t.collection === "premium_subscriptions" ? "PREMIUM_PASS" : null), t.type) || t.examId || 'Purchase';
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.paymentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.orderId || '').toLowerCase().includes(searchTerm.toLowerCase())
  });

  const downloadAllTransactions = () => {
    try {
      const doc = new jsPDF();
      
      // -- Branded Header Background --
      doc.setFillColor(13, 148, 136); // Teal 600
      doc.rect(0, 0, 220, 40, 'F');
      
      // "PrepNext" Logo Text
      doc.setFontSize(26);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("PrepNext", 14, 26);
      
      // Subtitle in Header
      doc.setFontSize(10);
      doc.setTextColor(204, 251, 241); // Teal 50
      doc.setFont("helvetica", "normal");
      doc.text("TRANSACTION HISTORY", 150, 25);
      
      // -- User Info Area --
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.text("Statement Summary", 14, 55);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      if (user?.email) {
        doc.text(`Account: ${user.email}`, 14, 63);
      }
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 69);
      doc.text(`Total Transactions: ${filtered.length}`, 14, 75);

      // -- Table Data --
      const tableData = filtered.map(tx => {
        const title = getItemTitle(tx.examId || (tx.collection === "premium_subscriptions" ? "PREMIUM_PASS" : null), tx.type) || tx.examId || 'Purchase';
        const date = new Date(tx.purchaseDate || tx.createdAt || Date.now()).toLocaleDateString('en-US', {
           year: 'numeric', month: 'short', day: 'numeric'
        });
        return [
          date,
          tx.paymentId || tx.id,
          title,
          tx.paymentStatus || 'completed',
          `Rs. ${tx.amount || 0}`
        ];
      });

      const tableOptions = {
        startY: 85,
        head: [['Date', 'Transaction ID', 'Item Description', 'Status', 'Amount']],
        body: tableData,
        headStyles: {
          fillColor: [15, 23, 42] as [number, number, number],
          textColor: 255,
          fontStyle: 'bold' as const,
        },
        bodyStyles: {
          textColor: [51, 65, 85] as [number, number, number], // slate-700
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number],
        },
        theme: 'grid' as const,
        styles: {
          font: 'helvetica',
          cellPadding: 4,
          lineColor: [226, 232, 240] as [number, number, number], // slate-200
          lineWidth: 0.1,
        }
      };

      if (typeof autoTable === 'function') {
        autoTable(doc, tableOptions);
      } else if (autoTable && typeof (autoTable as any).default === 'function') {
        (autoTable as any).default(doc, tableOptions);
      } else if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable(tableOptions);
      }

      // -- Footer --
      const finalY = (doc as any).lastAutoTable?.finalY || 110;
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Thank you for learning with PrepNext Edtech!", 14, finalY + 15);
      doc.text("For support, contact support@prepnext.com", 14, finalY + 21);
      
      // Bottom accent bar
      doc.setFillColor(13, 148, 136); // Teal 600
      const pageHeight = doc.internal.pageSize.height || 297;
      doc.rect(0, pageHeight - 5, 220, 5, 'F');
      
      doc.save(`PrepNext_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="bg-teal-50 p-2 rounded-xl text-teal-600">
                <Receipt className="w-7 h-7" />
              </span>
              Transactions
            </h1>
            <p className="text-slate-500 font-medium mt-2 leading-relaxed">
              View and download your complete purchase history and active subscriptions.
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-sm transition-all placeholder:text-slate-400"
              />
            </div>
            {filtered.length > 0 && (
              <button
                onClick={downloadAllTransactions}
                className="flex shrink-0 items-center gap-2 px-4 py-2.5 bg-[#064e40] text-white rounded-xl text-sm font-semibold hover:bg-[#001f19] transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
               </button>
            )}
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-32">
              <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
              </div>
           </div>
        ) : filtered.length === 0 ? (
           <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
             <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
               <FileText className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
             <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm">
               {searchTerm ? 'Try adjusting your search terms.' : "You don't have any transaction history yet."}
             </p>
           </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((tx, index) => {
                     const title = getItemTitle(tx.examId || (tx.collection === "premium_subscriptions" ? "PREMIUM_PASS" : null), tx.type) || tx.examId || 'Purchase';
                     const isPremium = tx.collection === "premium_subscriptions";

                     return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        key={tx.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(tx.purchaseDate || tx.createdAt || Date.now()).toLocaleDateString('en-US', {
                               year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors block">
                              {title}
                            </span>
                            {tx.couponCode && tx.couponCode !== 'NONE' && (
                               <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                 <Tag className="w-2.5 h-2.5" /> {tx.couponCode}
                               </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span className="font-bold text-slate-900">₹{tx.amount || 0}</span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            (tx.paymentStatus || 'completed') === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {tx.paymentStatus || 'completed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            {tx.paymentId || tx.id}
                          </div>
                        </td>
                      </motion.tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
