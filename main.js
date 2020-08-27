/**
 * Container for all currently connected gamepads
 * @typedef {{name: string}} UserProfile
 * @typedef {{gamepad: Gamepad;visualizationProfile: GamepadVisualizationProfile;userProfile: UserProfile}} GamepadInfo
 * @typedef {Map<number, GamepadInfo>} GamepadInfoMap
 * @type {GamepadInfoMap}
 */
const globalGamepads = new Map()

/**
 * The latest ID of the current animation request
 * @type {number}
 */
let globalAnimationFrameRequest

/**
 * Indicator if the previous render request rendered already an empty frame
 * (this is used to cancel the rendering if no gamepads are connected)
 * @type {boolean}
 */
let globalEmptyFrameAlreadyRendered

/**
 * Indicator if something has changed and an update/redraw should be done
 * (this is set to false after every draw call)
 */
let globalForceRedraw = true

/**
 * Indicator for activating debug output
 */
let globalDebug = false

/**
 * Save the time of the last rendered frame for time deltas between frames
 * (this is used to calculate the delta time between rendering frames)
 * @type {number}
 */
let globalTimeLastFrame

/**
 * The 2D rendering context of the canvas
 * @type {CanvasRenderingContext2D}
 */
let globalCtx

/**
 * Global option to draw the alpha mask of the gamepads
 */
let globalOptionDrawAlphaMask = false

/**
 * Global option to change the gamepad background
 */
let globalOptionBackgroundColor = "#DCDCDC"


/**
 * Convert a hex color code to an rgba code
 *
 * Source: https://stackoverflow.com/a/28056903
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
 * Check if for an id there is already a value in the local storage.
 * If not return the default value and add an entry with this value.
 * If yes return the existing value instead of the default value.
 * @param {string} id The local storage entry id
 * @param {any} defaultValue The default value
 * @param {{jsonParseLocalStorageValue?: boolean;jsonStringifyDefaultValue?: boolean}} options
 */
const checkAndSetLocalStorageForId = (id, defaultValue, options = {}) => {
    const localStorageValue = localStorage.getItem(id)
    if (localStorageValue !== null && localStorageValue !== undefined) {
        return options.jsonParseLocalStorageValue === true ? JSON.parse(localStorageValue) : localStorageValue
    } else {
        localStorage.setItem(id, options.jsonStringifyDefaultValue ? JSON.stringify(defaultValue) : defaultValue)
    }
    return defaultValue
}

/**
 * Add or update a gamepad visualization user profile in the local storage
 * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
 * @param {UserProfile} userProfile
 */
const addOrUpdateLocalStorageGamepadVisualizationUserProfile = (gamepadVisualizationProfile, userProfile) => {
    // Check if there is an index for these profiles
    const gamepadVisualizationProfiles = `gamepadVisualizationUserProfiles-${gamepadVisualizationProfile.profileName}`
    /** @type {UserProfile[]} */
    const userProfiles = checkAndSetLocalStorageForId(gamepadVisualizationProfiles, [{ name: "Default "}], {
        jsonParseLocalStorageValue: true,
        jsonStringifyDefaultValue: true
    })
    // If user profile is "Default" update name so that default is never changed
    if (userProfile.name = "Default") {
        userProfile.name = "Default (Customized)"
    }
    // Check if profile already exists and if yes overwrite otherwise just add
    const userProfileName = userProfile.name
    let index = userProfiles.findIndex(a => a.name === userProfileName)
    if (index === -1) {
        userProfiles.push(userProfile)
    } else {
        userProfiles[index] = userProfile
    }
    localStorage.setItem(gamepadVisualizationProfiles, JSON.stringify(userProfiles))
    localStorage.setItem(gamepadVisualizationProfiles + "-lastUsed", userProfile.name)
    updateGamepadListElements()
}

/**
 * Get a gamepad visualization user profile from the local storage
 * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
 */
const getLocalStorageGamepadVisualizationUserProfiles = (gamepadVisualizationProfile) => {
    // Check if there is an index for these profiles
    const gamepadVisualizationProfiles = `gamepadVisualizationUserProfiles-${gamepadVisualizationProfile.profileName}`
    /** @type {UserProfile[]} */
    return checkAndSetLocalStorageForId(gamepadVisualizationProfiles, [{ name: "Default "}], {
        jsonParseLocalStorageValue: true,
        jsonStringifyDefaultValue: true
    })
}

