// snap.js
// GridSnapEngine: snaps raw coordinates to the nearest grid point.

/**
 * GridSnapEngine is responsible for:
 * - Converting continuous drag coordinates into snapped grid positions.
 * - Ensuring snapping remains consistent even when shapes are rotated.
 */
import { GRID_SIZE } from "./config.js";

export class GridSnapEngine {
  /** Snap raw x/y coordinates to the nearest grid intersection using a 40px grid. */
  snap(x, y) {
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    return { x: snappedX, y: snappedY };
  }
}