// dragDrop.js
// DragDropController: manages dragging, snapping, rotation selection, and placement feedback.

import { GridSnapEngine } from "./snap.js";
import { isValidPlacement } from "./collision.js";

/**
 * DragDropController wires pointer events so that:
 * - Shapes can be created by dragging from the palette.
 * - Shapes can be moved on the board.
 * - Snapping & collision validity are visualized in real time.
 * - If a drop is invalid, shapes go back to their last valid position.
 */
export class DragDropController {
  constructor(svg, boardRenderer, shapeManager, uiCallbacks) {
    this.svg = svg;
    this.boardRenderer = boardRenderer;
    this.shapeManager = shapeManager;
    this.snapEngine = new GridSnapEngine();
    this.uiCallbacks = uiCallbacks;

    // dragState:
    // { shapeState, offsetX, offsetY, isNew, startX, startY, lastValidX, lastValidY }
    this.dragState = null;

    this._onPointerDownFromPalette = this._onPointerDownFromPalette.bind(this);
    this._onPointerDownOnBoardShape = this._onPointerDownOnBoardShape.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  /** Initialize drag handlers on palette and SVG. */
  init(paletteRoot) {
    if (paletteRoot) {
      paletteRoot.addEventListener("pointerdown", this._onPointerDownFromPalette);
    }
    if (this.svg) {
      this.svg.addEventListener("pointerdown", this._onPointerDownOnBoardShape);
    }

    window.addEventListener("pointermove", this._onPointerMove);
    window.addEventListener("pointerup", this._onPointerUp);
  }

  /** Pointer down on a palette shape: spawn + start dragging immediately. */
  _onPointerDownFromPalette(e) {
    const tool = e.target.closest(".shape-tool");
    if (!tool) return;

    e.preventDefault();

    const type = tool.dataset.shapeType;
    if (!type) return;

    const svgPoint = this._toSvgPoint(e.clientX, e.clientY);
    const { x: snappedX, y: snappedY } = this.snapEngine.snap(svgPoint.x, svgPoint.y);

    // Make sure board is large enough
    this.boardRenderer.ensurePointVisible(snappedX, snappedY);

    const shapeState = this.shapeManager.createShape(type, snappedX, snappedY);
    if (!shapeState) return;

    // Initial offset between pointer and shape anchor
    const dx = svgPoint.x - snappedX;
    const dy = svgPoint.y - snappedY;

    this.dragState = {
      shapeState,
      offsetX: dx,
      offsetY: dy,
      isNew: true,
      startX: snappedX,
      startY: snappedY,
      lastValidX: snappedX,
      lastValidY: snappedY,
    };

    // Visual selection
    this._markSelected(shapeState);
    this._updateShapeDragVisual(shapeState, true);
  }

  /** Pointer down on an existing shape on the board: start moving that shape. */
  _onPointerDownOnBoardShape(e) {
    if (e.button !== 0) return; // left button only

    const target = e.target;
    const shapeState = this.shapeManager.findByElement(target);
    if (!shapeState) return;

    e.preventDefault();

    const svgPoint = this._toSvgPoint(e.clientX, e.clientY);
    const dx = svgPoint.x - shapeState.x;
    const dy = svgPoint.y - shapeState.y;

    this.dragState = {
      shapeState,
      offsetX: dx,
      offsetY: dy,
      isNew: false,
      startX: shapeState.x,
      startY: shapeState.y,
      lastValidX: shapeState.x,
      lastValidY: shapeState.y,
    };

    this._markSelected(shapeState);
    this._updateShapeDragVisual(shapeState, true);
  }

  /** Pointer move: follow pointer, snap to grid, show valid/invalid placement. */
  _onPointerMove(e) {
    if (!this.dragState) return;

    e.preventDefault();

    const { shapeState, offsetX, offsetY } = this.dragState;
    const svgPoint = this._toSvgPoint(e.clientX, e.clientY);

    // Raw anchor position before snapping
    const rawX = svgPoint.x - offsetX;
    const rawY = svgPoint.y - offsetY;

    // Snap to nearest peg
    const { x: snappedX, y: snappedY } = this.snapEngine.snap(rawX, rawY);

    // Grow board if needed
    this.boardRenderer.ensurePointVisible(snappedX, snappedY);

    // Move shape to snapped position
    this.shapeManager.updateState(shapeState.id, { x: snappedX, y: snappedY });

    // Validate placement against board + other shapes
    const { width: bw, height: bh } = this.boardRenderer.getSize();
    const allShapes = this.shapeManager.getAll().map(s => s.el);
    const isValid = isValidPlacement(shapeState.el, allShapes, bw, bh);

    // Remember last valid position so we can "snap back" if user drops in invalid spot
    if (isValid) {
      this.dragState.lastValidX = snappedX;
      this.dragState.lastValidY = snappedY;
    }

    this._setPlacementClass(shapeState.el, isValid);
  }

  /** Pointer up: finalize placement or revert to last valid position. */
  _onPointerUp() {
    if (!this.dragState) return;

    const { shapeState, isNew, startX, startY, lastValidX, lastValidY } = this.dragState;
    const { width: bw, height: bh } = this.boardRenderer.getSize();
    const allShapes = this.shapeManager.getAll().map((s) => s.el);
    const isValid = isValidPlacement(shapeState.el, allShapes, bw, bh);

    if (!isValid) {
      if (isNew) {
        // Brand-new shape dropped in a bad spot -> delete it
        this.shapeManager.deleteShape(shapeState.id);
        if (this.uiCallbacks.onShapeDeleted) {
          this.uiCallbacks.onShapeDeleted(shapeState);
        }
      } else {
        // Existing shape -> snap back to last valid position
        const backX = lastValidX ?? startX;
        const backY = lastValidY ?? startY;
        this.shapeManager.updateState(shapeState.id, { x: backX, y: backY });
      }
    } else {
      // Valid placement, keep where it is
      if (this.uiCallbacks.onShapePlaced) {
        this.uiCallbacks.onShapePlaced(shapeState);
      }
    }

    this._setPlacementClass(shapeState.el, null);
    this._updateShapeDragVisual(shapeState, false);
    this.dragState = null;
  }

  /** Convert screen (client) coordinates to SVG coordinates. */
  _toSvgPoint(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    const ctm = this.svg.getScreenCTM();
    if (!ctm) {
      return { x: 0, y: 0 };
    }
    const inv = ctm.inverse();
    const svgPt = pt.matrixTransform(inv);
    return { x: svgPt.x, y: svgPt.y };
  }

  /** Highlight selected shape and notify UI. */
  _markSelected(shapeState) {
    for (const s of this.shapeManager.getAll()) {
      s.el.classList.remove("selected");
    }
    shapeState.el.classList.add("selected");
    if (this.uiCallbacks.onSelectShape) {
      this.uiCallbacks.onSelectShape(shapeState);
    }
  }

  /** Apply drag visual styling. */
  _updateShapeDragVisual(shapeState, isDragging) {
    const el = shapeState.el;
    if (isDragging) {
      el.style.transition = "transform 0.05s linear";
    } else {
      el.style.transition = "";
    }
  }

  /** Add / remove valid / invalid CSS classes. */
  _setPlacementClass(el, isValid) {
    el.classList.remove("valid-placement", "invalid-placement");
    if (isValid === true) {
      el.classList.add("valid-placement");
    } else if (isValid === false) {
      el.classList.add("invalid-placement");
    }
  }
}