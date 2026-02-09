export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Precision tuning based on Screenshot (Step Id: 411)
// The red boxes in the screenshot are slightly inconsistent with the button positions.
// We need to move the grid DOWN and make it slightly taller to cover the label too.
const PADDING_TOP = 13.0;    
const PADDING_BOTTOM = 8.0; 
const PADDING_LEFT = 8.8;   
const PADDING_RIGHT = 8.8;  
const GAP_X = 1.0;
const GAP_Y = 1.5;

const ROWS = 3;
const COLS = 5;

const calculateRegions = (): ButtonRegion[] => {
  const regions: ButtonRegion[] = [];
  const contentWidth = 100 - PADDING_LEFT - PADDING_RIGHT;
  const contentHeight = 100 - PADDING_TOP - PADDING_BOTTOM;
  
  const cellWidth = (contentWidth - (COLS - 1) * GAP_X) / COLS;
  const cellHeight = (contentHeight - (ROWS - 1) * GAP_Y) / ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let i_r = 0; i_r < ROWS; i_r++) {
        // We iterate r for rows
    }
    // Correct loop
  }
  
  // Re-writing the logic clearly
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      regions.push({
        top: PADDING_TOP + r * (cellHeight + GAP_Y),
        left: PADDING_LEFT + c * (cellWidth + GAP_X),
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
