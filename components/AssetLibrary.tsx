'use client';

import { useState, useEffect } from 'react';
import { useBrand } from '@/brands/useBrand';
import { Download, Loader2, CheckCircle2, Clock, CalendarDays, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

export function AssetLibrary() {
  const { activeBrand } = useBrand();
  const [assets, setAssets] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // --- THE BULLETPROOF DRIVE CONVERTER ---
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assetRes, postRes] = await Promise.all([
        fetch('/api/vault/list', { cache: 'no-store' }),
        fetch('/api/posts/list', { cache: 'no-store' })
      ]);
      if (assetRes.ok && postRes.ok) {
        const assetData = await assetRes.json();
        const postData = await postRes.json();
        setAssets(assetData.assets?.filter((a: any) => a && a.id) || []);
        setPosts(postData.posts?.filter((p: any) => p && p.id) || []);
      }
    } catch (error) { console.error('Failed to load library data:', error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (!activeBrand) return null;

  const now = new Date();
  
  const filteredAssets = assets.filter(asset => {
    const isRightBrand = asset.brandId?.trim() === activeBrand.id?.trim() || asset.brandName?.trim() === activeBrand.name?.trim();
    if (!isRightBrand) return false;
    if (timeFilter === 'all') return true;
    if (!asset.date || asset.date === 'Unknown') return false; 
    const assetDate = new Date(asset.date);
    if (isNaN(assetDate.getTime())) return false; 

    if (timeFilter === 'daily') return assetDate.toDateString() === now.toDateString();
    if (timeFilter === 'weekly') return assetDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeFilter === 'monthly') return assetDate.getMonth() === now.getMonth() && assetDate.getFullYear() === now.getFullYear();
    if (timeFilter === 'yearly') return assetDate.getFullYear() === now.getFullYear();
    return true;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="flex flex-col h-full p-6 md:p-8 bg-[#F8F9FA] relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Content Library</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">All assets for {activeBrand.name}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5 h-10">
            <ArrowUpDown size={14} className="text-gray-400 mr-2" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none pr-4">
              <option value="newest">Latest Uploads</option>
              <option value="oldest">Oldest Uploads</option>
            </select>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto max-w-full h-10">
            {['all', 'daily', 'weekly', 'monthly', 'yearly'].map(filter => (
              <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-4 h-full rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${timeFilter === filter ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
        {isLoading ? ( <div className="col-span-full py-12 flex justify-center text-gray-400"><Loader2 className="animate-spin" size={32} /></div>
        ) : sortedAssets.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-3xl bg-white">
            <CalendarDays size={40} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No assets found</h3>
            <p className="text-sm text-gray-500 mt-1">Try changing your time filter.</p>
          </div>
        ) : (
          sortedAssets.map((asset) => {
            const isPosted = posts.some(post => post.mediaUrl === asset.downloadUrl);
            return (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={asset.id} className="flex flex-col bg-white border border-gray-100 rounded-[1.5rem] p-3 shadow-sm hover:shadow-md transition-all group">
                <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden border border-gray-100 relative">
                  <div className="absolute top-2 left-2 z-20">
                    {isPosted ? (
                      <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"><CheckCircle2 size={14} /> Scheduled</div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm border border-gray-200"><Clock size={14} /> Unused</div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 z-0"><span className="text-[10px] font-bold uppercase tracking-widest">No Preview</span></div>
                  <img src={getDrivePreviewUrl(asset.downloadUrl)} alt={asset.name} className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="absolute z-20 bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={asset.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/80 backdrop-blur text-white rounded-lg shadow-sm hover:bg-black block"><Download size={16} /></a>
                  </div>
                </div>
                <div className="px-1 pb-1 flex flex-col flex-1">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1" title={asset.name}>{asset.name}</h4>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mt-auto pt-2">
                    <span className="truncate mr-2">By {asset.uploader}</span>
                    <span className="shrink-0">{asset.date && asset.date !== 'Unknown' ? new Date(asset.date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}