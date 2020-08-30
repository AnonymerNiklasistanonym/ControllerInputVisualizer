# ControllerInputVisualizer

A simple webapp that visualizes the inputs of connected controllers using the JavaScript Gamepad API.

## Links

- `canvas`
  - [game loop (sitepoint)](https://www.sitepoint.com/quick-tip-game-loop-in-javascript/)
  - [game loop (mdn)](https://developer.mozilla.org/en-US/docs/Games/Anatomy)
  - [`window.requestAnimationFrame` (mdn)](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
  - [`window.cancelAnimationFrame` (mdn)](https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame)

- Gamepad API
  - [using the Gamepad API (mdn)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)

- Web app manifest:
  - [Web app manifests (mdn)](https://developer.mozilla.org/en-US/docs/Web/Manifest)

- Web Storage API
  - [Using the Web Storage API (mdn)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)

## How to run

Open the [`index.html`](index.html) file with your browser.

**If you use modern browsers you need to create a static web server in the repository**:

- Python 3: `python3 -m http.server 8000 --bind 127.0.0.1` (then visit `http://127.0.0.1:8000/` in your browser)

## TODO

Not important right now:

- Make settings/options part look more modern
- Allow a custom zoom scale (with a minimum width/height and where the maximum is the current canvas maximum width/height)
- Add export/import of user profiles
- Add ability to save screenshot of the current canvas
