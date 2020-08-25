class GamepadVisualizationProfile {
    /**
     * The name of the visualization profile
     * @type {string}
     */
    static profileName = undefined
    /**
     * Check if a gamepad is supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadIsSupported(gamepad) {
        throw Error("Not implemented")
    }
    /**
     * Check if a gamepad can be supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadCanBeSupported(gamepad) {
        throw Error("Not implemented")
    }
    /**
     * Draw a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {{drawMask?: boolean, [key: string]: any}} options
     */
    static draw(ctx, x, y, gamepad, options = {}) {
        throw Error("Not implemented")
    }
    /**
     * Get the options of the visualization profile
     * @returns {{name: string, id: string, inputType: "COLOR", description?: string}[]}
     */
    static getOptions() {
        return []
    }
}

const globalGamepadButtonRadiusRound = 10

const globalGamepadButtonSizeRound = Object.freeze({
    width: (globalGamepadButtonRadiusRound * 2) * 1.75,
    height: (globalGamepadButtonRadiusRound * 2) * 1.75
})

/**
 * Draw a button of a gamepad
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {string} name Button display text
 * @param {string} color Button color
 * @param {boolean} pressed Indicator if button is pressed
 */
const drawGamepadButtonRound = (ctx, x, y, name, color = "black", pressed = false) => {
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
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {GamepadButton} buttonA Button A
 * @param {GamepadButton} buttonB Button B
 * @param {GamepadButton} buttonX Button X
 * @param {GamepadButton} buttonY Button Y
 */
const drawGamepadButtonGroupXboxABXY = (ctx, x, y, buttonA, buttonB, buttonX, buttonY) => {
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
    drawGamepadButtonRound(ctx, x, y + globalGamepadButtonSizeRound.height,
        "A", "#6DA13A", buttonA.value > 0)
    drawGamepadButtonRound(ctx, x, y - globalGamepadButtonSizeRound.height,
        "Y", "#FA9D23", buttonY.value > 0)
    drawGamepadButtonRound(ctx, x + globalGamepadButtonSizeRound.width, y,
        "B", "#D41F1F", buttonB.value > 0)
    drawGamepadButtonRound(ctx, x - globalGamepadButtonSizeRound.width, y,
        "X", "#234EFA", buttonX.value > 0)

}

const globalGamepadButtonRadiusAxis = 15

const globalGamepadButtonSizeAxis = Object.freeze({
    width: ((globalGamepadButtonRadiusAxis * 2) * 1.45 * 2),
    height: ((globalGamepadButtonRadiusAxis * 2) * 1.45 * 2)
})

/**
 * Draw a button of a gamepad
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {number} axisX Axis X
 * @param {number} axisY Axis Y
 * @param {boolean} pressed Indicator if button is pressed
 */
const drawGamepadButtonAxis = (ctx, x, y, axisX, axisY, pressed = false) => {
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
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {"UP"|"DOWN"} pressDirectionVertical Vertical press direction
 * @param {"LEFT"|"RIGHT"} pressDirectionHorizontal Horizontal press direction
 */
const drawGamepadButtonPlus = (ctx, x, y, pressDirectionVertical = undefined, pressDirectionHorizontal = undefined) => {
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

const globalGamepadButtonInfoTop = Object.freeze({
    pathWidth: 127,
    pathHeight: 26,
    pressHeight: 12,
    additionalHeight: 15
})

const globalGamepadButtonSizeTop = Object.freeze({
    width: 127,
    height: 26 + 15 + 12
})

/**
 * Draw a button of a gamepad
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {"LEFT"|"RIGHT"} buttonDirection The direction of the button
 * @param {boolean} pressed Vertical press direction
 */
const drawGamepadButtonTop = (ctx, x, y, buttonDirection = "LEFT", pressed = undefined) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        ctx.strokeRect(x - globalGamepadButtonSizeTop.width / 2, y - globalGamepadButtonSizeTop.height / 2,
            globalGamepadButtonSizeTop.width, globalGamepadButtonSizeTop.height)
    }
    ctx.fillStyle = "black"

    ctx.translate(x - globalGamepadButtonSizeTop.width / 2, y - globalGamepadButtonSizeTop.height / 2 + (pressed ? globalGamepadButtonInfoTop.pressHeight : 0))
    if (buttonDirection === "RIGHT") {
        ctx.scale(-1, 1);
        ctx.translate(-globalGamepadButtonInfoTop.pathWidth, 0)
    }
    ctx.fill(new Path2D(`m ${globalGamepadButtonInfoTop.pathWidth},26 0,-8.524568 C 113.3988,7.1608169 98.857572,0.88512457 83.125242,0.3078023 42.799301,2.3602042 20.279728,15.078099 0,26.458333 Z`))
    if (buttonDirection === "RIGHT") {
        ctx.translate(globalGamepadButtonInfoTop.pathWidth, 0)
        ctx.scale(-1, 1);
    }
    ctx.translate(-x + globalGamepadButtonSizeTop.width / 2, -y - (pressed ? globalGamepadButtonInfoTop.pressHeight : 0) + globalGamepadButtonSizeTop.height / 2)
    ctx.fillRect(x - globalGamepadButtonSizeTop.width / 2,
        y + globalGamepadButtonInfoTop.pathHeight + (pressed ? globalGamepadButtonInfoTop.pressHeight : 0) - globalGamepadButtonSizeTop.height / 2,
        globalGamepadButtonInfoTop.pathWidth, globalGamepadButtonInfoTop.additionalHeight + (pressed ? 0 : globalGamepadButtonInfoTop.pressHeight))
}

/**
 * Draw a button of a gamepad
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {number} pressedValue Press direction (0 - 1)
 */
const drawGamepadButtonTrigger = (ctx, x, y, pressedValue = 0) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        // ctx.strokeRect(x - globalGamepadButtonSizeTop.width / 2, y - globalGamepadButtonSizeTop.height / 2,
        //     globalGamepadButtonSizeTop.width, globalGamepadButtonSizeTop.height)
    }
    ctx.fillStyle = "#616161"
    const width = 25
    const pressDepth = 35
    const baseDepth = 25

    ctx.fillRect(x - width / 2, y - (pressDepth + baseDepth) / 2 + (pressDepth * pressedValue), width, baseDepth + (pressDepth * (1 - pressedValue)))
}

