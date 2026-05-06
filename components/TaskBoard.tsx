'use client';

import { useState } from 'react';
import { useBrand } from '@/brands/useBrand';
import { Plus, MoreHorizontal, Clock, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const initialTasks = [
  { id: '1', title: 'Design Summer Promo Graphics', status: 'todo', brandName: 'Happier', assignee: 'Rakib', due: 'Tomorrow', comments: 2 },
  { id: '2', title: 'Write SEO Blog Post: Organic Fabrics', status: 'in_progress', brandName: 'Sonder', assignee: 'Nadim', due: 'May 10', comments: 5 },
  { id: '3', title: 'Edit TikTok Reel V2', status: 'review', brandName: 'Happier', assignee: 'Nafis', due: 'Today', comments: 1 },
];

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 text-gray-600' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { id: 'review', title: 'In Review', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'done', title: 'Done', color: 'bg-green-100 text-green-700' }
];

export function TaskBoard() {
  const { activeBrand } = useBrand();
  const [tasks, setTasks] = useState(initialTasks);

  if (!activeBrand) return null;

  const activeTasks = tasks.filter(task => task.brandName.toLowerCase() === activeBrand.name.toLowerCase());

  const moveTask = (taskId: string, direction: 'next' | 'prev') => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const currentIndex = COLUMNS.findIndex(col => col.id === task.status);
      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < COLUMNS.length) return { ...task, status: COLUMNS[newIndex].id };
      return task;
    }));
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8 bg-[#F8F9FA] overflow-hidden">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Task Board</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Content pipeline for {activeBrand.name}</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-all">
          <Plus size={18} /> New Task
        </button>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map((column) => {
          const columnTasks = activeTasks.filter(t => t.status === column.id);
          return (
            <div key={column.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-gray-50/50 rounded-3xl p-4 border border-gray-100/50 h-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{column.title}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${column.color}`}>{columnTasks.length}</span>
                </div>
                <button className="text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={16} /></button>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {columnTasks.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Empty</span>
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-md">{task.brandName}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {column.id !== 'todo' && <button onClick={() => moveTask(task.id, 'prev')} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-md"><ChevronLeft size={14} /></button>}
                          {column.id !== 'done' && <button onClick={() => moveTask(task.id, 'next')} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-md"><ChevronRight size={14} /></button>}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-4 leading-snug">{task.title}</h4>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">{task.assignee.charAt(0)}</div>
                          <span className="text-xs font-bold text-gray-500">{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400 text-xs font-bold">
                          {task.comments > 0 && <div className="flex items-center gap-1"><MessageSquare size={12} /> {task.comments}</div>}
                          <div className={`flex items-center gap-1 ${task.due === 'Today' || task.due === 'Tomorrow' ? 'text-orange-500' : ''}`}><Clock size={12} /> {task.due}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}