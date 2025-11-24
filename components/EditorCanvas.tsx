import React, { useRef, useEffect, useState } from 'react';
import { BoundingBox, SpriteSheetData } from '../types';

interface EditorCanvasProps {
  data: SpriteSheetData | null;
  boxes: BoundingBox[];
  zoom: number;
  onBoxUpdate: (boxes: BoundingBox[]) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ data, boxes, zoom, onBoxUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match zoomed image
    const displayWidth = data.width * zoom;
    const displayHeight = data.height * zoom;
    
    // Ensure canvas matches display size for sharpness if not pixelated, 
    // but for pixel art, we draw logic differently.
    // To keep it simple: Canvas size = logic size, CSS scales it visually?
    // No, let's make Canvas actual pixel size = image size * zoom.
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    img.src = data.src;
    img.onload = () => {
      // Draw Image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      // Draw Overlay
      ctx.strokeStyle = '#10b981'; // Emerald 500
      ctx.lineWidth = 2; // visual width
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';

      boxes.forEach((box, index) => {
        const x = box.x * zoom;
        const y = box.y * zoom;
        const w = box.width * zoom;
        const h = box.height * zoom;

        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        
        // Draw number
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, 20, 14);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${index + 1}`, x + 2, y + 10);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // Reset
      });
    };
  }, [data, boxes, zoom]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-700 rounded-xl m-4">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No image loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-auto w-full h-full bg-slate-900/50 relative flex items-center justify-center p-8 rounded-xl border border-slate-800">
      {/* Checkerboard background for transparency */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      />
      <canvas 
        ref={canvasRef}
        className="relative z-10 shadow-2xl shadow-black pixelated"
      />
    </div>
  );
};