// board.js
// BoardRenderer: draws the peg grid and manages dynamic board size.

/**
 * BoardRenderer is responsible for:
 * - Rendering the peg-hole grid using SVG elements.
 * - Tracking and updating the board's width/height.
 * - Expanding the board when shapes approach the edge.
 */
import { GRID_SIZE, INITIAL_BOARD_WIDTH, INITIAL_BOARD_HEIGHT, BOARD_EXPAND_MARGIN, BOARD_EXPAND_STEP } from "./config.js";

export class BoardRenderer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.width = INITIAL_BOARD_WIDTH;
    this.height = INITIAL_BOARD_HEIGHT;
  }

  /** Initialize the SVG board: set size and draw the peg grid. */
  init() {
    this.svg.setAttribute("width", this.width);
    this.svg.setAttribute("height", this.height);
    this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.drawGrid();
  }

  /** Remove any existing grid and redraw peg holes using the configured grid size. */
  drawGrid() {
    // Clear existing content
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    // Optional light background "wood" plate
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("x", 10);
    bgRect.setAttribute("y", 10);
    bgRect.setAttribute("width", this.width - 20);
    bgRect.setAttribute("height", this.height - 20);
    bgRect.setAttribute("rx", 24);
    bgRect.setAttribute("ry", 24);
    bgRect.setAttribute("fill", "#ffe8c7");
    bgRect.setAttribute("stroke", "#f2c89a");
    bgRect.setAttribute("stroke-width", "3");
    this.svg.appendChild(bgRect);

    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gridGroup.setAttribute("id", "pegGrid");
    this.svg.appendChild(gridGroup);

    // Create evenly spaced peg holes
    const startX = GRID_SIZE;
    const startY = GRID_SIZE;
    const cols = Math.floor((this.width - GRID_SIZE) / GRID_SIZE);
    const rows = Math.floor((this.height - GRID_SIZE) / GRID_SIZE);

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const cx = startX + col * GRID_SIZE;
        const cy = startY + row * GRID_SIZE;

        const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        outer.setAttribute("cx", cx + 1);
        outer.setAttribute("cy", cy + 2);
        outer.setAttribute("r", 7);
        outer.setAttribute("class", "peg-hole-shadow");
        gridGroup.appendChild(outer);

        const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hole.setAttribute("cx", cx);
        hole.setAttribute("cy", cy);
        hole.setAttribute("r", 6);
        hole.setAttribute("class", "peg-hole");
        gridGroup.appendChild(hole);
      }
    }
  }

  /**
   * Ensure the board is large enough to contain a given point (x, y).
   * If not, expand width/height and redraw grid without affecting shapes.
   */
  ensurePointVisible(x, y) {
    let expanded = false;

    if (x > this.width - BOARD_EXPAND_MARGIN) {
      this.width += BOARD_EXPAND_STEP;
      expanded = true;
    }
    if (y > this.height - BOARD_EXPAND_MARGIN) {
      this.height += BOARD_EXPAND_STEP;
      expanded = true;
    }

    if (expanded) {
      this.svg.setAttribute("width", this.width);
      this.svg.setAttribute("height", this.height);
      this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);

      // Preserve shapes: move them into a temp group, redraw grid, then append shapes back.
      const shapes = [];
      const children = Array.from(this.svg.children);

      for (const node of children) {
        if (node.dataset && node.dataset.shapeId) {
          shapes.push(node);
        }
      }

      // Redraw grid
      this.drawGrid();

      // Append shapes back (grid was cleared by drawGrid)
      for (const shapeEl of shapes) {
        this.svg.appendChild(shapeEl);
      }
    }
  }

  /** Get current board dimensions. */
  getSize() {
    return { width: this.width, height: this.height };
  }
}