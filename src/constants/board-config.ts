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

// Per-button vertical offsets (negative = shift UP)
const VERTICAL_OFFSETS: Record<number, number> = {
  7: -1.5,   // Middle row, 3rd button from left
  10: -2.5,  // Bottom row
  11: -2.5,
  12: -2.5,
  13: -2.5,
  14: -2.5,
};

export const BUTTON_REGIONS: ButtonRegion[] = calculateRegions();

// Mapping individual buttons to static audio assets
export const SOUND_MAPPING: Record<number, string> = {
  0: 'tv-total.mp3',
};

// Custom handwriting labels
export const SOUND_LABELS: Record<number, string> = {
  0: 'Hallo',
};
