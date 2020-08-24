# ControllerInputVisualizer
A simple webapp that visualizes the inputs of connected controllers using the JavaScript Gamepad API.

## Links

- `canvas`
  - [game loop (sitepoint)](https://www.sitepoint.com/quick-tip-game-loop-in-javascript/)
  - [game loop (mdn)](https://developer.mozilla.org/en-US/docs/Games/Anatomy)
  - [`window.requestAnimationFrame` (mdn)](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
  - [`window.cancelAnimationFrame` (mdn)](https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame)

- `Gamepad` API
  - [using the `Gamepad` API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)

## How to run

Open the [`index.html`](index.html) file with your browser.

**If you use modern browsers you need to create a static web server in the repository**:

- Python 3: `python3 -m http.server 8000 --bind 127.0.0.1` (then visit `http://127.0.0.1:8000/` in your browser)

## TODO

- Make default value visualization more beautiful
- Implement a visualization for the XBox controller
  - Add missing buttons
  - Add missing case
- Create button for debug view
- Add visualization profiles (`Firefox-XBox-One`, `Chrome-XBox-One`) to allow not recognized controllers to still be rendered and make a visualization work for other browsers
  - The profiles need to have checks like the length of axis and button arrays to not crash the page