/**
 * Draw a button of a gamepad
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 */
const drawGamepadCase = (ctx, x, y) => {
    if (debug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        // ctx.strokeRect(x - globalGamepadButtonSizeTop.width / 2, y - globalGamepadButtonSizeTop.height / 2,
        //    globalGamepadButtonSizeTop.width, globalGamepadButtonSizeTop.height)
    }
    ctx.fillStyle = "#F1F1F1"

    ctx.translate(x, y)
    ctx.scale(2.25, 2.25)
    ctx.fill(new Path2D("M 158.75,-3.3333336e-7 C 188.1297,1.2619967 200.15153,6.9023647 211.66666,13.229168 c 7.97865,4.807494 12.50223,13.639725 15.875,23.812499 6.28144,22.082684 18.31653,45.56543 19.84375,66.145833 0.87505,12.34553 5.34551,42.75628 -23.8125,46.30208 -5.45657,-0.78677 -11.52732,-6.52704 -17.19791,-11.90625 -10.13244,-10.00018 -15.82707,-23.03864 -39.6875,-29.10416 H 124.35416 V -3.3333336e-7 Z m -68.791666,0 C 60.578632,1.2619967 48.556805,6.9023647 37.041667,13.229167 29.063019,18.036661 24.539443,26.868892 21.166667,37.041666 14.885229,59.124349 2.8501433,82.607102 1.3229183,103.18751 c -0.87504897,12.34553 -5.345502,42.75628 23.8124987,46.30208 5.456574,-0.78677 11.527325,-6.52704 17.197917,-11.90625 10.132433,-10.00019 15.827062,-23.03864 39.687499,-29.10417 H 124.35417 V -3.3333336e-7 Z"))
    ctx.scale(1 / 2.25, 1 / 2.25)
    ctx.translate(-x, -y)
}

