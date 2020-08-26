/**
 * Container for all currently connected gamepads
 * @type {Map<number, {gamepad: Gamepad;visualizationProfile: GamepadVisualizationProfile;userProfile: any}>}
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
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")"
}

/**
 * @param {Gamepad} gamepad Gamepad to add
 * @param {GamepadVisualizationProfile} visualizationProfile
 * @param {any} userProfile
 */
const addGamepadListElement = (gamepad, visualizationProfile, userProfile) => {
    const htmlUlControllerOptionsList = document.getElementById("controller-options-list")
    const htmlLiElementGamepad = document.createElement("li")
    htmlLiElementGamepad.id = `controller-${gamepad.index}-${gamepad.id}`

    const htmlGamepadVisualizationProfile = document.createElement("p")
    htmlGamepadVisualizationProfile.appendChild(document.createTextNode("visualization profile: " + visualizationProfile.profileName))
    htmlLiElementGamepad.appendChild(htmlGamepadVisualizationProfile)

    const htmlUserProfile = document.createElement("p")
    htmlUserProfile.appendChild(document.createTextNode("user profile: " + userProfile.name))
    htmlLiElementGamepad.appendChild(htmlUserProfile)

    const htmlGamepadTitle = document.createElement("p")
    htmlGamepadTitle.appendChild(document.createTextNode("name: " + gamepad.id))
    htmlLiElementGamepad.appendChild(htmlGamepadTitle)
    const htmlGamepadButtons = document.createElement("ul")
    htmlGamepadButtons.className = "buttons"
    for (const [buttonId, button] of gamepad.buttons.entries()) {
        const htmlGamepadButton = document.createElement("li")
        htmlGamepadButton.textContent = `Button ${buttonId} (->${
            visualizationProfile.getMapping().buttons[buttonId]
        }):`
        const htmlGamepadButtonInfo = document.createElement("span")
        htmlGamepadButtonInfo.textContent = `${button.value} (pressed: ${button.pressed}, touched: ${button.touched})`
        htmlGamepadButton.appendChild(htmlGamepadButtonInfo)
        const htmlGamepadButtonProgress = document.createElement("progress")
        htmlGamepadButtonProgress.className = "button"
        htmlGamepadButtonProgress.setAttribute("max", "1")
        htmlGamepadButtonProgress.setAttribute("value", "0")
        htmlGamepadButtonProgress.innerHTML = buttonId.toString()
        htmlGamepadButton.appendChild(document.createElement("br"))
        htmlGamepadButton.appendChild(htmlGamepadButtonProgress)
        htmlGamepadButtons.appendChild(htmlGamepadButton)
    }
    htmlLiElementGamepad.appendChild(htmlGamepadButtons)
    const htmlGamepadAxes = document.createElement("ul")
    htmlGamepadAxes.className = "axes"
    for (const [axisId, axis] of gamepad.axes.entries()) {
        const htmlGamepadAxis = document.createElement("li")
        htmlGamepadAxis.textContent = `Axis ${axisId} (->${
            visualizationProfile.getMapping().axes[axisId]
        }): `
        const htmlGamepadAxisInfo = document.createElement("span")
        htmlGamepadAxisInfo.textContent = `${axis}`
        htmlGamepadAxis.appendChild(htmlGamepadAxisInfo)
        const htmlGamepadAxisProgress = document.createElement("progress")
        htmlGamepadAxisProgress.className = "axis"
        htmlGamepadAxisProgress.setAttribute("max", "2")
        htmlGamepadAxisProgress.setAttribute("value", "1")
        htmlGamepadAxisProgress.innerHTML = axisId.toString()
        htmlGamepadAxis.appendChild(document.createElement("br"))
        htmlGamepadAxis.appendChild(htmlGamepadAxisProgress)
        htmlGamepadAxes.appendChild(htmlGamepadAxis)
    }
    htmlLiElementGamepad.appendChild(htmlGamepadAxes)

    htmlUlControllerOptionsList.appendChild(htmlLiElementGamepad)
}

