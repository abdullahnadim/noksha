'use client';

import { useState, useEffect } from 'react';
import { useBrand } from '@/brands/useBrand';
import { FiInstagram, FiFacebook, FiLinkedin, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { Loader2, X, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Post { id: string; brandName: string; platforms: string[]; caption: string; scheduleDate: string; mediaUrl: string; status: string; }

export function CalendarGrid() {
  const { activeBrand, openModal } = useBrand();
  
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // THE SMARTER URL PARSER
  // --- THE NEXT.JS PROXY CONVERTER ---
  const getDrivePreviewUrl = (url: string) => {
    if (!url || url === 'No Media') return '';
    
    // Extract the ID
    const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
      // Route the image through our new custom Next.js server proxy!
      return `/api/proxy-image?id=${match[1]}`;
    }
    
    return url; 
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/posts/list', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRealPosts(data.posts || []);
      }
    } catch (error) { console.error('Failed to fetch posts:', error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarCells = Array(firstDayOfMonth).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  if (!activeBrand) return null;

  const activeBrandPosts = realPosts.filter(post => post.brandName?.trim().toLowerCase() === activeBrand.name?.trim().toLowerCase());
  const springAnim = { type: "spring", stiffness: 300, damping: 30 } as const;

  return (
    <div className="flex flex-col h-full bg-[#Fcfcfc] relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}/>

      <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-2xl"><CalendarIcon size={24} className="text-black" /></div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">{activeBrand.name}</h1>
              <p className="text-sm text-gray-500 mt-1 font-bold uppercase tracking-widest flex items-center gap-2">
                {monthName} {currentYear}
                <AnimatePresence>
                  {isLoading && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md text-[9px] overflow-hidden whitespace-nowrap">
                      <Loader2 size={10} className="animate-spin" /> SYNCING
                    </motion.span>
                  )}
                </AnimatePresence>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={fetchPosts} disabled={isLoading} className="p-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-black hover:shadow-md transition-all flex items-center justify-center group disabled:opacity-50">
              <FiRefreshCw size={18} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
            <button onClick={openModal} className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-black/10 hover:bg-gray-800 hover:-translate-y-0.5 transition-all">
              <FiPlus size={18} /> Draft Post
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 gap-4 mb-3 text-[10px] font-black text-gray-400 tracking-widest uppercase shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="text-center">{day}</div>))}
        </div>

        <div className="grid grid-cols-7 auto-rows-max gap-3 flex-1 overflow-y-auto pb-12 custom-scrollbar pr-1">
          {calendarCells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="bg-transparent rounded-3xl border border-dashed border-gray-200/40 min-h-[160px]" />;

            const dayPosts = activeBrandPosts.filter((p) => {
              if (!p.scheduleDate) return false;
              const postDate = new Date(p.scheduleDate);
              return postDate.getFullYear() === currentYear && postDate.getMonth() === currentMonth && postDate.getDate() === day;
            });
            
            const isToday = day === currentDate.getDate();

            return (
              <motion.div layout transition={springAnim} key={`day-${day}`} className={`flex flex-col min-h-[160px] h-full rounded-[1.5rem] p-3 transition-colors group border backdrop-blur-xl ${isToday ? 'bg-blue-50/80 border-blue-200 shadow-[0_8px_30px_rgb(59,130,246,0.1)]' : 'bg-white/70 border-gray-200/50 shadow-sm hover:border-gray-300 hover:shadow-lg hover:bg-white'}`}>
                <motion.div layout="position" className="flex justify-between items-center mb-3 shrink-0">
                  <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-900'}`}>{day}</span>
                  <button onClick={openModal} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"><FiPlus size={14} /></button>
                </motion.div>
                
                <div className="flex flex-col gap-3 mt-1 h-full">
                  <AnimatePresence mode="popLayout">
                    {isLoading && day === 1 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-24 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl animate-pulse" />}

                    {!isLoading && dayPosts.map(post => (
                      <motion.div layout initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={springAnim} key={post.id} onClick={() => setSelectedPost(post)} className="flex flex-col bg-white border border-gray-100/80 p-2 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-gray-300 transition-all cursor-pointer group/card shrink-0 hover:-translate-y-1">
                        
                        {post.mediaUrl && post.mediaUrl !== 'No Media' && (
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50/50 mb-2 relative group-hover/card:opacity-95 transition-opacity shrink-0">
                            
                            {/* RED URL DEBUGGER */}
                            <div className="absolute inset-0 flex items-center justify-center z-0 p-1 text-center overflow-hidden bg-red-50">
                              <span className="text-[6px] font-mono font-bold text-red-500 break-all leading-tight">
                                {getDrivePreviewUrl(post.mediaUrl) || 'No URL'}
                              </span>
                            </div>
                            
                            <img 
                              src={getDrivePreviewUrl(post.mediaUrl)} 
                              alt="Post visual" 
                              className="absolute inset-0 w-full h-full object-contain p-1 z-10 drop-shadow-sm bg-white"
                              // MAKE IT TRANSPARENT TO SHOW THE RED DEBUG TEXT IF IT BREAKS!
                              onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                            />
                            <div className="absolute inset-0 border border-black/[0.03] rounded-xl z-20 pointer-events-none" />
                          </div>
                        )}
                        
                        <div className="px-1 pb-1">
                          <div className="flex gap-1.5 mb-2 text-gray-400">
                            {post.platforms.includes('Instagram') && <FiInstagram size={12} />}
                            {post.platforms.includes('Facebook') && <FiFacebook size={12} />}
                            {post.platforms.includes('LinkedIn') && <FiLinkedin size={12} />}
                          </div>
                          <p className="text-[10px] text-gray-700 font-bold line-clamp-2 leading-relaxed">{post.caption || <span className="text-gray-400 font-medium italic">No caption added</span>}</p>
                          <span className="text-[9px] font-black text-gray-400 mt-2 block uppercase tracking-widest">{new Date(post.scheduleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPost(null)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={springAnim} className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                <div><h3 className="text-xl font-extrabold text-gray-900">Post Details</h3><p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-0.5">{activeBrand.name}</p></div>
                <button onClick={() => setSelectedPost(null)} className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                {selectedPost.mediaUrl && selectedPost.mediaUrl !== 'No Media' && (
                  <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative min-h-[200px] p-2 flex items-center justify-center">
                    <span className="absolute text-[10px] text-red-500 text-center px-4 font-mono z-0">{getDrivePreviewUrl(selectedPost.mediaUrl)}</span>
                    <img src={getDrivePreviewUrl(selectedPost.mediaUrl)} alt="Preview" className="w-full h-auto object-contain max-h-[400px] rounded-2xl z-10 bg-white" onError={(e) => (e.currentTarget.style.opacity = '0')} />
                  </div>
                )}
                <div className="flex flex-col gap-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Platforms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.platforms.map(platform => (
                        <span key={platform} className="px-3.5 py-2 bg-gray-50 border border-gray-100 text-gray-900 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2">
                          {platform === 'Instagram' && <FiInstagram size={14} className="text-pink-500"/>}
                          {platform === 'Facebook' && <FiFacebook size={14} className="text-blue-600"/>}
                          {platform === 'LinkedIn' && <FiLinkedin size={14} className="text-blue-700"/>}
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 w-full" />
                  <div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Caption</h4><p className="text-sm text-gray-800 font-semibold whitespace-pre-wrap leading-relaxed">{selectedPost.caption || <span className="text-gray-400 italic font-medium">No caption provided.</span>}</p></div>
                  <div className="h-px bg-gray-100 w-full" />
                  <div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Scheduled For</h4><p className="text-sm font-extrabold text-black">{new Date(selectedPost.scheduleDate).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}