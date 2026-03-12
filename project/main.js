// main.js
// Entry point: wires up board, shapes, drag-drop, rotation, delete, reset, scoring, and sounds.

import { BoardRenderer } from "./board.js";
import { ShapeManager } from "./shapes.js";
import { DragDropController } from "./dragDrop.js";
import { SHAPE_TYPES, SCORE_PER_CORRECT_PLACEMENT } from "./config.js";

// ----- Simple sound feedback using Web Audio (no external files) -----

/** Play a short "snap" sound using Web Audio API. */
function playSnapSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore errors if AudioContext cannot be created (older/locked browsers).
  }
}

// ----- Challenge & scoring -----

/**
 * GameController handles:
 * - Current challenge shape.
 * - Score updates.
 * - Reactions when shapes are placed or deleted.
 */
class GameController {
  constructor(shapeManager) {
    this.shapeManager = shapeManager;
    this.score = 0;
    this.currentChallenge = null;

    this.scoreEl = document.getElementById("scoreValue");
    this.challengeNameEl = document.getElementById("challengeShapeName");
  }

  /** Select a random challenge shape and update UI. */
  newChallenge() {
    const keys = Object.keys(SHAPE_TYPES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    this.currentChallenge = randomKey;
    this.challengeNameEl.textContent = SHAPE_TYPES[randomKey].label;
  }

  /** Increase score if shape matches current challenge. */
  handleShapePlaced(state) {
    if (this.currentChallenge && state.type === this.currentChallenge) {
      this.score += SCORE_PER_CORRECT_PLACEMENT;
      this.updateScoreUi();
    }
    playSnapSound();
  }

  /** Optionally adjust score when shapes are deleted (here: no penalty). */
  handleShapeDeleted() {
    // Could subtract score or leave as-is; we leave it unchanged for kids.
  }

  /** Reset score and challenge. */
  reset() {
    this.score = 0;
    this.updateScoreUi();
    this.newChallenge();
  }

  updateScoreUi() {
    this.scoreEl.textContent = String(this.score);
  }
}

// ----- Bootstrapping -----

document.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("pegBoard");
  const palette = document.querySelector(".shape-toolbar");
  const rotateBtn = document.getElementById("rotateBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const resetBtn = document.getElementById("resetBoardBtn");
  const newChallengeBtn = document.getElementById("newChallengeBtn");

  const boardRenderer = new BoardRenderer(svg);
  boardRenderer.init();

  const shapeManager = new ShapeManager(svg);
  const game = new GameController(shapeManager);
  game.newChallenge();

  let selectedShape = null;

  /** Update rotate/delete button enabled state based on selection. */
  function refreshSelectionUi() {
    const hasSelection = !!selectedShape;
    rotateBtn.disabled = !hasSelection;
    deleteBtn.disabled = !hasSelection;
  }

  // Drag & drop controller with callbacks to integrate with selection and game logic.
  const dragDrop = new DragDropController(svg, boardRenderer, shapeManager, {
    onSelectShape: (state) => {
      selectedShape = state;
      refreshSelectionUi();
    },
    onShapePlaced: (state) => {
      game.handleShapePlaced(state);
    },
    onShapeDeleted: (state) => {
      if (selectedShape && selectedShape.id === state.id) {
        selectedShape = null;
        refreshSelectionUi();
      }
      game.handleShapeDeleted(state);
    },
  });

  dragDrop.init(palette);

  // Rotate button: rotate current selection by 90° and keep snapping valid.
  rotateBtn.addEventListener("click", () => {
    if (!selectedShape) return;
    const newRotation = (selectedShape.rotation + 90) % 360;
    shapeManager.updateState(selectedShape.id, { rotation: newRotation });
    selectedShape = shapeManager.shapes.get(selectedShape.id); // refresh reference
  });

  // Delete button: remove selected shape from board.
  deleteBtn.addEventListener("click", () => {
    if (!selectedShape) return;
    shapeManager.deleteShape(selectedShape.id);
    selectedShape = null;
    refreshSelectionUi();
  });

  // Reset board: clear shapes, reset score & challenge.
  resetBtn.addEventListener("click", () => {
    shapeManager.clearAll();
    selectedShape = null;
    refreshSelectionUi();
    game.reset();
  });

  // New random challenge
  newChallengeBtn.addEventListener("click", () => {
    game.newChallenge();
  });

  // Initial UI state
  refreshSelectionUi();
});