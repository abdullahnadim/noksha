'use client';

import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

interface PostProps {
  id: string;
  caption: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  platform: string;
  mediaUrl?: string;
}

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
  PUBLISHED: 'bg-green-100 text-green-700 border-green-200',
};

export function PostCard({ post }: { post: PostProps }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group flex flex-col cursor-pointer rounded-xl bg-white p-2 shadow-sm border border-gray-100 hover:shadow-md transition-all"
    >
      {/* Media Thumbnail Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-2">
        {post.mediaUrl ? (
          // We will put a real Next.js Image here later when Firebase is hooked up
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
        ) : (
          <ImageIcon size={16} className="text-gray-300" />
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-1.5 right-1.5 flex items-center justify-center rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider backdrop-blur-md bg-opacity-90 ${statusColors[post.status]}`}>
          {post.status}
        </div>
      </div>

      {/* Caption Preview */}
      <p className="text-xs text-gray-600 line-clamp-2 leading-tight font-medium">
        {post.caption || 'No caption drafted yet...'}
      </p>
      
      {/* Platform Indicator */}
      <p className="text-[10px] text-gray-400 mt-1.5 font-semibold tracking-wider uppercase">
        {post.platform}
      </p>
    </motion.div>
  );
}