/**
 * Get a gamepad visualization user profile from the local storage
 * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
 * @param {string} userProfileName
 */
const getLocalStorageGamepadVisualizationUserProfile = (gamepadVisualizationProfile, userProfileName = undefined) => {
    /** @type {UserProfile[]} */
    const userProfiles = getLocalStorageGamepadVisualizationUserProfiles(gamepadVisualizationProfile)
    if (userProfileName === undefined || userProfileName === null) {
        userProfileName = "Default"
    }
    if (userProfiles.length > 0) {
        // Otherwise check if profile already exists and if yes overwrite otherwise just add
        let index = userProfiles.findIndex(a => a.name === userProfileName)
        console.log({ index })
        if (index > -1) {
            console.log({ userProfileReturn: userProfiles[index] })
            return userProfiles[index]
        }
    }
    return undefined
}

/**
 * Remove a gamepad visualization user profile from the local storage
 * @param {GamepadVisualizationProfile} gamepadVisualizationProfile
 * @param {UserProfile} userProfile
 */
const removeLocalStorageGamepadVisualizationUserProfile = (gamepadVisualizationProfile, userProfile) => {
    // Check if there is an index for these profiles
    const gamepadVisualizationProfiles = `gamepadVisualizationUserProfiles-${gamepadVisualizationProfile.profileName}`
    /** @type {UserProfile[]} */
    const userProfiles = getLocalStorageGamepadVisualizationUserProfiles(gamepadVisualizationProfile)
    // Check if profile already exists and if yes overwrite otherwise just add
    const userProfileName = userProfile.name
    let index = userProfiles.findIndex(a => a.name === userProfileName)
    if (index !== -1) {
        userProfiles.splice(index, 1)
    }
    localStorage.setItem(gamepadVisualizationProfiles, JSON.stringify(userProfiles))

    const lastUsed = localStorage.getItem(gamepadVisualizationProfiles + "-lastUsed")
    if (lastUsed === userProfileName) {
        localStorage.removeItem(gamepadVisualizationProfiles + "-lastUsed")
    }
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
    htmlGamepadVisualizationProfile.appendChild(document.createTextNode("visualization profile: "))
    htmlLiElementGamepad.appendChild(htmlGamepadVisualizationProfile)

    const htmlGamepadVisualizationProfileSelect = document.createElement("select")
    const supportedVisualizations = []
    if (XBoxOne360ControllerChromium.gamepadCanBeSupported(gamepad)) {
        supportedVisualizations.push(new XBoxOne360ControllerChromium().profileName)
    }
    if (XBoxOne360ControllerFirefox.gamepadCanBeSupported(gamepad)) {
        supportedVisualizations.push(new XBoxOne360ControllerFirefox().profileName)
    }
    if (UnknownController.gamepadCanBeSupported(gamepad)) {
        supportedVisualizations.push(new UnknownController().profileName)
    }
    for (const controllerProfileName of supportedVisualizations) {
        const htmlGamepadVisualizationProfileSelectOption = document.createElement("option")
        htmlGamepadVisualizationProfileSelectOption.value = controllerProfileName
        htmlGamepadVisualizationProfileSelectOption.textContent = controllerProfileName
        htmlGamepadVisualizationProfileSelect.appendChild(htmlGamepadVisualizationProfileSelectOption)
    }
    htmlGamepadVisualizationProfileSelect.addEventListener("change", () => {
        switch (htmlGamepadVisualizationProfileSelect.value) {
            case new XBoxOne360ControllerFirefox().profileName:
                visualizationProfile = new XBoxOne360ControllerFirefox()
                break;
            case new XBoxOne360ControllerChromium().profileName:
                visualizationProfile = new XBoxOne360ControllerChromium()
                break;
            default:
                visualizationProfile = new UnknownController()
                break
        }
        globalGamepads.set(gamepad.index, Object.assign(globalGamepads.get(gamepad.index), { visualizationProfile }))
        updateGamepadListElements()
    })
    htmlLiElementGamepad.appendChild(htmlGamepadVisualizationProfileSelect)
    htmlGamepadVisualizationProfileSelect.value = visualizationProfile.profileName
    htmlLiElementGamepad.appendChild(document.createElement("br"))
    htmlLiElementGamepad.appendChild(document.createElement("br"))


    const htmlGamepadVisualizationUserProfile = document.createElement("p")
    htmlGamepadVisualizationUserProfile.appendChild(document.createTextNode("Select an existing visualization user profile: "))
    htmlLiElementGamepad.appendChild(htmlGamepadVisualizationUserProfile)

    const htmlGamepadVisualizationUserProfileSelect = document.createElement("select")
    const supportedVisualizationUserProfiles = getLocalStorageGamepadVisualizationUserProfiles(visualizationProfile)
    for (const supportedVisualizationUserProfile of supportedVisualizationUserProfiles) {
        const htmlGamepadVisualizationUserProfileSelectOption = document.createElement("option")
        htmlGamepadVisualizationUserProfileSelectOption.value = supportedVisualizationUserProfile.name
        htmlGamepadVisualizationUserProfileSelectOption.textContent = supportedVisualizationUserProfile.name
        htmlGamepadVisualizationUserProfileSelect.appendChild(htmlGamepadVisualizationUserProfileSelectOption)
    }
    htmlGamepadVisualizationUserProfileSelect.addEventListener("change", () => {
        const userProfile = getLocalStorageGamepadVisualizationUserProfile(visualizationProfile, htmlGamepadVisualizationUserProfileSelect.value)
        globalGamepads.set(gamepad.index, Object.assign(globalGamepads.get(gamepad.index), { userProfile }))
        const gamepadVisualizationProfiles = `gamepadVisualizationUserProfiles-${visualizationProfile.profileName}`
        localStorage.setItem(gamepadVisualizationProfiles + "-lastUsed", userProfile.name)
        updateGamepadListElements()
    })
    htmlLiElementGamepad.appendChild(htmlGamepadVisualizationUserProfileSelect)
    htmlGamepadVisualizationUserProfileSelect.value = userProfile.name
    htmlLiElementGamepad.appendChild(document.createElement("br"))
    htmlLiElementGamepad.appendChild(document.createElement("br"))



    // TODO: Add select statement for supported visualization profiles which on click updates globalGamepads and renders all gamepadListElements again
    // TODO: Add select statement for profiles

    const lastUseProfileOfVisualizationProfile = localStorage.getItem(`gamepadVisualizationUserProfiles-${visualizationProfile.profileName}-lastUsed`)
    const existingUserProfile = getLocalStorageGamepadVisualizationUserProfile(visualizationProfile, userProfile.name ? userProfile.name : lastUseProfileOfVisualizationProfile)
    if (userProfile.name === undefined && existingUserProfile !== undefined) {
        for (const key of Object.keys(existingUserProfile)) {
            userProfile[key] = existingUserProfile[key]
        }
    }

    for (const visualizationProfileOption of visualizationProfile.getOptions()) {
        const htmlGamepadVisualizationProfile = document.createElement("label")
        htmlGamepadVisualizationProfile.textContent = visualizationProfileOption.name + ":"
        htmlGamepadVisualizationProfile.htmlFor = `controller-${gamepad.index}-${gamepad.id}-${
            visualizationProfile.profileName
            }-${visualizationProfileOption.id}`
        htmlLiElementGamepad.appendChild(htmlGamepadVisualizationProfile)
        const htmlGamepadVisualizationProfileOption = document.createElement("input")
        htmlGamepadVisualizationProfileOption.id = `controller-${gamepad.index}-${gamepad.id}-${
            visualizationProfile.profileName
            }-${visualizationProfileOption.id}`
        if (visualizationProfileOption.inputType === "COLOR") {
            htmlGamepadVisualizationProfileOption.type = "color"
            if (userProfile[visualizationProfileOption.id] !== undefined) {
                htmlGamepadVisualizationProfileOption.value = userProfile[visualizationProfileOption.id]
            }
        }
        if (visualizationProfileOption.inputType === "CHECKBOX") {
            htmlGamepadVisualizationProfileOption.type = "checkbox"
            if (userProfile[visualizationProfileOption.id] !== undefined) {
                htmlGamepadVisualizationProfileOption.checked = userProfile[visualizationProfileOption.id]
            }
        }
        if (visualizationProfileOption.inputType === "TEXT") {
            htmlGamepadVisualizationProfileOption.type = "text"
            if (userProfile[visualizationProfileOption.id] !== undefined) {
                htmlGamepadVisualizationProfileOption.value = userProfile[visualizationProfileOption.id]
            }
        }

        htmlGamepadVisualizationProfileOption.addEventListener("change", () => {
            if (userProfile.name === undefined) {
                userProfile.name = "No name"
            }
            userProfile[visualizationProfileOption.id] = (visualizationProfileOption.inputType === "CHECKBOX")
                ? htmlGamepadVisualizationProfileOption.checked : htmlGamepadVisualizationProfileOption.value
            addOrUpdateLocalStorageGamepadVisualizationUserProfile(visualizationProfile, userProfile)
            globalForceRedraw = true
        })
        htmlGamepadVisualizationProfileOption.alt = visualizationProfileOption.description
        htmlLiElementGamepad.appendChild(htmlGamepadVisualizationProfileOption)
        htmlLiElementGamepad.appendChild(document.createElement("br"))
    }

    // Reset visualization profile
    const htmlResetVisualizationProfileOptions = document.createElement("input")
    htmlResetVisualizationProfileOptions.type = "button"
    htmlResetVisualizationProfileOptions.value = "Reset user profile options"
    htmlResetVisualizationProfileOptions.addEventListener("click", () => {
        removeLocalStorageGamepadVisualizationUserProfile(visualizationProfile, userProfile)
        for (const key of Object.keys(userProfile)) {
            delete userProfile[key]
        }
        userProfile.name = "Default"
        updateGamepadListElements()
    })
    htmlLiElementGamepad.appendChild(htmlResetVisualizationProfileOptions)

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

function updateGamepadListElements() {
    for (const [_, gamepadInfo] of globalGamepads) {
        removeGamepadListElement(gamepadInfo.gamepad)
    }
    for (const [_, gamepadInfo] of globalGamepads) {
        addGamepadListElement(gamepadInfo.gamepad, gamepadInfo.visualizationProfile, gamepadInfo.userProfile)
    }
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
    const lastUseProfileOfVisualizationProfile = localStorage.getItem(`gamepadVisualizationUserProfiles-${visualizationProfile.profileName}-lastUsed`)
    const existingUserProfile = getLocalStorageGamepadVisualizationUserProfile(visualizationProfile, lastUseProfileOfVisualizationProfile)
    let userProfile = { name: "Default" }
    if (existingUserProfile) {
        userProfile = existingUserProfile
    }
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

const globalGamepadDrawPadding = 20

/**
 * Draw all gamepads
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context which should be used to draw
 * @param {GamepadInfoMap} gamepads The container that contains all gamepad information
 * @typedef {{drawAlphaMask?: boolean}} GlobalOptions
 * @param {GlobalOptions} options Additional global options
 */
const drawGamepads = (ctx, gamepads, options) => {
    // If multiple gamepads calculate information for their draw layout
    let heightOfAllGamepads
    let widthOfAllGamepads
    const gamePadSizes = []
    const gamePadPadding = []
    if (gamepads.size >= 1) {
        heightOfAllGamepads = globalGamepadDrawPadding * (gamepads.size - 1)
        widthOfAllGamepads = globalGamepadDrawPadding * (gamepads.size - 1)
        for (const [_, gamepadInfo] of gamepads) {
            heightOfAllGamepads += gamepadInfo.visualizationProfile.getDrawSize().height
            widthOfAllGamepads += gamepadInfo.visualizationProfile.getDrawSize().width
            gamePadSizes.push(gamepadInfo.visualizationProfile.getDrawSize())
            gamePadPadding.push(gamePadPadding.length === 0 ? 0 : gamePadPadding.slice(-1)[0] + globalGamepadDrawPadding)
        }
    }

    for (const [gamepadIndex, gamepadInfo] of gamepads.entries()) {
        let gamepadX
        let gamepadY

        // When only one gamepad center it
        gamepadX = ctx.canvas.width / 2
        gamepadY = ctx.canvas.height / 2

        // If multiple gamepads determine if vertical or horizontal rendering based on what is larger
        if (gamepads.size !== 1) {
            if (ctx.canvas.height > ctx.canvas.width) {
                gamepadY = ((ctx.canvas.height - heightOfAllGamepads) / 2) + // upper offset to controllers
                    gamePadSizes.slice(0, gamepadIndex).reduce((a, b) => a + b.height, 0) + // controllers above
                    gamePadPadding[gamepadIndex] + // spacing between controllers above
                    gamePadSizes[gamepadIndex].height / 2 // half of the controller height
            } else {
                gamepadX = ((ctx.canvas.width - widthOfAllGamepads) / 2) + // left offset to controllers
                    gamePadSizes.slice(0, gamepadIndex).reduce((a, b) => a + b.width, 0) + // controllers left
                    gamePadPadding[gamepadIndex] + // spacing between controllers left
                    gamePadSizes[gamepadIndex].width / 2 // half of the controller width
            }
        }
        gamepadInfo.visualizationProfile.draw(ctx, gamepadX, gamepadY, gamepadInfo.gamepad,
            { ...options, ...gamepadInfo.userProfile })
    }
}

/**
 * Draw a frame
 * @param {CanvasRenderingContext2D} ctx
 */
const draw = (ctx) => {
    globalForceRedraw = false
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    if (globalGamepads.size > 0) {
        /** @type {{drawAlphaMask?: boolean, [key: string]: any}} **/
        const options = {
            drawAlphaMask: globalOptionDrawAlphaMask
        }
        ctx.fillStyle = globalOptionDrawAlphaMask === true ? "black" : globalOptionBackgroundColor
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        drawGamepads(ctx, globalGamepads, options)
    } else {
        ctx.fillStyle = globalOptionBackgroundColor
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = "rgba(255,255,255,0.35)"
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        const fontSize = Math.floor(Math.min(50, Math.min(ctx.canvas.width, ctx.canvas.height) / 10))
        ctx.font = `${fontSize}px Helvetica`
        ctx.fillStyle = "black"
        const textConnectGamepad = "Connect a\ngamepad and\npress any\nbutton"
        const textConnectGamepadParts = textConnectGamepad.split("\n")
        const heightCenter = ctx.canvas.height / 2 - ((fontSize + 5) * textConnectGamepadParts.length) / 2
        for (const [index, textConnectGamepadPart] of textConnectGamepadParts.entries()) {
            const textConnectGamepadSize = ctx.measureText(textConnectGamepadPart)
            ctx.fillText(textConnectGamepadPart, ctx.canvas.width / 2 - textConnectGamepadSize.width / 2, heightCenter + index * (fontSize + 5))
        }
    }

    if (globalDebug) {
        ctx.font = "30px Helvetica"
        ctx.fillStyle = "black"
        ctx.fillText(globalTimeLastFrame.toString(), 50, 50)
        ctx.fillText(`fps: ${fps.toPrecision(3)}`, 200, 50)
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
        if (globalDebug) {
            console.log("don't draw because update has no new information")
        }
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

    globalCtx.fillStyle = globalOptionBackgroundColor
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

/**
 * Setup global options
 */
const initializeGlobalOptions = () => {
    globalOptionBackgroundColor = checkAndSetLocalStorageForId("backgroundColor", "#DCDCDC")
    globalOptionDrawAlphaMask = checkAndSetLocalStorageForId("drawAlphaMask", false, {
        jsonParseLocalStorageValue: true,
        jsonStringifyDefaultValue: true
    })
    globalDebug = checkAndSetLocalStorageForId("debug", false, {
        jsonParseLocalStorageValue: true,
        jsonStringifyDefaultValue: true
    })
}

const createOptionsInput = () => {
    // Set default options
    initializeGlobalOptions()

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
        initializeGlobalOptions()
        // Force redraw of canvas
        globalForceRedraw = true
    })
}

window.addEventListener('load', () => {
    // Wait until the page is fully loaded then
    initializeCanvas()
    createOptionsInput()

    // Start render loop
    globalAnimationFrameRequest = window.requestAnimationFrame(loop)
})
