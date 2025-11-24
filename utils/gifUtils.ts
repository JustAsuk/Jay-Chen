import { BoundingBox, AnimationSettings } from "../types";

// Helper to load the GIF worker from a blob to avoid CORS/Path issues with external worker files
const getWorkerBlob = async () => {
  try {
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const workerScript = await response.text();
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Failed to load GIF worker script", e);
    throw e;
  }
};

export const generateGif = async (
  imageSrc: string,
  boxes: BoundingBox[],
  settings: AnimationSettings
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    if (!window.GIF) {
      reject(new Error("GIF.js library not loaded"));
      return;
    }

    const workerUrl = await getWorkerBlob();
    
    const gif = new window.GIF({
      workers: 2,
      quality: 10,
      workerScript: workerUrl,
      width: boxes[0].width * settings.scale,
      height: boxes[0].height * settings.scale,
      transparent: settings.transparent ? parseInt(settings.transparent.replace('#', '0x'), 16) : null
    });

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      // Sort boxes by ID or position? usually visual order (Row major)
      // Let's sort by Y then X to ensure correct animation order if user sliced weirdly
      const sortedBoxes = [...boxes].sort((a, b) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) > 10) return yDiff; // Tolerance for slightly misaligned rows
        return a.x - b.x;
      });

      sortedBoxes.forEach(box => {
        // Create a frame canvas
        canvas.width = box.width * settings.scale;
        canvas.height = box.height * settings.scale;
        
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // If we want a transparent background, we don't fill rect.
        // If scaling:
        ctx.imageSmoothingEnabled = false; // Pixel art style
        
        ctx.drawImage(
          img,
          box.x, box.y, box.width, box.height, // Source
          0, 0, box.width * settings.scale, box.height * settings.scale // Dest
        );

        gif.addFrame(canvas, { delay: 1000 / settings.fps, copy: true });
      });

      gif.on('finished', (blob: Blob) => {
        URL.revokeObjectURL(workerUrl);
        resolve(blob);
      });

      gif.render();
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(workerUrl);
      reject(err);
    };
  });
};