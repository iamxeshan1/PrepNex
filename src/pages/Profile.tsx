import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { profile } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-black text-[#0f172a] mb-6">Manage Profile</h1>
      <div className="bg-white p-6 rounded-2xl border border-slate-100">
        <p className="text-slate-500">Manage your profile details here.</p>
        <p className="mt-4">Name: {profile?.name}</p>
        <p>Email: {profile?.email}</p>
      </div>
    </div>
  );
}
