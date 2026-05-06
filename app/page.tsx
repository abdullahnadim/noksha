'use client';

import { Sidebar } from "@/components/Sidebar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { AssetVault } from "@/components/AssetVault";
import { CreatePostModal } from "@/components/CreatePostModal";
import { useBrand } from "@/brands/useBrand";
import { AssetLibrary } from "@/components/AssetLibrary";
import { TaskBoard } from "@/components/TaskBoard";
import { Settings } from "@/components/Settings"; 

export default function Home() {
  const { activeView } = useBrand();

  return (
    <main className="flex h-screen w-full bg-[#F9FAFB] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {activeView === 'calendar' && <CalendarGrid />}
        {activeView === 'vault' && <AssetVault />}
        {activeView === 'library' && <AssetLibrary />}
        {activeView === 'tasks' && <TaskBoard />}
        {activeView === 'settings' && <Settings />}
      </div>
      <CreatePostModal />
    </main>
  );
}