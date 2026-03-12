# Digital Peg Board Geometry Game

A browser-based educational game for children to explore **geometric shapes** on a virtual **peg board**, featuring:

- Drag & drop shapes
- Grid snapping (40px peg spacing)
- Shape rotation
- Collision detection (no overlapping shapes)
- Reset board, delete shape
- Scoring & random shape challenges
- Fun colors, animations, and sound feedback

## Tech Stack

- **HTML5**
- **CSS3**
- **JavaScript (ES6 modules)**
- **SVG** for the board and shapes

## Running Locally

1. Place all project files in a folder, e.g., `PIN BOARD GAME`.
2. Start a simple static server from that folder (recommended to avoid ES module file restrictions):

   ```bash
   # Option A: Node + npx (if installed)
   npx serve .

   # Option B: Python 3
   python -m http.server 8000

   # Option C: VS Code "Live Server" extension