/**
 * @param {Gamepad} gamepad Gamepad to remove
 */
const removeGamepadListElement = (gamepad) => {
    const htmlGamepad = document.getElementById(`controller-${gamepad.index}-${gamepad.id}`)
    htmlGamepad.parentElement.removeChild(htmlGamepad)
}

/**
 * @param {Gamepad} gamepad Gamepad to remove
 */
const updateGamepadListElement = (gamepad) => {
    const htmlGamepad = document.getElementById(`controller-${gamepad.index}-${gamepad.id}`)
    /** @type {HTMLCollectionOf<HTMLProgressElement>} */
    // @ts-ignore
    const htmlButtonProgressList = htmlGamepad.querySelectorAll("ul.buttons li progress")
    /** @type {HTMLCollectionOf<HTMLSpanElement>} */
    // @ts-ignore
    const htmlButtonList = htmlGamepad.querySelectorAll("ul.buttons li span")
    for (const [controllerButtonId, controllerButton] of gamepad.buttons.entries()) {
        const htmlButtonProgress = htmlButtonProgressList[controllerButtonId]
        const htmlButton = htmlButtonList[controllerButtonId]
        // Can be temporarily undefined!
        if (htmlButton && htmlButtonProgress) {
            htmlButton.innerText = `${controllerButton.value} (pressed: ${controllerButton.pressed}, touched: ${controllerButton.touched})`
            htmlButtonProgress.value = controllerButton.value
        }
    }
    /** @type {HTMLCollectionOf<HTMLProgressElement>} */
    // @ts-ignore
    const htmlAxisProgressList = htmlGamepad.querySelectorAll("ul.axes li progress")
    /** @type {HTMLCollectionOf<HTMLSpanElement>} */
    // @ts-ignore
    const htmlAxisList = htmlGamepad.querySelectorAll("ul.axes li span")
    for (const [axisId, axis] of gamepad.axes.entries()) {
        const htmlAxisProgress = htmlAxisProgressList[axisId]
        const htmlAxis = htmlAxisList[axisId]
            // Can be temporarily undefined!
            if (htmlAxis && htmlAxisProgress) {
            htmlAxis.innerText = `${axis}`
            htmlAxisProgress.value = axis + 1
        }
    }
}

/**
 * Add a connected gamepad
 * @param {Gamepad} gamepad Gamepad to add
 */
const addGamepad = (gamepad) => {
    // TODO: Fetch last visualization profile from localStorage (possibly from user profile?)

    let visualizationProfile
    if (XBoxOne360ControllerChromium.gamepadIsSupported(gamepad)) {
        visualizationProfile = new XBoxOne360ControllerChromium()
    } else if (XBoxOne360ControllerFirefox.gamepadIsSupported(gamepad)) {
        visualizationProfile = new XBoxOne360ControllerFirefox()
    } else {
        if (XBoxOne360ControllerChromium.gamepadCanBeSupported(gamepad)) {
            visualizationProfile = new XBoxOne360ControllerChromium()
        } else if (XBoxOne360ControllerFirefox.gamepadCanBeSupported(gamepad)) {
            visualizationProfile = new XBoxOne360ControllerFirefox()
        } else {
            visualizationProfile = new UnknownController()
            console.warn("No gamepad profile was found that could render the currently connected controller")
        }
    }
    // TODO: Fetch last user profile from localStorage
    const userProfile = {}
    globalGamepads.set(gamepad.index, { gamepad, visualizationProfile, userProfile })

    addGamepadListElement(gamepad, visualizationProfile, userProfile)

    // @ts-ignore
    if (gamepad.vibrationActuator) {
        // @ts-ignore
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
    removeGamepadListElement(gamepad)

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
                globalGamepads.set(gamepad.index, Object.assign(globalGamepads.get(gamepad.index), { gamepad }))
            } else {
                addGamepad(gamepad)
            }
            updateGamepadListElement(gamepad)
        }
    }
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
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ gamepad: Gamepad, visualizationProfile: GamepadVisualizationProfile }} gamepadInfo Gamepad that should be drawn
 * @param {number} gamepadIndex The index of the gamepad in relation to all connected gamepads
 * @param {number} gamepadCount The number of connected gamepads
 */
