export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Precision tuning for object-cover (Full Screen)
const PADDING_TOP = 17.5;    // Pushes grid down
const PADDING_BOTTOM = 13.5; // Pushes grid up
const PADDING_LEFT = 9.5;   // Pushes from left
const PADDING_RIGHT = 9.5;  // Pushes from right
const GAP = 1.2;             // Slightly tighter gap

const ROWS = 3;
const COLS = 5;

const calculateRegions = (): ButtonRegion[] => {
  const regions: ButtonRegion[] = [];
  const contentWidth = 100 - PADDING_LEFT - PADDING_RIGHT;
  const contentHeight = 100 - PADDING_TOP - PADDING_BOTTOM;
  
  const cellWidth = (contentWidth - (COLS - 1) * GAP) / COLS;
  const cellHeight = (contentHeight - (ROWS - 1) * GAP) / ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      regions.push({
        top: PADDING_TOP + r * (cellHeight + GAP),
        left: PADDING_LEFT + c * (cellWidth + GAP),
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
