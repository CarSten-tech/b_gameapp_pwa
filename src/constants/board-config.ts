export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * CENTERED GRID CONFIGURATION
 * This makes the alignment more robust across different screen sizes.
 */
const ROWS = 3;
const COLS = 5;

// The size of the active area (the 5x3 grid) as a percentage of the screen
const GRID_WIDTH = 80.0;  // Total width of the 15-button area
const GRID_HEIGHT = 58.0; // Total height of the 15-button area

// The vertical offset of the entire grid (to move it down)
const GRID_CENTER_Y = 48.5; // 50 is dead center. > 50 moves it down.

// Gaps between individual circular buttons
const GAP_X = 2.5;
const GAP_Y = 6.0;

const calculateRegions = (): ButtonRegion[] => {
  const regions: ButtonRegion[] = [];
  
  // Calculate individual cell dimensions
  const cellWidth = (GRID_WIDTH - (COLS - 1) * GAP_X) / COLS;
  const cellHeight = (GRID_HEIGHT - (ROWS - 1) * GAP_Y) / ROWS;

  // Start coordinates for the top-left cell to keep the grid centered
  const startX = 50 - (GRID_WIDTH / 2);
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
