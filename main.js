/**
 * Container for all currently connected gamepads
 * @type {Map<number, Gamepad>}
 * @global
 */
const globalGamepads = new Map()

/**
 * The latest ID of the current animation request
 * @type {number}
 * @global
 */
let globalAnimationFrameRequest

/**
 * Indicator if the previous render request rendered already an empty frame
 * (this is used to cancel the rendering if no gamepads are connected)
 * @type {boolean}
 * @global
 */
let globalEmptyFrameAlreadyRendered

/**
 * Save the time of the last rendered frame for time deltas between frames
 * (this is used to calculate the delta time between rendering frames)
 * @type {number}
 * @global
 */
let globalTimeLastFrame

/**
 * The canvas in which everything is rendered
 * @type {HTMLCanvasElement}
 * @global
 */
let globalCanvas

/**
 * The 2D rendering context of the canvas
 * @type {CanvasRenderingContext2D}
 * @global
 */
let globalCtx

/**
 * Indicates if debugging is activated
 */
let globalDebug = true

/**
 * https://stackoverflow.com/a/28056903
 * @param {string} hex Hex color with 6 numbers
 * @param {number} alpha Alpha value
 */
const hexToRgba = (hex, alpha = undefined) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    if (alpha === undefined) {
        alpha = 1.0
    }
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

/**
 * Add a connected gamepad
 * @param {Gamepad} gamepad Gamepad to add
 */
function addGamepad(gamepad) {
    /* >> Temporary HTML debugging */
    if (globalDebug) {
        const htmlGamepad = document.createElement("div")
        htmlGamepad.setAttribute("id", "gamepad" + gamepad.index)
        const htmlGamepadTitle = document.createElement("h1")
        htmlGamepadTitle.appendChild(document.createTextNode("gamepad: " + gamepad.id))
        htmlGamepad.appendChild(htmlGamepadTitle)
        const htmlGamepadButtons = document.createElement("div")
        htmlGamepadButtons.className = "buttons"
        for (const [gamepadId, _] of gamepad.buttons.entries()) {
            const htmlGamepadButton = document.createElement("span")
            htmlGamepadButton.innerHTML = gamepadId.toString()
            htmlGamepadButtons.appendChild(htmlGamepadButton)
        }
        htmlGamepad.appendChild(htmlGamepadButtons)
        const htmlGamepadAxes = document.createElement("div")
        htmlGamepadAxes.className = "axes"
        for (const [gamepadAxisId, _] of gamepad.axes.entries()) {
            const htmlGamepadAxis = document.createElement("progress")
            htmlGamepadAxis.className = "axis"
            htmlGamepadAxis.setAttribute("max", "2")
            htmlGamepadAxis.setAttribute("value", "1")
            htmlGamepadAxis.innerHTML = gamepadAxisId.toString()
            htmlGamepadAxes.appendChild(htmlGamepadAxis)
        }
        htmlGamepad.appendChild(htmlGamepadAxes)
        document.body.appendChild(htmlGamepad)
    }
    /* << Temporary HTML debugging */

    globalGamepads.set(gamepad.index, gamepad)

    if (gamepad.vibrationActuator) {
        gamepad.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 300,
            weakMagnitude: 0.5,
            strongMagnitude: 1.0
        }).catch(console.error)
    }
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
}

/**
 * Remove a connected gamepad
 * @param {Gamepad} gamepad Gamepad to remove
 */
function removeGamepad(gamepad) {
    /* >> Temporary HTML debugging */
    if (globalDebug) {
        const htmlGamepad = document.getElementById("gamepad" + gamepad.index)
        document.body.removeChild(htmlGamepad)
    }
    /* << Temporary HTML debugging */

    globalGamepads.delete(gamepad.index)
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
}

/**
 * Update connected gamepads
 */
