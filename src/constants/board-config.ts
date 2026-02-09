export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * CENTERED GRID CONFIGURATION WITH PRECISION OFFSETS
 * Refined based on Screenshot (Step Id: 464)
 */
const ROWS = 3;
const COLS = 5;

// The size of the active area (the 5x3 grid)
const GRID_WIDTH = 78.0;   // Slightly narrower to match caps
const GRID_HEIGHT = 56.0;  // Slightly shorter

// PRECISION ALIGNMENT
// Screenshot shows glow is bottom-left of the button.
// We need to move it RIGHT (increase X) and UP (decrease Y).
const GRID_CENTER_X = 54.2; // Shifted right from 50.0
const GRID_CENTER_Y = 46.8; // Shifted up from 48.5

// Gaps between individual circular buttons
const GAP_X = 2.8;
const GAP_Y = 6.5;

const calculateRegions = (): ButtonRegion[] => {
  const regions: ButtonRegion[] = [];
  
  const cellWidth = (GRID_WIDTH - (COLS - 1) * GAP_X) / COLS;
  const cellHeight = (GRID_HEIGHT - (ROWS - 1) * GAP_Y) / ROWS;

  // Start coordinates anchored to the defined visual center
  const startX = GRID_CENTER_X - (GRID_WIDTH / 2);
  const startY = GRID_CENTER_Y - (GRID_HEIGHT / 2);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      regions.push({
        top: startY + r * (cellHeight + GAP_Y),
        left: startX + c * (cellWidth + GAP_X),
        width: cellWidth,
        height: cellHeight
      });
    }
  }
  
  return regions;
};

export const BUTTON_REGIONS: ButtonRegion[] = calculateRegions();

// Mapping individual buttons to static audio assets
export const SOUND_MAPPING: Record<number, string> = {
  0: 'tv-total.mp3', // First row, first button from left
};
