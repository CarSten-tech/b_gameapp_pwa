export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Precision tuning based on Screenshot (Step Id: 431)
 * 
 * OBSERVATION:
 * The red glow in the image is significantly to the LEFT and slightly BELOW the actual button cap.
 * The boxes need to be smaller (focused on the cap only) and shifted RIGHT and UP.
 */

const PADDING_TOP = 13.0;    // Was 13.0, let's keep it but adjust GAP_Y
const PADDING_BOTTOM = 18.0; // Increased to compress grid from bottom
const PADDING_LEFT = 13.5;   // Was 8.8, SIGNIFICANT shift to the RIGHT
const PADDING_RIGHT = 8.0;   // Reduced to allow shift right
const GAP_X = 2.5;           // Increased gap between caps
const GAP_Y = 6.0;           // Significantly increased gap to skip labels

const ROWS = 3;
const COLS = 5;

const calculateRegions = (): ButtonRegion[] => {
  const regions: ButtonRegion[] = [];
  const contentWidth = 100 - PADDING_LEFT - PADDING_RIGHT;
  const contentHeight = 100 - PADDING_TOP - PADDING_BOTTOM;
  
  // Hitboxes are now smaller, focusing only on the round red part
  const cellWidth = (contentWidth - (COLS - 1) * GAP_X) / COLS;
  const cellHeight = (contentHeight - (ROWS - 1) * GAP_Y) / ROWS;

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