// @ts-ignore
const drawGamepad = (ctx, gamepadInfo, gamepadIndex, gamepadCount, options) => {
    let gamepadX
    let gamepadY
    if (gamepadCount === 1) {
        gamepadX = ctx.canvas.width / 2
        gamepadY = ctx.canvas.height / 2
    } else {
        // Determine if vertical or horizontal presentation
        const verticalPresentation = ctx.canvas.height > ctx.canvas.width
        const padding = 20
        if (verticalPresentation) {
            const heightOfAllGamepads = gamepadCount * gamepadInfo.visualizationProfile.getDrawSize().height
                + (gamepadCount - 1) * padding
            gamepadX = ctx.canvas.width / 2
            gamepadY = (ctx.canvas.height - heightOfAllGamepads + (heightOfAllGamepads / gamepadCount * gamepadIndex)) + (gamepadInfo.visualizationProfile.getDrawSize().height / 4)
        } else {
            const widthOfAllGamepads = gamepadCount * gamepadInfo.visualizationProfile.getDrawSize().width
                + (gamepadCount - 1) * padding
            gamepadX = (ctx.canvas.width - widthOfAllGamepads + (widthOfAllGamepads / gamepadCount * gamepadIndex)) + (gamepadInfo.visualizationProfile.getDrawSize().width / 4)
            gamepadY = ctx.canvas.height / 2
        }
    }

    gamepadInfo.visualizationProfile.draw(globalCtx, gamepadX, gamepadY, gamepadInfo.gamepad, options)
}

let globalOptionDrawAlphaMask = false
let globalOptionBackgroundColor = "#F1F1F1"
let globalForceRedraw = false

/**
 * Draw a frame
 * @param {CanvasRenderingContext2D} ctx
 */
