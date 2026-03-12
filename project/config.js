// config.js
// Central configuration for grid, shapes, and colors.

export const GRID_SIZE = 40; // px
export const INITIAL_BOARD_WIDTH = 1200;
export const INITIAL_BOARD_HEIGHT = 800;
export const BOARD_EXPAND_MARGIN = 80; // expand board when dragging near edge
export const BOARD_EXPAND_STEP = 4 * GRID_SIZE; // how much to grow in one step

// Shape palette definitions
export const SHAPE_TYPES = {
  circle: {
    id: "circle",
    label: "Circle",
    baseColor: "#ffb3ba",
    // radius in px for board shapes
    radius: 18,
  },
  square: {
    id: "square",
    label: "Square",
    baseColor: "#bae1ff",
    size: 36,
  },
  rectangle: {
    id: "rectangle",
    label: "Rectangle",
    baseColor: "#ffdfba",
    width: 56,
    height: 30,
  },
  triangle: {
    id: "triangle",
    label: "Triangle",
    baseColor: "#baffc9",
    // equilateral-ish triangle bounding box
    width: 48,
    height: 42,
  },
  star: {
    id: "star",
    label: "Star",
    baseColor: "#ffffba",
    radiusOuter: 24,
    radiusInner: 11,
  },
};

// Challenge / scoring
export const SCORE_PER_CORRECT_PLACEMENT = 10;

// Simple bright palette for board shapes (by type)
export const SHAPE_COLORS = {
  circle: "#ff9aa2",
  square: "#a2d2ff",
  rectangle: "#ffdac1",
  triangle: "#b5ead7",
  star: "#fff5ba",
};