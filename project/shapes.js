// shapes.js
// ShapeManager: creates, stores, and updates shapes on the board.

import { SHAPE_TYPES, SHAPE_COLORS } from "./config.js";

/**
 * ShapeManager keeps track of all placed shapes and provides helpers to:
 * - Create new shapes on the board.
 * - Delete shapes.
 * - Look up shapes by SVG element.
 * - Update position & rotation state when moving/rotating.
 */
export class ShapeManager {
  constructor(svgElement) {
    this.svg = svgElement;
    this.shapes = new Map(); // id -> shapeState
    this.nextId = 1;
  }

  /** Create a new shape of the given type at an initial raw position (x, y). */
  createShape(typeId, x, y) {
    const def = SHAPE_TYPES[typeId];
    if (!def) return null;

    const id = String(this.nextId++);
    const el = this._createSvgShapeElement(typeId, def);
    el.dataset.shapeId = id;
    el.dataset.shapeType = typeId;
    el.classList.add("board-shape");

    const state = {
      id,
      type: typeId,
      el,
      x,
      y,
      rotation: 0, // degrees
    };

    this.applyTransform(state);
    this.svg.appendChild(el);
    this.shapes.set(id, state);
    return state;
  }

  /** Delete a shape by id. */
  deleteShape(id) {
    const state = this.shapes.get(id);
    if (!state) return;
    if (state.el && state.el.parentNode) {
      state.el.parentNode.removeChild(state.el);
    }
    this.shapes.delete(id);
  }

  /** Clear all shapes from board. */
  clearAll() {
    for (const state of this.shapes.values()) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
    this.shapes.clear();
  }

  /** Find shape state by SVG element (e.g. from event.target). */
  findByElement(el) {
    let current = el;
    while (current && current !== this.svg) {
      if (current.dataset && current.dataset.shapeId) {
        return this.shapes.get(current.dataset.shapeId) || null;
      }
      current = current.parentNode;
    }
    return null;
  }

  /** Get all shape states as an array. */
  getAll() {
    return Array.from(this.shapes.values());
  }

  /** Update position and rotation and apply SVG transform. */
  updateState(id, { x, y, rotation }) {
    const state = this.shapes.get(id);
    if (!state) return;
    if (typeof x === "number") state.x = x;
    if (typeof y === "number") state.y = y;
    if (typeof rotation === "number") state.rotation = rotation % 360;
    this.applyTransform(state);
  }

  /** Apply the translate/rotate transform to a given shape state. */
  applyTransform(state) {
  const { el, x, y, rotation } = state;

  const bbox = el.getBBox();

  const cx = bbox.width / 2;
  const cy = bbox.height / 2;

  const transform = `
    translate(${x} ${y})
    rotate(${rotation} ${cx} ${cy})
  `;

  el.setAttribute("transform", transform);
}

  /** Internal: create a concrete SVG shape (circle, rect, polygon) based on definition. */
  _createSvgShapeElement(typeId, def) {
    const ns = "http://www.w3.org/2000/svg";
    const group = document.createElementNS(ns, "g");
    const color = SHAPE_COLORS[typeId] || def.baseColor || "#cccccc";

    if (typeId === "circle") {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", 0);
      circle.setAttribute("cy", 0);
      circle.setAttribute("r", def.radius);
      circle.setAttribute("fill", color);
      group.appendChild(circle);
    } else if (typeId === "square") {
      const half = def.size / 2;
      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", -half);
      rect.setAttribute("y", -half);
      rect.setAttribute("width", def.size);
      rect.setAttribute("height", def.size);
      rect.setAttribute("rx", 4);
      rect.setAttribute("ry", 4);
      rect.setAttribute("fill", color);
      group.appendChild(rect);
    } else if (typeId === "rectangle") {
      const halfW = def.width / 2;
      const halfH = def.height / 2;
      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", -halfW);
      rect.setAttribute("y", -halfH);
      rect.setAttribute("width", def.width);
      rect.setAttribute("height", def.height);
      rect.setAttribute("rx", 5);
      rect.setAttribute("ry", 5);
      rect.setAttribute("fill", color);
      group.appendChild(rect);
    } else if (typeId === "triangle") {
      const w = def.width;
      const h = def.height;
      // Centered around (0,0)
      const p1 = `0,${-h / 2}`;
      const p2 = `${-w / 2},${h / 2}`;
      const p3 = `${w / 2},${h / 2}`;
      const poly = document.createElementNS(ns, "polygon");
      poly.setAttribute("points", `${p1} ${p2} ${p3}`);
      poly.setAttribute("fill", color);
      group.appendChild(poly);
    } else if (typeId === "star") {
      const points = [];
      const outer = def.radiusOuter;
      const inner = def.radiusInner;
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i;
        const r = i % 2 === 0 ? outer : inner;
        const px = r * Math.sin(angle);
        const py = -r * Math.cos(angle);
        points.push(`${px},${py}`);
      }
      const poly = document.createElementNS(ns, "polygon");
      poly.setAttribute("points", points.join(" "));
      poly.setAttribute("fill", color);
      group.appendChild(poly);
    }

    return group;
  }
}