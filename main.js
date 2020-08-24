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
let canvas

/**
 * The 2D rendering context of the canvas
 * @type {CanvasRenderingContext2D}
 * @global
 */
let ctx

/**
 * Indicates if debugging is activated
 */
let debug = true

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
    if (debug) {
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
    if (debug) {
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
    if (debug) {
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
    if (debug) {
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
    if (debug) {
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
        if (globalEmptyFrameAlreadyRendered) {
            return false
        }
        globalEmptyFrameAlreadyRendered = true
    } else {
        globalEmptyFrameAlreadyRendered = false
    }
    return true
}

const globalGamepadButtonRadiusRound = 10

const globalGamepadButtonSizeRound = Object.freeze({
    width: (globalGamepadButtonRadiusRound * 2) * 1.75,
    height: (globalGamepadButtonRadiusRound * 2) * 1.75
})

/**
 * Draw a button of a gamepad
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {string} name Button display text
 * @param {string} color Button color
 * @param {boolean} pressed Indicator if button is pressed
 */
const drawGamepadButtonRound = (x, y, name, color = "black", pressed = false) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeRect(x - globalGamepadButtonSizeRound.width / 2, y - globalGamepadButtonSizeRound.height / 2,
            globalGamepadButtonSizeRound.width, globalGamepadButtonSizeRound.height)
    }
    ctx.beginPath()
    ctx.arc(x, y, globalGamepadButtonRadiusRound * 2, 0, 2 * Math.PI);
    ctx.fillStyle = hexToRgba(color, pressed ? 0.75 : 0.4)
    ctx.fill()
    const fontHeightPt = 20
    ctx.font = `${fontHeightPt}pt Helvetica`
    const textButtonSize = ctx.measureText(name);
    ctx.fillStyle = hexToRgba(color)
    ctx.fillText(name, x - (textButtonSize.width / 2),
        y + (fontHeightPt / 3))
}

const globalGamepadButtonSizeGroupXboxABXY = Object.freeze({
    width: globalGamepadButtonSizeRound.width * 3,
    height: globalGamepadButtonSizeRound.height * 3
})

/**
 * Draw a button of a gamepad
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {GamepadButton} buttonA Button A
 * @param {GamepadButton} buttonB Button B
 * @param {GamepadButton} buttonX Button X
 * @param {GamepadButton} buttonY Button Y
 */
const drawGamepadButtonGroupXboxABXY = (x, y, buttonA, buttonB, buttonX, buttonY) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeRect(x - globalGamepadButtonSizeGroupXboxABXY.width / 2, y - globalGamepadButtonSizeGroupXboxABXY.height / 2,
            globalGamepadButtonSizeGroupXboxABXY.width, globalGamepadButtonSizeGroupXboxABXY.height)
    }
    drawGamepadButtonRound(x, y + globalGamepadButtonSizeRound.height,
        "A", "#6DA13A", buttonA.value > 0)
    drawGamepadButtonRound(x, y - globalGamepadButtonSizeRound.height,
        "Y", "#FA9D23", buttonY.value > 0)
    drawGamepadButtonRound(x + globalGamepadButtonSizeRound.width, y,
        "B", "#D41F1F", buttonB.value > 0)
    drawGamepadButtonRound(x - globalGamepadButtonSizeRound.width, y,
        "X", "#234EFA", buttonX.value > 0)

}

const globalGamepadButtonRadiusAxis = 15

const globalGamepadButtonSizeAxis = Object.freeze({
    width: ((globalGamepadButtonRadiusAxis * 2) * 1.45 * 2),
    height: ((globalGamepadButtonRadiusAxis * 2) * 1.45 * 2)
})

/**
 * Draw a button of a gamepad
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {number} axisX Axis X
 * @param {number} axisY Axis Y
 * @param {boolean} pressed Indicator if button is pressed
 */
const drawGamepadButtonAxis = (x, y, axisX, axisY, pressed = false) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeRect(x - globalGamepadButtonSizeAxis.width / 2, y - globalGamepadButtonSizeAxis.height / 2,
            globalGamepadButtonSizeAxis.width, globalGamepadButtonSizeAxis.height)
    }
    ctx.beginPath()
    ctx.arc(x, y, (globalGamepadButtonRadiusAxis * 2) * 1.45, 0, 2 * Math.PI)
    ctx.fillStyle = ctx.createRadialGradient(x, y, 1, x, y, 55)
    ctx.fillStyle.addColorStop(0, '#C0C0C0')
    ctx.fillStyle.addColorStop(1, '#717171')
    ctx.fill()
    ctx.beginPath()
    const middleButtonRadius = (globalGamepadButtonRadiusAxis * 2) * 0.45
    ctx.arc(x + (axisX * middleButtonRadius), y + (axisY * middleButtonRadius),
        globalGamepadButtonRadiusAxis * (pressed ? 2 : 1.75), 0, 2 * Math.PI)
    ctx.fillStyle = ctx.createRadialGradient(
        x + (axisX * (globalGamepadButtonRadiusAxis * 2) * 0.45),
        y + (axisY * (globalGamepadButtonRadiusAxis * 2) * 0.45),
        1, x + (axisX * (globalGamepadButtonRadiusAxis * 2) * 0.45),
        y + (axisY * (globalGamepadButtonRadiusAxis * 2) * 0.45),
        55
    )
    ctx.fillStyle.addColorStop(0, '#000000')
    ctx.fillStyle.addColorStop(1, '#404040')
    ctx.fill()
}

