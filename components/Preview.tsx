import React, { useEffect, useRef, useState } from 'react';
import { AnimationSettings, BoundingBox, SpriteSheetData } from '../types';

interface PreviewProps {
  data: SpriteSheetData | null;
  boxes: BoundingBox[];
  settings: AnimationSettings;
}

export const Preview: React.FC<PreviewProps> = ({ data, boxes, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  // Sort boxes spatially (Top-left to bottom-right)
  const sortedBoxes = React.useMemo(() => {
      return [...boxes].sort((a, b) => {
          const yDiff = a.y - b.y;
          if (Math.abs(yDiff) > 10) return yDiff; 
          return a.x - b.x;
      });
  }, [boxes]);

  useEffect(() => {
    if (!data || sortedBoxes.length === 0) return;

    let animationFrameId: number;
    let lastTime = 0;
    const interval = 1000 / settings.fps;

    const animate = (time: number) => {
      if (time - lastTime >= interval) {
        setFrameIndex((prev) => (prev + 1) % sortedBoxes.length);
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [settings.fps, sortedBoxes.length, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || sortedBoxes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const box = sortedBoxes[frameIndex];
    if (!box) return;

    // Update canvas size to match sprite size * settings scale
    canvas.width = box.width * settings.scale;
    canvas.height = box.height * settings.scale;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = data.src;
    // We need to wait for load if it was a fresh object, but browser caches src. 
    // However, drawing inside an animation loop, we assume image is loaded.
    // To be safe with React renders, we can use the cached Image object if we had one context-wide, 
    // but `new Image()` with same src is usually fast enough from cache.
    
    // Better: Draw immediately if possible.
    ctx.drawImage(
      img,
      box.x, box.y, box.width, box.height,
      0, 0, canvas.width, canvas.height
    );

  }, [frameIndex, data, sortedBoxes, settings.scale]);

  if (!data) return null;

  if (sortedBoxes.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic">
        Slice image to see preview
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-900 p-4 rounded-lg border border-slate-800">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Preview</h3>
      <div 
        className="relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-slate-800 rounded border border-slate-700 shadow-lg flex items-center justify-center overflow-hidden"
        style={{ minWidth: '100px', minHeight: '100px' }}
      >
         {/* Checkerboard background for transparency */}
         <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(45deg, #475569 25%, transparent 25%), linear-gradient(-45deg, #475569 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #475569 75%), linear-gradient(-45deg, transparent 75%, #475569 75%)`,
            backgroundSize: '16px 16px',
          }}
        />
        <canvas ref={canvasRef} className="pixelated relative z-10" />
      </div>
      <div className="mt-4 text-xs text-slate-400">
        Frame: {frameIndex + 1} / {sortedBoxes.length}
      </div>
    </div>
  );
};