const updateGamepads = () => {
    for (const gamepad of navigator.getGamepads()) {
        // This can be temporarily undefined!
        if (gamepad) {
            if (globalGamepads.has(gamepad.index)) {
                globalGamepads.set(gamepad.index, gamepad)
            } else {
                addGamepad(gamepad)
            }
        }
    }

    /* >> Temporary HTML debugging */
    if (globalDebug) {
        for (const [gamepadId, gamepad] of globalGamepads.entries()) {
            const htmlGamepad = document.getElementById("gamepad" + gamepadId)
            /** @type {HTMLCollectionOf<HTMLDivElement>} */
            // @ts-ignore
            const htmlButtons = htmlGamepad.getElementsByClassName("button")
            for (const [controllerButtonId, controllerButton] of gamepad.buttons.entries()) {
                const htmlButton = htmlButtons[controllerButtonId]
                // Can be temporarily undefined!
                if (htmlButton) {
                    let pressed = controllerButton.pressed
                    let pressedValue = controllerButton.value
                    const pct = Math.round(pressedValue * 100) + "%"
                    htmlButton.style.backgroundSize = pct + " " + pct
                    htmlButton.className = pressed ? "button pressed" : "button"
                }
            }
            const htmlAxes = htmlGamepad.getElementsByClassName("axis")
            for (const [axisId, axis] of gamepad.axes.entries()) {
                const htmlAxis = htmlAxes[axisId]
                // Can be temporarily undefined!
                if (htmlAxis) {
                    htmlAxis.innerHTML = axisId + ": " + axis.toFixed(4)
                    htmlAxis.setAttribute("value", `${axis + 1}`)
                }
            }
        }
    }
    /* << Temporary HTML debugging */
}

window.addEventListener("gamepadconnected", e => {
    /* >> Temporary console debugging */
    if (globalDebug) {
        /** @type{Gamepad} */
        // @ts-ignore
        const gamepad = e.gamepad
        console.debug("Gamepad connected at index %d: %s. %d buttons, %d axes.",
            gamepad.index, gamepad.id, gamepad.buttons.length, gamepad.axes.length)
    }
    /* >> Temporary console debugging */

    // @ts-ignore
    addGamepad(e.gamepad)
})
window.addEventListener("gamepaddisconnected", e => {
    /* >> Temporary console debugging */
    if (globalDebug) {
        /** @type{Gamepad} */
        // @ts-ignore
        const gamepad = e.gamepad
        console.debug("Gamepad disconnected from index %d: %s", gamepad.index, gamepad.id)
    }
    /* >> Temporary console debugging */

    // @ts-ignore
    removeGamepad(e.gamepad)
})

let fps = 0

/**
 * Update the state of the world
 *
 * @param {number} timeDelta Time elapsed since the last frame was drawn
 */
const update = timeDelta => {
    // Update connected gamepads
    updateGamepads()

    if (timeDelta === 0) {
        fps = 0
    } else {
        fps = 1000 / timeDelta
    }

    // Logic to stop rendering once or if no gamepads are connected
    if (globalGamepads.size === 0) {
        if (globalEmptyFrameAlreadyRendered && globalForceRedraw === false) {
            return false
        }
        globalEmptyFrameAlreadyRendered = true
    } else {
        globalEmptyFrameAlreadyRendered = false
    }
    globalForceRedraw = false
    return true
}

/**
 * Draw a frame
 * @param {Gamepad} gamepad Gamepad that should be drawn
 * @param {number} gamepadIndex The index of the gamepad in relation to all connected gamepads
 * @param {number} gamepadCount The number of connected gamepads
 */
const drawGamepad = (gamepad, gamepadIndex, gamepadCount, options) => {
    if (globalDebug) {
        globalCtx.fillStyle = "black"
        globalCtx.font = "20px FiraCode"
        for (const [controllerButtonId, controllerButton] of gamepad.buttons.entries()) {
            globalCtx.fillText(`${controllerButtonId}: ${Math.round(controllerButton.value * 100)}% (${
                controllerButton.value > 0 ? "pressed" : "not pressed"})`,
                50 + (300 * gamepadIndex),
                90 + (25 * controllerButtonId))
        }
        for (const [controllerAxisId, controllerAxis] of gamepad.axes.entries()) {
            globalCtx.fillText(`${controllerAxisId}: ${controllerAxis.toFixed(4)} (${controllerAxis})`,
                50 + (300 * gamepadIndex),
                130 + (25 * (gamepad.buttons.length + controllerAxisId)))
        }
    }
    const startY = 150 + (25 * (globalDebug ? gamepad.buttons.length + gamepad.axes.length : 0))
    const startX = 90 + (500 * gamepadIndex)

    if (XBoxOne360ControllerChromium.gamepadIsSupported(gamepad)) {
        XBoxOne360ControllerChromium.draw(globalCtx, startX, startY, gamepad, options)
    } else if (XBoxOne360ControllerFirefox.gamepadIsSupported(gamepad)) {
        XBoxOne360ControllerFirefox.draw(globalCtx, startX, startY, gamepad, options)
    } else {
        if (XBoxOne360ControllerChromium.gamepadCanBeSupported(gamepad)) {
            XBoxOne360ControllerChromium.draw(globalCtx, startX, startY, gamepad, options)
        } else if (XBoxOne360ControllerFirefox.gamepadCanBeSupported(gamepad)) {
            XBoxOne360ControllerFirefox.draw(globalCtx, startX, startY, gamepad, options)
        } else {
            throw Error("No gamepad profile was found that could render the currently connected controller")
        }
    }

}

