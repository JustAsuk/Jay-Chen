export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheetData {
  src: string;
  width: number;
  height: number;
  file?: File;
}

export interface AnimationSettings {
  fps: number;
  loop: boolean;
  transparent: string | null; // Hex color or null
  scale: number;
}

// Type definition for the global GIF library loaded via script tag
declare global {
  interface Window {
    GIF: any;
  }
}

export enum SliceMode {
  GRID = 'GRID',
  AI = 'AI',
  MANUAL = 'MANUAL' // Placeholder for future expansion
}