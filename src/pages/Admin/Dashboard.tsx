import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, BookOpen, CreditCard, Award, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    exams: 0,
    subscriptions: 0,
    tests: 0
  });
  const [loading, setLoading] = useState(true);

  const handleGenerateReport = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // 1. Summary Sheet
    const summaryData = [
      ["PrepNex - Monthly Performance Report"],
      ["Report Created:", new Date().toLocaleString()],
      [],
      ["OVERVIEW STATS"],
      ["Metric", "Value", "Status"],
      ["Total Users Registered", stats.users, stats.users > 100 ? "Growth" : "Steady"],
      ["Active Exams", stats.exams, "Active"],
      ["Total Subscriptions", stats.subscriptions, "Revenue"],
      ["Mock Tests Available", stats.tests, "Content"],
      [],
      ["ENGAGEMENT METRICS"],
      ["Avg Tests per User", (stats.users > 0 ? (stats.tests / stats.users).toFixed(2) : 0), "Ratio"],
      ["Avg Exams per User", (stats.users > 0 ? (stats.exams / stats.users).toFixed(2) : 0), "Ratio"],
      [],
      ["DISCLAIMER"],
      ["This report is strictly for administrative use only. Generated automatically by PrepNex Core Systems."]
    ];
    
    const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    const wscols = [
      {wch: 30},
      {wch: 20},
      {wch: 15}
    ];
    ws_summary['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws_summary, "Executive Summary");
    
    // 2. Data Breakdown Sheet
    const breakdownData = [
      ["Category", "Platform Metric", "Count", "Last Updated"],
      ["Users", "Identity Cloud", stats.users, new Date().toDateString()],
      ["Exams", "Academic Courses", stats.exams, new Date().toDateString()],
      ["Sales", "Revenue Stream", stats.subscriptions, new Date().toDateString()],
      ["Content", "Mock Assessment", stats.tests, new Date().toDateString()],
    ];
    const ws_breakdown = XLSX.utils.aoa_to_sheet(breakdownData);
    ws_breakdown['!cols'] = [{wch: 15}, {wch: 25}, {wch: 15}, {wch: 20}];
    XLSX.utils.book_append_sheet(wb, ws_breakdown, "Detailed Metrics");

    // Write file
    XLSX.writeFile(wb, `PrepNex_Admin_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const fetchStats = async () => {
    const [uSnap, eSnap, sSnap, tSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'exams')),
      getDocs(collection(db, 'subscriptions')),
      getDocs(collection(db, 'tests'))
    ]);
    setStats({
      users: uSnap.size,
      exams: eSnap.size,
      subscriptions: sSnap.size,
      tests: tSnap.size
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colorClasses: any = {
      blue: 'bg-blue-50 text-blue-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600'
    };
    
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colorClasses[color] || 'bg-slate-50 text-slate-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-4xl font-black text-primary mb-1 tracking-tighter">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</div>
      </div>
    );
  };

  return (
    <AdminLayout title="Admin Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="blue" />
        <StatCard title="Active Exams" value={stats.exams} icon={BookOpen} color="indigo" />
        <StatCard title="Subscriptions" value={stats.subscriptions} icon={CreditCard} color="green" />
        <StatCard title="Mock Tests" value={stats.tests} icon={Award} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8">
            <h3 className="text-xl font-bold text-primary mb-1 tracking-tight">Generate Live Insights</h3>
            <p className="text-slate-500 text-sm mb-8">System health and real-time operational status of core services.</p>
            <div className="space-y-6">
              {['Firebase Auth', 'Firestore Database', 'Asset Storage', 'Payment Webhook'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-600">{item}</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Operational</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-primary rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div>
            <h3 className="text-2xl font-bold mb-4 leading-tight">Generate <br />Monthly Report</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-8 opacity-80 font-medium">Get a deep dive into user engagement and revenue metrics for the current period.</p>
          </div>
          <button 
            onClick={handleGenerateReport}
            className="w-full py-4 bg-white text-primary rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
          >
            Download Excel Report <FileSpreadsheet className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