class XBoxOne360ControllerChromium extends GamepadVisualizationProfile {
    /**
     * The name of the visualization profile
     * @type {string}
     */
    static profileName = undefined
    /**
     * Check if a gamepad is supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadIsSupported(gamepad) {
        if (gamepad.id === "Microsoft Controller (STANDARD GAMEPAD Vendor: 045e Product: 02ea)"
            || gamepad.id === "©Microsoft Corporation Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)") {
            return this.gamepadCanBeSupported(gamepad)
        }
        return false
    }
    /**
     * Check if a gamepad can be supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadCanBeSupported(gamepad) {
        if (gamepad.buttons.length >= 17 && gamepad.axes.length >= 4) {
            return true
        }
        return false
    }
    /**
     * Draw a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {{drawMask?: boolean, [key: string]: any}} options
     */
    static draw(ctx, x, y, gamepad, options = {}) {

        let startIndexButtonAxes = 10
        let startIndexAxisLeft = 0
        let startIndexAxisRight = 2



        /** @type {"LEFT" | "RIGHT"} */
        let pressDirectionHorizontal
        /** @type {"UP" | "DOWN"} */
        let pressDirectionVertical

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

        drawGamepadButtonTrigger(ctx, x + globalGamepadButtonSizeAxis.width / 2 + 20, y + globalGamepadButtonSizeAxis.height / 2 - 40,
            gamepad.buttons[6].value)
        drawGamepadButtonTrigger(ctx, x + 300 + globalGamepadButtonSizeAxis.width / 2 - 20, y + globalGamepadButtonSizeAxis.height / 2 - 40,
            gamepad.buttons[7].value)

        drawGamepadButtonTop(ctx, x + globalGamepadButtonSizeAxis.width / 2 + 20, y + globalGamepadButtonSizeAxis.height / 2,
            "LEFT", gamepad.buttons[4].value > 0)
        drawGamepadButtonTop(ctx, x + 300 + globalGamepadButtonSizeAxis.width / 2 - 20, y + globalGamepadButtonSizeAxis.height / 2,
            "RIGHT", gamepad.buttons[5].value > 0)

        drawGamepadCase(ctx, x - 86, y + 36)

        drawGamepadButtonGroupXboxABXY(ctx, x + globalGamepadButtonSizeGroupXboxABXY.width / 2 + 270,
            y + globalGamepadButtonSizeGroupXboxABXY.height / 2 + 70,
            gamepad.buttons[0], gamepad.buttons[1], gamepad.buttons[2], gamepad.buttons[3])

        drawGamepadButtonAxis(ctx, x + globalGamepadButtonSizeAxis.width / 2 + 20, y + globalGamepadButtonSizeAxis.height / 2 + 75,
            gamepad.axes[startIndexAxisLeft], gamepad.axes[startIndexAxisLeft + 1], gamepad.buttons[startIndexButtonAxes].value > 0)

        drawGamepadButtonAxis(ctx, x + globalGamepadButtonSizeAxis.width / 2 + 210, y + globalGamepadButtonSizeAxis.height / 2 + 170,
            gamepad.axes[startIndexAxisRight], gamepad.axes[startIndexAxisRight + 1], gamepad.buttons[startIndexButtonAxes + 1].value > 0)


        drawGamepadButtonPlus(ctx, x + globalGamepadButtonSizePlus.width / 2 + 70, y + globalGamepadButtonSizePlus.height / 2 + 175,
            pressDirectionVertical, pressDirectionHorizontal)
    }
}

class XBoxOne360ControllerFirefox extends GamepadVisualizationProfile {
    /**
     * The name of the visualization profile
     * @type {string}
     */
    static profileName = undefined
    /**
     * Check if a gamepad is supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadIsSupported(gamepad) {
        if (gamepad.id === "045e-02ea-Microsoft X-Box One S pad"
            || gamepad.id === "045e-028e-Microsoft X-Box 360 pad") {
            return this.gamepadCanBeSupported(gamepad)
        }
        return false
    }
    /**
     * Check if a gamepad can be supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadCanBeSupported(gamepad) {
        if (gamepad.buttons.length >= 11 && gamepad.axes.length >= 8) {
            return true
        }
        return false
    }
    /**
     * Draw a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {{drawMask?: boolean, [key: string]: any}} options
     */
    static draw(ctx, x, y, gamepad, options = {}) {
        drawGamepadButtonGroupXboxABXY(ctx, x + globalGamepadButtonSizeGroupXboxABXY.width / 2 + 300,
            y + globalGamepadButtonSizeGroupXboxABXY.height / 2,
            gamepad.buttons[0], gamepad.buttons[1], gamepad.buttons[2], gamepad.buttons[3])

        let startIndexButtonAxes = 9
        let startIndexAxisLeft = 0
        let startIndexAxisRight = 3

        drawGamepadButtonAxis(ctx, x + globalGamepadButtonSizeAxis.width / 2, y + globalGamepadButtonSizeAxis.height / 2,
            gamepad.axes[startIndexAxisLeft], gamepad.axes[startIndexAxisLeft + 1], gamepad.buttons[startIndexButtonAxes].value > 0)

        drawGamepadButtonAxis(ctx, x + globalGamepadButtonSizeAxis.width / 2 + 250, y + globalGamepadButtonSizeAxis.height / 2 + 125,
            gamepad.axes[startIndexAxisRight], gamepad.axes[startIndexAxisRight + 1], gamepad.buttons[startIndexButtonAxes + 1].value > 0)

        /** @type {"LEFT" | "RIGHT"} */
        let pressDirectionHorizontal
        /** @type {"UP" | "DOWN"} */
        let pressDirectionVertical

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

        drawGamepadButtonPlus(ctx, x + globalGamepadButtonSizePlus.width / 2, y + globalGamepadButtonSizePlus.height / 2 + 125,
            pressDirectionVertical, pressDirectionHorizontal)
    }
}