let globalOptionDrawAlphaMask = false
let globalOptionBackgroundColor = "#F1F1F1"
let globalForceRedraw = false

/**
 * Draw a frame
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
const draw = (canvas, ctx) => {
    globalForceRedraw = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw canvas elements
    if (globalDebug) {
        ctx.font = "30px FiraCode"
        ctx.fillStyle = "black"
        ctx.fillText(globalTimeLastFrame.toString(), 50, 50)
        ctx.fillText(`fps: ${fps.toPrecision(3)}`, 200, 50)
    }

    if (globalGamepads.size > 0) {
        /** @type {{drawAlphaMask?: boolean, [key: string]: any}} **/
        const options = {
            drawAlphaMask: globalOptionDrawAlphaMask
        }
        ctx.fillStyle = globalOptionDrawAlphaMask === true ? "black" : globalOptionBackgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        for (const [gamepadIndex, gamepad] of globalGamepads.entries()) {
            drawGamepad(gamepad, gamepadIndex, globalGamepads.size, options)
        }
    } else {
        ctx.fillStyle = globalOptionBackgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "rgba(255,255,255,0.35)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        console.log("draw empty canvas")
        const fontSize = 30
        ctx.font = `${fontSize}x Helvetica`
        ctx.fillStyle = "black"
        const textConnectGamepad = "Connect a\ngamepad and\npress any\nbutton"
        const textConnectGamepadParts = textConnectGamepad.split("\n")
        const heightCenter = canvas.height / 2 - (fontSize * textConnectGamepadParts.length) / 2
        for (const [index, textConnectGamepadPart] of textConnectGamepadParts.entries()) {
            const textConnectGamepadSize = ctx.measureText(textConnectGamepadPart);
            ctx.fillText(textConnectGamepadPart, canvas.width / 2 - textConnectGamepadSize.width / 2, heightCenter + index * fontSize)
        }
    }
}

/**
 * (Main) Render loop
 *
 * @param {number} time The current time(stamp)
 */
const loop = time => {
    // Update and draw
    if (globalTimeLastFrame === undefined) {
        globalTimeLastFrame = time
    }
    const deltaTime = time - globalTimeLastFrame
    if (deltaTime === 0) {
        // If there was no delta time cancel previous animation frame request
        window.cancelAnimationFrame(globalAnimationFrameRequest)
    }
    if (!update(deltaTime) && globalForceRedraw === false) {
        console.log("don't draw because !update(deltaTime)")
        // If update returned false no new frame needs to be drawn
        window.cancelAnimationFrame(globalAnimationFrameRequest)
        globalAnimationFrameRequest = window.requestAnimationFrame(loop)
        return
    }
    draw(globalCanvas, globalCtx)
    // Save time when frame was drawn
    globalTimeLastFrame = time
    // Repeat this loop as fast as possible
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
}

const initializeCanvas = () => {
    // @ts-ignore
    globalCanvas = document.getElementById("main")
    globalCtx = globalCanvas.getContext("2d")

    // Fill and resize it
    globalCtx.canvas.width = window.innerWidth;
    globalCtx.canvas.height = window.innerHeight;

    globalCtx.fillStyle = "#F1F1F1"
    globalCtx.fillRect(0, 0, globalCanvas.width, globalCanvas.height)
}

window.addEventListener('resize', () => {
    if (globalCanvas) {
        // Resize canvas if window is resized
        globalCanvas.width = window.innerWidth
        globalCanvas.height = window.innerHeight
    }
    // Force redraw of canvas
    globalForceRedraw = true
})

