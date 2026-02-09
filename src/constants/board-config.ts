export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * BUTTON REGIONS defined as percentages of the SOURCE IMAGE.
 * These coordinates are relative to the original board image,
 * NOT the screen. The component will translate them to screen
 * coordinates by calculating the actual rendered image bounds.
 */
const ROWS = 3;
const COLS = 5;

// Grid position within the SOURCE IMAGE (in %)
const GRID_TOP = 14.0;
const GRID_LEFT = 9.5;
const GRID_RIGHT = 9.5;
const GRID_BOTTOM = 10.0;

// Gaps within the source image (in %)
const GAP_X = 2.0;
const GAP_Y = 5.5;

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

export const BUTTON_REGIONS: ButtonRegion[] = calculateRegions();

// Mapping individual buttons to static audio assets
export const SOUND_MAPPING: Record<number, string> = {
  0: 'tv-total.mp3',
};
