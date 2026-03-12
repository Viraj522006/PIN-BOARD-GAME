// collision.js
// Collision detection helpers: checks overlap and board bounds.

/**
 * Convert DOMRect to simple bbox object
 */
function rectToBBox(rect) {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
}

/**
 * Return true if two bounding boxes overlap (AABB)
 */
export function bboxesOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Check whether a bounding box is inside board
 */
export function bboxWithinBoard(bbox, boardWidth, boardHeight) {
  return (
    bbox.x >= 0 &&
    bbox.y >= 0 &&
    bbox.x + bbox.width <= boardWidth &&
    bbox.y + bbox.height <= boardHeight
  );
}

/**
 * Validate placement
 */
export function isValidPlacement(testElement, otherElements, boardWidth, boardHeight) {

  const bbox = rectToBBox(testElement.getBoundingClientRect());

  if (!bboxWithinBoard(bbox, boardWidth, boardHeight)) {
    return false;
  }

  for (const el of otherElements) {
    if (el === testElement) continue;

    const obb = rectToBBox(el.getBoundingClientRect());

    if (bboxesOverlap(bbox, obb)) {
      return false;
    }
  }

  return true;
}