const createOptionsInput = () => {
    const htmlInputBackgroundColor = document.createElement("input")
    htmlInputBackgroundColor.id = "htmlInputBackgroundColor"
    htmlInputBackgroundColor.type = "color"
    const defaultValueBackgroundColor = localStorage.getItem('backgroundColor')
    if (defaultValueBackgroundColor) {
        globalOptionBackgroundColor = defaultValueBackgroundColor
    } else {
        localStorage.setItem('backgroundColor', globalOptionBackgroundColor);
    }
    htmlInputBackgroundColor.value = globalOptionBackgroundColor
    htmlInputBackgroundColor.addEventListener("change", () => {
        console.log(`Update htmlInputBackgroundColor to: '${htmlInputBackgroundColor.value}'`)
        globalOptionBackgroundColor = htmlInputBackgroundColor.value
        localStorage.setItem('backgroundColor', globalOptionBackgroundColor);
        // Force redraw of canvas
        globalForceRedraw = true
    })
    const htmlLabelInputBackgroundColor = document.createElement("label")
    htmlLabelInputBackgroundColor.id = "htmlLabelInputBackgroundColor"
    htmlLabelInputBackgroundColor.htmlFor = "htmlInputBackgroundColor"
    htmlLabelInputBackgroundColor.textContent = "Select custom background color"

    const htmlInputToggleMask = document.createElement("input")
    htmlInputToggleMask.id = "htmlInputToggleMask"
    htmlInputToggleMask.type = "checkbox"
    const defaultValueDrawAlphaMask = localStorage.getItem('drawAlphaMask')
    if (defaultValueDrawAlphaMask) {
        globalOptionDrawAlphaMask = defaultValueDrawAlphaMask === "true"
    } else {
        localStorage.setItem('drawAlphaMask', `${globalOptionDrawAlphaMask}`);
    }
    htmlInputToggleMask.checked = globalOptionDrawAlphaMask
    htmlInputToggleMask.addEventListener("change", () => {
        console.log(`Update htmlInputToggleMask to: '${htmlInputToggleMask.checked}'`)
        globalOptionDrawAlphaMask = htmlInputToggleMask.checked
        localStorage.setItem('drawAlphaMask', `${globalOptionDrawAlphaMask}`);
        // Force redraw of canvas
        globalForceRedraw = true
    })
    const htmlLabelInputToggleAlphaMask = document.createElement("label")
    htmlLabelInputToggleAlphaMask.id = "htmlLabelInputToggleMask"
    htmlLabelInputToggleAlphaMask.htmlFor = "htmlInputToggleMask"
    htmlLabelInputToggleAlphaMask.textContent = "Render alpha mask (for chroma keying)"

    const htmlInputToggleDebug = document.createElement("input")
    htmlInputToggleDebug.id = "htmlInputToggleDebug"
    htmlInputToggleDebug.type = "checkbox"
    const defaultValueDebug = localStorage.getItem('debug')
    if (defaultValueDebug) {
        globalDebug = defaultValueDebug === "true"
    } else {
        localStorage.setItem('debug', `${globalDebug}`);
    }
    htmlInputToggleDebug.checked = globalDebug
    htmlInputToggleDebug.addEventListener("change", () => {
        console.log(`Update htmlInputToggleDebug to: '${htmlInputToggleDebug.checked}'`)
        globalDebug = htmlInputToggleDebug.checked
        localStorage.setItem('debug', `${globalDebug}`);
        // Force redraw of canvas
        globalForceRedraw = true
    })
    const htmlLabelInputToggleDebug = document.createElement("label")
    htmlLabelInputToggleDebug.id = "htmlLabelInputToggleDebug"
    htmlLabelInputToggleDebug.htmlFor = "htmlInputToggleDebug"
    htmlLabelInputToggleDebug.textContent = "Debug view"

    const htmlOptions = document.getElementById("options")
    while (htmlOptions.firstChild) {
        htmlOptions.removeChild(htmlOptions.lastChild)
    }
    htmlOptions.appendChild(htmlInputBackgroundColor)
    htmlOptions.appendChild(htmlLabelInputBackgroundColor)
    htmlOptions.appendChild(document.createElement("br"))
    htmlOptions.appendChild(htmlInputToggleMask)
    htmlOptions.appendChild(htmlLabelInputToggleAlphaMask)
    htmlOptions.appendChild(document.createElement("br"))
    htmlOptions.appendChild(htmlInputToggleDebug)
    htmlOptions.appendChild(htmlLabelInputToggleDebug)

    // TODO: Move options to HTML and only reference them here
    // TODO: Add button to clear all local storage data ("reset/revert options")
}

window.addEventListener('load', () => {
    // Wait until the page is fully loaded then
    initializeCanvas()
    createOptionsInput()

    // Add options
    const triggerColorDialog = () => new Promise((resolve) => {
        console.log("trigger color dialog")
        const colorInput = document.createElement("input")
        colorInput.id = "colorDialogID"
        colorInput.type = "color"
        colorInput.style.opacity = "0"
        colorInput.style.position = "absolute"
        colorInput.addEventListener("change", () => {
            resolve(colorInput.value)
        })
        document.body.appendChild(colorInput)
        document.getElementById("colorDialogID").click()
    })

    // Start render loop
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)

    triggerColorDialog().then(console.log)

})
