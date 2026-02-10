export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Button regions as percentages of the SOURCE IMAGE.
 * The component translates these to screen coords using
 * the actual rendered image bounds (accounting for object-cover).
 */
const ROWS = 3;
const COLS = 5;

// Grid position within the SOURCE IMAGE (in %)
const GRID_TOP = 14.8;
const GRID_LEFT = 12.2;
const GRID_RIGHT = 10.0;
const GRID_BOTTOM = 11.0;

// Gaps within the source image (in %)
const GAP_X = 1.6;
const GAP_Y = 4.0;

const calculateRegions = (): ButtonRegion[] => {
  const regions: ButtonRegion[] = [];

  const gridWidth = 100 - GRID_LEFT - GRID_RIGHT;
  const gridHeight = 100 - GRID_TOP - GRID_BOTTOM;

  const cellWidth = (gridWidth - (COLS - 1) * GAP_X) / COLS;
  const cellHeight = (gridHeight - (ROWS - 1) * GAP_Y) / ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      regions.push({
        top: GRID_TOP + r * (cellHeight + GAP_Y),
        left: GRID_LEFT + c * (cellWidth + GAP_X),
        width: cellWidth,
        height: cellHeight,
      });
    }
  }

  return regions;
};

// Per-button offsets (negative = shift UP/LEFT, positive = shift DOWN/RIGHT)
const VERTICAL_OFFSETS: Record<number, number> = {
  0: -1.8,   // Top row
  1: -1.8,
  2: -1.8,
  3: -1.8,
  4: -1.8,
  5: -3.85,  // Middle row (nudged 1mm up from -3.49)
  6: -3.85,
  7: -3.85,
  8: -3.85,
  9: -3.85,
  10: -5.70, // Bottom row (nudged 1mm up from -5.34)
  11: -5.70,
  12: -5.70,
  13: -5.70,
  14: -5.70,
};

const HORIZONTAL_OFFSETS: Record<number, number> = {
  0: -1.1,   // Top row (nudged 2mm right from -1.8)
  1: -1.1,
  2: -1.1,
  3: -1.1,
  4: -1.1,
  5: -0.5,   // Middle row (1.5mm left)
  6: -0.5,
  7: -0.5,
  8: -0.5,
  9: -0.5,
  10: -0.7,  // Bottom row (2mm left)
  11: -0.7,
  12: -0.7,
  13: -0.7,
  14: -0.7,
};

// Independent Label Offsets
const VERTICAL_OFFSETS_LABELS: Record<number, number> = {
  0: -0.72, // 2mm up
};

const HORIZONTAL_OFFSETS_LABELS: Record<number, number> = {
  0: 0.72,  // Start 2mm further right (shortening left side)
};

const WIDTH_OFFSETS_LABELS: Record<number, number> = {
  0: -1.44, // Total 4mm shorter (2mm from each side)
};

const HEIGHT_OFFSETS_LABELS: Record<number, number> = {
  // Add label-specific height adjustments here
};

// Final Button Regions (with per-button offsets)
export const BUTTON_REGIONS: ButtonRegion[] = calculateRegions().map((region, i) => {
  const vOffset = VERTICAL_OFFSETS[i] || 0;
  const hOffset = HORIZONTAL_OFFSETS[i] || 0;
  return { 
    ...region, 
    top: region.top + vOffset,
    left: region.left + hOffset 
  };
});

// Final Label Regions (Decoupled from buttons)
// Initially derived from current button-relative logic to maintain alignment
export const LABEL_REGIONS: ButtonRegion[] = calculateRegions().map((region, i) => {
  // 1. Initial button-sync offsets (to keep them in the same neighborhood)
  const vOffsetBtn = VERTICAL_OFFSETS[i] || 0;
  const hOffsetBtn = HORIZONTAL_OFFSETS[i] || 0;
  
  // 2. Independent label-specific micro-offsets
  const vOffsetLbl = VERTICAL_OFFSETS_LABELS[i] || 0;
  const hOffsetLbl = HORIZONTAL_OFFSETS_LABELS[i] || 0;
  const wOffsetLbl = WIDTH_OFFSETS_LABELS[i] || 0;
  const hSizeOffsetLbl = HEIGHT_OFFSETS_LABELS[i] || 0;

  const baseTop = region.top + vOffsetBtn;
  const baseLeft = region.left + hOffsetBtn;

  return {
    top: baseTop + region.height * 0.96 + vOffsetLbl,
    left: baseLeft + region.width * 0.02 + hOffsetLbl,
    width: region.width * 0.96 + wOffsetLbl,
    height: region.height * 0.20 + hSizeOffsetLbl
  };
});

// Mapping individual buttons to static audio assets
export const SOUND_MAPPING: Record<number, string> = {
  0: 'tv-total.mp3',
};

// Custom handwriting labels
export const SOUND_LABELS: Record<number, string> = {
  0: 'Hallo',
};
