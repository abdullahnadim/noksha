'use client';

import { useState, useEffect } from 'react';
import { useBrand } from '@/brands/useBrand';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Download, Loader2, CheckCircle, Plus, X, Trash2, ArrowUpDown, Image as ImageIcon, Archive } from 'lucide-react';
import { FiInstagram, FiFacebook, FiLinkedin } from 'react-icons/fi';

export function AssetVault() {
  const { activeBrand } = useBrand();
  
  const [assets, setAssets] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // THE MISSING GALLERY TOGGLE STATE
  const [viewMode, setViewMode] = useState<'unused' | 'gallery'>('unused'); 
  const [sortBy, setSortBy] = useState('newest'); 

  const [assetToSchedule, setAssetToSchedule] = useState<any | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram']);
  const [caption, setCaption] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // --- THE ULTIMATE GOOGLE DRIVE BYPASS ---
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
        setScheduledPosts(postData.posts?.filter((p: any) => p && p.id) || []);
      }
    } catch (error) { console.error('Failed to load vault data:', error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (!activeBrand) return null;

  // --- THE RESTORED GALLERY FILTER LOGIC ---
  const filteredAssets = assets.filter(asset => {
    const isRightBrand = asset.brandId?.trim() === activeBrand.id?.trim() || asset.brandName?.trim() === activeBrand.name?.trim();
    if (!isRightBrand) return false;
    
    // If we are in 'unused' mode, hide the ones that exist in the scheduled posts
    if (viewMode === 'unused') {
      const isAlreadyPosted = scheduledPosts.some(post => post.mediaUrl === asset.downloadUrl);
      return !isAlreadyPosted;
    }
    
    // If we are in 'gallery' mode, show absolutely everything for this brand
    return true; 
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeBrand) return;

    setIsUploading(true);
    setShowSuccess(false);
    setUploadError(null); // Clear any old errors
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', activeBrand.id);
        formData.append('brandName', activeBrand.name);
        formData.append('uploaderName', 'Current User'); 
        
        const res = await fetch('/api/vault/upload', { method: 'POST', body: formData });
        
        // THE FIX: If the server returns an error code (400, 413, 500), FORCE it to throw an error!
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Server error: ${res.status}`);
        }
        return res;
      });

      await Promise.all(uploadPromises);
      setShowSuccess(true);
      fetchData();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Upload failed", error);
      // Save the error message so we can show it on the UI
      setUploadError(error.message || "Failed to upload file. It might be too large.");
    } finally { 
      setIsUploading(false); 
      // Reset the file input so you can select the exact same file again to retry
      e.target.value = ''; 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    setAssets(prev => prev.filter(a => a.id !== id));
    try { await fetch(`/api/vault/delete?id=${id}`, { method: 'DELETE' }); } catch (error) { fetchData(); }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  const handleScheduleSubmit = async () => {
    if (!activeBrand || isSubmitting || !assetToSchedule) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: activeBrand.name, platforms: selectedPlatforms, caption, scheduleDate, mediaUrl: assetToSchedule.downloadUrl })
      });

      if (res.ok) {
        setScheduleSuccess(true);
        setTimeout(() => { setScheduleSuccess(false); setAssetToSchedule(null); setCaption(''); setScheduleDate(''); fetchData(); }, 1500);
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8 bg-[#F8F9FA] relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Asset Vault</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage files for {activeBrand.name}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* THE FIXED GALLERY TOGGLE */}
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm h-10">
            <button onClick={() => setViewMode('unused')} className={`px-4 h-full rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'unused' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <Archive size={14}/> Unused Only
            </button>
            <button onClick={() => setViewMode('gallery')} className={`px-4 h-full rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'gallery' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <ImageIcon size={14}/> Full Gallery
            </button>
          </div>

          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 h-10">
            <ArrowUpDown size={14} className="text-gray-400 mr-2" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none pr-4">
              <option value="newest">Latest Uploads</option>
              <option value="oldest">Oldest Uploads</option>
            </select>
          </div>
        </div>
      </header>

      <label className={`mb-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-10 transition-colors cursor-pointer group relative overflow-hidden ${showSuccess ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
        <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-gray-900">Uploading to Vault...</h3>
            </motion.div>
          ) : uploadError ? (
            // --- THE NEW ERROR UI ---
            <motion.div key="error" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center">
              <X size={36} className="text-red-500 mb-3" />
              <h3 className="text-base font-bold text-red-700">Upload Failed</h3>
              <p className="text-xs text-red-500 font-mono mt-1 max-w-[250px] break-words">{uploadError}</p>
            </motion.div>
          ) : showSuccess ? (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <CheckCircle size={36} className="text-green-500 mb-3" />
              <h3 className="text-base font-bold text-green-700">Upload Successful!</h3>
            </motion.div>
          ) : (
            <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-2xl group-hover:scale-105 transition-transform mb-4"><UploadCloud size={32} className="text-gray-600" /></div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Upload to Vault</h3>
              <p className="text-xs text-gray-400 font-medium text-center">Click or drop multiple files here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
        {isLoading ? ( <div className="col-span-full py-12 text-center text-gray-400 flex justify-center"><Loader2 className="animate-spin" size={32} /></div>
        ) : sortedAssets.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-3xl bg-white">
            <h3 className="text-lg font-bold text-gray-900">No assets found</h3>
            <p className="text-sm text-gray-500 mt-1">Upload files or change your Gallery toggle above!</p>
          </div>
        ) : (
          sortedAssets.map((asset) => {
            const isPosted = scheduledPosts.some(post => post.mediaUrl === asset.downloadUrl);
            
            return (
              <div key={asset.id} className="flex flex-col bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-full aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden border border-gray-100 relative group">
                  
                  {/* Status Badge (Shows if viewing Full Gallery) */}
                  {viewMode === 'gallery' && (
                    <div className="absolute top-2 left-2 z-20">
                      {isPosted ? (
                        <div className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-sm">Scheduled</div>
                      ) : (
                        <div className="bg-gray-800/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-sm">Unused</div>
                      )}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center z-0 p-3 text-center overflow-hidden bg-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">No Preview</span>
                  </div>

                  <img 
                    src={getDrivePreviewUrl(asset.downloadUrl)} 
                    alt={asset.name} 
                    className="absolute inset-0 w-full h-full object-contain p-2 z-10 bg-white" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                  
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <a href={asset.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/90 backdrop-blur text-gray-700 rounded-lg shadow-sm hover:text-black"><Download size={16} /></a>
                    <button onClick={() => handleDelete(asset.id)} className="p-2 bg-red-500/90 backdrop-blur text-white rounded-lg shadow-sm hover:bg-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <h4 className="text-sm font-bold text-gray-900 truncate mb-1" title={asset.name}>{asset.name}</h4>
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold mt-auto pt-2 mb-4">
                  <span>By {asset.uploader}</span>
                  <span>{asset.date && asset.date !== 'Unknown' ? new Date(asset.date).toLocaleDateString() : asset.size}</span>
                </div>
                
                <button 
                  onClick={() => setAssetToSchedule(asset)} 
                  disabled={isPosted}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isPosted ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-900 hover:bg-black hover:text-white'
                  }`}
                >
                  <Plus size={16} /> {isPosted ? 'Already Scheduled' : 'Schedule Post'}
                </button>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {assetToSchedule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssetToSchedule(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Schedule Asset</h3>
                <button onClick={() => setAssetToSchedule(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16} /></button>
              </div>
              <div className="w-full h-32 bg-gray-100 rounded-xl mb-6 overflow-hidden border border-gray-200 relative flex items-center justify-center">
                 <img src={getDrivePreviewUrl(assetToSchedule.downloadUrl)} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2 z-10 bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-widest">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: 'Instagram', icon: <FiInstagram size={14} /> }, { id: 'Facebook', icon: <FiFacebook size={14} /> }, { id: 'LinkedIn', icon: <FiLinkedin size={14} /> }].map(platform => (
                      <button key={platform.id} onClick={() => togglePlatform(platform.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedPlatforms.includes(platform.id) ? 'bg-black text-white border-black' : 'bg-transparent text-gray-400 border-gray-200'}`}>{platform.icon}{platform.id}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-widest">Caption</label>
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Write a caption..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-widest">Date & Time</label>
                  <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none" />
                </div>
                <button onClick={handleScheduleSubmit} disabled={isSubmitting || scheduleSuccess} className={`w-full mt-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${scheduleSuccess ? 'bg-green-500 text-white' : isSubmitting ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-gray-900 to-black text-white hover:shadow-xl'}`}>
                  {scheduleSuccess ? <><CheckCircle size={18} /> Scheduled!</> : isSubmitting ? 'Syncing...' : 'Confirm & Schedule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}