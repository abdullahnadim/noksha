'use client';

import { useState } from 'react';
import { useBrand } from '@/brands/useBrand';
import { Building2, Users, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function Settings() {
  const { brands, addBrand, removeBrand } = useBrand();
  const [newBrandName, setNewBrandName] = useState('');
  const [activeTab, setActiveTab] = useState('workspace');

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrandName.trim()) {
      addBrand(newBrandName.trim());
      setNewBrandName('');
    }
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8 bg-[#F8F9FA]">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Manage your workspaces and preferences.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 max-w-5xl">
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {[
            { id: 'workspace', icon: <Building2 size={18} />, label: 'Workspaces' },
            { id: 'team', icon: <Users size={18} />, label: 'Team Access' },
            { id: 'integrations', icon: <LinkIcon size={18} />, label: 'Integrations' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 transparent border border-transparent'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 min-h-[60vh]">
          {activeTab === 'workspace' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Workspaces</h2>
              <form onSubmit={handleAddBrand} className="flex gap-3 mb-8">
                <input 
                  type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Enter new brand name..."
                  className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all"
                />
                <button type="submit" disabled={!newBrandName.trim()} className="flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  <Plus size={18} /> Add Workspace
                </button>
              </form>
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Active Workspaces</h3>
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{brand.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">ID: {brand.id}</p>
                      </div>
                    </div>
                    {brands.length > 1 && (
                      <button onClick={() => removeBrand(brand.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Workspace">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'team' && (<div className="flex flex-col items-center justify-center h-full text-gray-400"><Users size={48} className="mb-4 opacity-50" /><p className="font-bold">Team Access controls coming soon.</p></div>)}
          {activeTab === 'integrations' && (<div className="flex flex-col items-center justify-center h-full text-gray-400"><LinkIcon size={48} className="mb-4 opacity-50" /><p className="font-bold">Social Media API Integrations coming soon.</p></div>)}
        </div>
      </div>
    </div>
  );
}