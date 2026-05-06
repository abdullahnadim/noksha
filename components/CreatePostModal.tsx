'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2, CheckCircle } from 'lucide-react';
import { FiInstagram, FiFacebook, FiLinkedin } from 'react-icons/fi';
import { useBrand } from '@/brands/useBrand';

export function CreatePostModal() {
  const { isCreateModalOpen, closeModal, activeBrand } = useBrand();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram']);
  const [caption, setCaption] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBrand) return;

    if (file.type.includes('image')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brandId', activeBrand.id);
    formData.append('brandName', activeBrand.name); 
    formData.append('uploaderName', 'Current User'); 

    try {
      const res = await fetch('/api/vault/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setDriveUrl(data.downloadUrl);
      } else {
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeBrand || isSubmitting || isUploading) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: activeBrand.name,
          platforms: selectedPlatforms,
          caption,
          scheduleDate,
          mediaUrl: driveUrl || 'No Media'
        })
      });

      if (res.ok) {
        // Soft close and reset everything
        closeModal();
        setCaption('');
        setScheduleDate('');
        setPreviewUrl(null);
        setDriveUrl(null);
        setSelectedPlatforms(['Instagram']);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50/50 bg-gray-50/30">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Draft Post</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wider">Publishing to {activeBrand?.name}</p>
              </div>
              <button onClick={closeModal} className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"><X size={18} strokeWidth={2.5} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 flex flex-col">
                <label className="w-full aspect-square border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-black/20 transition-all cursor-pointer group relative overflow-hidden shadow-sm">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} disabled={isUploading || isSubmitting} />
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 size={32} className="text-black animate-spin mb-3" />
                      <span className="text-sm font-bold text-gray-900">Uploading Asset...</span>
                    </div>
                  )}
                  {previewUrl ? (
                    <div className="absolute inset-0 w-full h-full p-2">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl shadow-sm" />
                      {driveUrl && !isUploading && (
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white p-2 rounded-full shadow-lg scale-in">
                          <CheckCircle size={20} className="text-green-400" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-6 text-center">
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 group-hover:scale-105 transition-transform"><UploadCloud size={28} className="text-gray-800" strokeWidth={1.5} /></div>
                      <span className="text-sm font-bold text-gray-900">Upload Visual</span>
                      <span className="text-xs mt-1.5 font-medium text-gray-400">1:1 Ratio recommended</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="w-full md:w-1/2 flex flex-col gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-3 block uppercase tracking-widest">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'Instagram', icon: <FiInstagram size={14} /> },
                      { id: 'Facebook', icon: <FiFacebook size={14} /> },
                      { id: 'LinkedIn', icon: <FiLinkedin size={14} /> }
                    ].map(platform => {
                      const isSelected = selectedPlatforms.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isSelected ? 'bg-black text-white border-black scale-100' : 'bg-transparent text-gray-300 border-gray-100 hover:text-gray-600 scale-95'}`}
                        >
                          {platform.icon}{platform.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-widest">Caption</label>
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your creative copy here..."
                    className="flex-1 w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm text-gray-800 font-medium focus:bg-white focus:ring-2 focus:ring-black/5 outline-none resize-none transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-widest">Schedule Date</label>
                  <input 
                    type="datetime-local" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-black/5 outline-none cursor-pointer transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-white border-t border-gray-100 flex items-center justify-between">
              <button onClick={closeModal} className="text-sm font-bold text-gray-400 hover:text-gray-900 px-4 py-2.5 rounded-xl transition-colors">Cancel</button>
              <button 
                onClick={handleSubmit}
                className={`text-sm font-bold text-white px-8 py-3 rounded-xl shadow-lg transition-all ${isSubmitting || isUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-gray-900 to-black hover:shadow-xl hover:-translate-y-0.5'}`}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? 'Scheduling...' : 'Add to Calendar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}