const globalGamepadButtonSizePlusTile = Object.freeze({
    width: 25,
    height: 25
})

const globalGamepadButtonSizePlus = Object.freeze({
    width: globalGamepadButtonSizePlusTile.width * 3,
    height: globalGamepadButtonSizePlusTile.height * 3
})

/**
 * Draw a button of a gamepad
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {"UP"|"DOWN"} pressDirectionVertical Vertical press direction
 * @param {"LEFT"|"RIGHT"} pressDirectionHorizontal Horizontal press direction
 */
const drawGamepadButtonPlus = (x, y, pressDirectionVertical = undefined, pressDirectionHorizontal = undefined) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeRect(x - globalGamepadButtonSizePlus.width / 2, y - globalGamepadButtonSizePlus.height / 2,
            globalGamepadButtonSizePlus.width, globalGamepadButtonSizePlus.height)
    }
    const gradient = ctx.createRadialGradient(
        x + (pressDirectionHorizontal === "LEFT" ? - globalGamepadButtonSizePlusTile.width : 0) + (pressDirectionHorizontal === "RIGHT" ? globalGamepadButtonSizePlusTile.width : 0),
        y + (pressDirectionVertical === "UP" ? - globalGamepadButtonSizePlusTile.width : 0) + (pressDirectionVertical === "DOWN" ? globalGamepadButtonSizePlusTile.width : 0),
        1,
        x + (pressDirectionHorizontal === "LEFT" ? - globalGamepadButtonSizePlusTile.width : 0) + (pressDirectionHorizontal === "RIGHT" ? globalGamepadButtonSizePlusTile.width : 0),
        y + (pressDirectionVertical === "UP" ? - globalGamepadButtonSizePlusTile.width : 0) + (pressDirectionVertical === "DOWN" ? globalGamepadButtonSizePlusTile.width : 0),
        globalGamepadButtonSizePlusTile.width * 2)
    gradient.addColorStop(0, '#606060')
    gradient.addColorStop(1, '#000000')
    ctx.beginPath()
    ctx.rect(x - (globalGamepadButtonSizePlusTile.width / 2), y - (globalGamepadButtonSizePlusTile.width / 2) - globalGamepadButtonSizePlusTile.width,
        globalGamepadButtonSizePlusTile.width, globalGamepadButtonSizePlusTile.height * 3)
    ctx.rect(x - (globalGamepadButtonSizePlusTile.width / 2) - globalGamepadButtonSizePlusTile.width, y - (globalGamepadButtonSizePlusTile.width / 2),
        globalGamepadButtonSizePlusTile.width * 3, globalGamepadButtonSizePlusTile.height)
    ctx.fillStyle = gradient
    ctx.fill()
}

/**
 * Draw a frame
 * @param {Gamepad} gamepad Gamepad that should be drawn
 * @param {number} gamepadIndex The index of the gamepad in relation to all connected gamepads
 * @param {number} gamepadCount The number of connected gamepads
 */
