'use client';

import { useBrand } from '@/brands/useBrand';
import { Calendar as CalendarIcon, Image as ImageIcon, CheckSquare, Settings, Library } from 'lucide-react';

export function Sidebar() {
  const { activeBrand, setActiveBrand, activeView, setActiveView, brands } = useBrand();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-4 z-10 shrink-0">
      <div className="mb-8">
        <p className="text-xs font-bold text-gray-400 mb-2 px-2 tracking-wider">WORKSPACE</p>
        <select 
          className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black block p-3 outline-none font-bold cursor-pointer transition-all shadow-sm"
          value={activeBrand?.id || ''}
          onChange={(e) => {
            const selected = brands.find(b => b.id === e.target.value);
            if (selected) setActiveBrand(selected);
          }}
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        <NavItem icon={<CalendarIcon size={18} />} label="Calendar" active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} />
        <NavItem icon={<ImageIcon size={18} />} label="Asset Vault" active={activeView === 'vault'} onClick={() => setActiveView('vault')} />
        <NavItem icon={<Library size={18} />} label="Content Library" active={activeView === 'library'} onClick={() => setActiveView('library')} />
        <NavItem icon={<CheckSquare size={18} />} label="Task Board" active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} />
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <NavItem icon={<Settings size={18} />} label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')}/>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
        active ? 'bg-black text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 scale-[0.98]'
      }`}
    >
      {icon} {label}
    </button>
  );
}