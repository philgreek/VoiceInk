import React, { useRef, useEffect } from 'react';
import { CameraOffIcon } from './icons';

interface VideoFeedProps {
  stream: MediaStream | null;
  onClose: () => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ stream, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className="fixed z-40 bottom-32 right-4 bg-slate-900 border-2 border-slate-700 rounded-lg shadow-2xl w-64 overflow-hidden aspect-video"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
       <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 text-white/80 bg-black/40 hover:text-white hover:bg-black/60 rounded-full transition-colors"
            aria-label="Turn off camera"
         >
            <CameraOffIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