const drawGamepad = (gamepad, gamepadIndex, gamepadCount) => {
    if (debug) {
        ctx.fillStyle = "black"
        ctx.font = "20px FiraCode"
        for (const [controllerButtonId, controllerButton] of gamepad.buttons.entries()) {
            ctx.fillText(`${controllerButtonId}: ${Math.round(controllerButton.value * 100)}% (${
                controllerButton.value > 0 ? "pressed" : "not pressed"})`,
                50 + (300 * gamepadIndex),
                90 + (25 * controllerButtonId))
        }
        for (const [controllerAxisId, controllerAxis] of gamepad.axes.entries()) {
            ctx.fillText(`${controllerAxisId}: ${controllerAxis.toFixed(4)} (${controllerAxis})`,
                50 + (300 * gamepadIndex),
                130 + (25 * (gamepad.buttons.length + controllerAxisId)))
        }
    }
    const startY = 150 + (25 * (debug ? gamepad.buttons.length + gamepad.axes.length : 0))
    const startX = 50 + (500 * gamepadIndex)

    drawGamepadButtonGroupXboxABXY(startX + globalGamepadButtonSizeGroupXboxABXY.width / 2 + 300,
        startY + globalGamepadButtonSizeGroupXboxABXY.height / 2,
        gamepad.buttons[0], gamepad.buttons[1], gamepad.buttons[2], gamepad.buttons[3])

    let startIndexButtonAxes = 10
    let startIndexAxisLeft = 0
    let startIndexAxisRight = 2
    if (navigator.userAgent.indexOf("Firefox") > -1) {
        // Firefox has some buttons registered as axes
        startIndexButtonAxes = 9
        startIndexAxisRight = 3
    }

    drawGamepadButtonAxis(startX + globalGamepadButtonSizeAxis.width / 2, startY + globalGamepadButtonSizeAxis.height / 2,
        gamepad.axes[startIndexAxisLeft], gamepad.axes[startIndexAxisLeft + 1], gamepad.buttons[startIndexButtonAxes].value > 0)

    drawGamepadButtonAxis(startX + globalGamepadButtonSizeAxis.width / 2 + 250, startY + globalGamepadButtonSizeAxis.height / 2 + 125,
        gamepad.axes[startIndexAxisRight], gamepad.axes[startIndexAxisRight + 1], gamepad.buttons[startIndexButtonAxes + 1].value > 0)

    /** @type {"LEFT" | "RIGHT"} */
    let pressDirectionHorizontal
    /** @type {"UP" | "DOWN"} */
    let pressDirectionVertical

    if (navigator.userAgent.indexOf("Firefox") > -1) {
        // Firefox has the plus buttons registered as axes
        let startIndexAxisPlus = 6
        if (gamepad.axes[startIndexAxisPlus] > 0) {
            pressDirectionHorizontal = "RIGHT"
        } else if (gamepad.axes[startIndexAxisPlus] < 0) {
            pressDirectionHorizontal = "LEFT"
        }
        if (gamepad.axes[startIndexAxisPlus + 1] > 0) {
            pressDirectionVertical = "DOWN"
        } else if (gamepad.axes[startIndexAxisPlus + 1] < 0) {
            pressDirectionVertical = "UP"
        }
    } else {
        let startIndexButtonPlus = 12
        if (gamepad.buttons[startIndexButtonPlus].value > 0) {
            pressDirectionVertical = "UP"
        } else if (gamepad.buttons[startIndexButtonPlus + 1].value > 0) {
            pressDirectionVertical = "DOWN"
        }
        if (gamepad.buttons[startIndexButtonPlus + 2].value > 0) {
            pressDirectionHorizontal = "LEFT"
        } else if (gamepad.buttons[startIndexButtonPlus + 3].value > 0) {
            pressDirectionHorizontal = "RIGHT"
        }
    }
    drawGamepadButtonPlus(startX + globalGamepadButtonSizePlus.width / 2, startY + globalGamepadButtonSizePlus.height / 2 + 125,
        pressDirectionVertical, pressDirectionHorizontal)
}

/**
 * Draw a frame
 */
const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Draw canvas elements
    if (debug) {
        ctx.font = "30px FiraCode"
        ctx.fillStyle = "black"
        ctx.fillText(globalTimeLastFrame.toString(), 50, 50)
        ctx.fillText(`fps: ${fps.toPrecision(3)}`, 200, 50)
    }

    if (globalGamepads.size > 0) {
        for (const [gamepadIndex, gamepad] of globalGamepads.entries()) {
            drawGamepad(gamepad, gamepadIndex, globalGamepads.size)
        }
    } else {
        console.log("draw empty canvas")
        ctx.fillStyle = "grey"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "green"
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2)
        ctx.font = "30px Helvetica"
        ctx.fillStyle = "white"
        const textConnectGamepad = "Connect a gamepad and press any button"
        const textConnectGamepadSize = ctx.measureText(textConnectGamepad);
        ctx.fillText(textConnectGamepad, canvas.width / 2 - textConnectGamepadSize.width / 2, canvas.height / 2)
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
    if (!update(deltaTime)) {
        // If update returned false no new frame needs to be drawn
        return window.cancelAnimationFrame(globalAnimationFrameRequest)
    }
    draw()
    // Save time when frame was drawn
    globalTimeLastFrame = time
    // Repeat this loop as fast as possible
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
}



const initializeCanvas = () => {
    // @ts-ignore
    canvas = document.getElementById("main")
    ctx = canvas.getContext("2d")

    // Fill and resize it
    canvas.style.width = '1280px'
    canvas.style.height = '920px'
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.fillStyle = "grey"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}



window.addEventListener('load', () => {
    // Wait until the page is fully loaded then
    initializeCanvas()

    // Start render loop
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
})