const draw = (ctx) => {
    globalForceRedraw = false
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw canvas elements
    if (globalDebug) {
        ctx.font = "30px Helvetica"
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
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        for (const [gamepadIndex, gamepadInfo] of globalGamepads.entries()) {
            drawGamepad(ctx, gamepadInfo, gamepadIndex, globalGamepads.size, options)
        }
    } else {
        ctx.fillStyle = globalOptionBackgroundColor
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = "rgba(255,255,255,0.35)"
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        console.log("draw empty canvas")
        const fontSize = Math.floor(Math.min(50, Math.min(ctx.canvas.width, ctx.canvas.height) / 10))
        ctx.font = `${fontSize}px Helvetica`
        console.log(fontSize, ctx.font)
        ctx.fillStyle = "black"
        const textConnectGamepad = "Connect a\ngamepad and\npress any\nbutton"
        const textConnectGamepadParts = textConnectGamepad.split("\n")
        const heightCenter = ctx.canvas.height / 2 - ((fontSize + 5) * textConnectGamepadParts.length) / 2
        for (const [index, textConnectGamepadPart] of textConnectGamepadParts.entries()) {
            const textConnectGamepadSize = ctx.measureText(textConnectGamepadPart)
            ctx.fillText(textConnectGamepadPart, ctx.canvas.width / 2 - textConnectGamepadSize.width / 2, heightCenter + index * (fontSize + 5))
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
    draw(globalCtx)
    // Save time when frame was drawn
    globalTimeLastFrame = time
    // Repeat this loop as fast as possible
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
}

const initializeCanvas = () => {
    /** @type {HTMLCanvasElement} */
    // @ts-ignore
    const canvas = document.getElementById("main")
    globalCtx = canvas.getContext("2d")

    // Fill and resize it
    const dpi = window.devicePixelRatio
    globalCtx.canvas.width = Math.floor(window.innerWidth * dpi)
    globalCtx.canvas.height = Math.floor(window.innerHeight * dpi)

    globalCtx.fillStyle = "#F1F1F1"
    globalCtx.fillRect(0, 0, globalCtx.canvas.width, globalCtx.canvas.height)
}

window.addEventListener('resize', () => {
    if (globalCtx) {
        // Resize canvas if window is resized
        const dpi = window.devicePixelRatio
        globalCtx.canvas.width = Math.floor(window.innerWidth * dpi)
        globalCtx.canvas.height = Math.floor(window.innerHeight * dpi)
    }
    // Force redraw of canvas
    globalForceRedraw = true
})

const initializeOptions = () => {
    globalOptionBackgroundColor = "#F1F1F1"
    globalOptionDrawAlphaMask = false
    globalDebug = false
}

const createOptionsInput = () => {
    // Set default options
    initializeOptions()

    /** @type {HTMLInputElement} */
    // @ts-ignore
    const htmlInputSetBackgroundColor = document.getElementById("html-input-set-background-color")
    const defaultValueBackgroundColor = localStorage.getItem('backgroundColor')
    if (defaultValueBackgroundColor) {
        globalOptionBackgroundColor = defaultValueBackgroundColor
    } else {
        localStorage.setItem('backgroundColor', globalOptionBackgroundColor)
    }
    htmlInputSetBackgroundColor.value = globalOptionBackgroundColor
    htmlInputSetBackgroundColor.addEventListener("change", () => {
        console.log(`Update htmlInputBackgroundColor to: '${htmlInputSetBackgroundColor.value}'`)
        globalOptionBackgroundColor = htmlInputSetBackgroundColor.value
        localStorage.setItem('backgroundColor', globalOptionBackgroundColor)
        // Force redraw of canvas
        globalForceRedraw = true
    })

    /** @type {HTMLInputElement} */
    // @ts-ignore
    const htmlInputToggleMask = document.getElementById("html-input-toggle-mask")
    const defaultValueDrawAlphaMask = localStorage.getItem('drawAlphaMask')
    if (defaultValueDrawAlphaMask) {
        globalOptionDrawAlphaMask = defaultValueDrawAlphaMask === "true"
    } else {
        localStorage.setItem('drawAlphaMask', `${globalOptionDrawAlphaMask}`)
    }
    htmlInputToggleMask.checked = globalOptionDrawAlphaMask
    htmlInputToggleMask.addEventListener("change", () => {
        console.log(`Update htmlInputToggleMask to: '${htmlInputToggleMask.checked}'`)
        globalOptionDrawAlphaMask = htmlInputToggleMask.checked
        localStorage.setItem('drawAlphaMask', `${globalOptionDrawAlphaMask}`)
        // Force redraw of canvas
        globalForceRedraw = true
    })

    /** @type {HTMLInputElement} */
    // @ts-ignore
    const htmlInputToggleDebug = document.getElementById("html-input-toggle-debug")
    const defaultValueDebug = localStorage.getItem('debug')
    if (defaultValueDebug) {
        globalDebug = defaultValueDebug === "true"
    } else {
        localStorage.setItem('debug', `${globalDebug}`)
    }
    htmlInputToggleDebug.checked = globalDebug
    htmlInputToggleDebug.addEventListener("change", () => {
        console.log(`Update htmlInputToggleDebug to: '${htmlInputToggleDebug.checked}'`)
        globalDebug = htmlInputToggleDebug.checked
        localStorage.setItem('debug', `${globalDebug}`)
        // Force redraw of canvas
        globalForceRedraw = true
    })

    /** @type {HTMLInputElement} */
    // @ts-ignore
    const htmlInputTriggerReset = document.getElementById("html-input-trigger-reset")
    htmlInputTriggerReset.addEventListener("click", () => {
        console.log(`Update htmlInputToggleDebug to: '${htmlInputToggleDebug.checked}'`)
        // Clear all customized options
        localStorage.clear()
        // Set default options
        initializeOptions()
        // Force redraw of canvas
        globalForceRedraw = true
    })
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

    })

    // Start render loop
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)

    triggerColorDialog().then(console.log)

})
