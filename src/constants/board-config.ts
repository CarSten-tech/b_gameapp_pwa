export interface ButtonRegion {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ROWS = 3;
const COLS = 5;

// These are base estimates based on the screenshot provided.
// They can be individually tuned if specific buttons are off.
const PADDING_TOP = 14.5;
const PADDING_BOTTOM = 11.5;
const PADDING_LEFT = 7.5;
const PADDING_RIGHT = 7.5;
const GAP = 1.5;

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
