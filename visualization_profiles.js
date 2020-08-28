/**
 * Superclass that defines the structure of any gamepad visualization profile
 */
class GamepadVisualizationProfile {
    /**
     * The name of the visualization profile
     * @type {string}
     */
    profileName = undefined
    /**
     * Check if a gamepad is supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadIsSupported(gamepad) {
        throw Error("Method not implemented.")
    }
    /**
     * Check if a gamepad can be supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadCanBeSupported(gamepad) {
        throw Error("Method not implemented.")
    }
    /**
     * Draw a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {{drawAlphaMask?: boolean, [key: string]: any}} options
     */
    draw(ctx, x, y, gamepad, options = {}) {
        throw Error("Method not implemented.")
    }
    /**
     * Get the draw size of the gamepad if it would be drawn
     * @returns {{width: number;height: number}}
     */
    getDrawSize() {
        throw Error("Method not implemented.")
    }
    /**
     * Get the options of the visualization profile
     * @returns {{name: string, id: string, inputType: "COLOR"|"TEXT"|"CHECKBOX", description?: string}[]}
     */
    getOptions() {
        return [{
            id: "profileName",
            inputType: "TEXT",
            name: "Controller profile name",
            description: "Enter a name for the options of this controller"
        }]
    }
    /**
     * Get the mapping of the buttons and axes
     * @returns {{buttons: string[], axes: string[]}}
     */
    getMapping() {
        throw Error("Method not implemented.")
    }
}

/**
 * @typedef {{drawAlphaMask?: boolean, [key: string]: any}} GeneralDrawOptions
 */


/**
 * Draw a bounding box if global debug is true
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {{width: number; height: number}} boundaries
 */
const drawDebugBoundingBox = (ctx, x, y, boundaries) => {
    if (globalDebug) {
        // Draw object boundaries
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2;
        ctx.strokeRect(x - boundaries.width / 2, y - boundaries.height / 2,
            boundaries.width, boundaries.height)
        // Draw object center
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.stroke()
    }
}

class DrawCollectionXBoxOne360Controller {
    static infoButtonABXY = Object.freeze({
        radius: 10
    })
    static get sizeButtonABXY() {
        return Object.freeze({
            width: (this.infoButtonABXY.radius * 2) * 1.75,
            height: (this.infoButtonABXY.radius * 2) * 1.75
        })
    }
    static get sizeButtonGroupABXY() {
        return Object.freeze({
            width: this.sizeButtonABXY.width * 3,
            height: this.sizeButtonABXY.height * 3
        })
    }
    static infoRsbLsb = Object.freeze({
        axisRadius: 15
    })
    static get sizeRsbLsb() {
        return Object.freeze({
            width: ((this.infoRsbLsb.axisRadius * 2) * 1.45 * 2),
            height: ((this.infoRsbLsb.axisRadius * 2) * 1.45 * 2)
        })
    }
    static infoDPad = Object.freeze({
        tileWidth: 25,
        tileHeight: 25
    })
    static get sizeDPad() {
        return Object.freeze({
            width: this.infoDPad.tileWidth * 3,
            height: this.infoDPad.tileHeight * 3
        })
    }
    static infoButtonRbLb = Object.freeze({
        pathWidth: 127,
        pathHeight: 26,
        pressHeight: 12,
        additionalHeight: 15
    })
    static get sizeButtonRbLb() {
        return Object.freeze({
            width: 127,
            height: this.infoButtonRbLb.pathHeight + this.infoButtonRbLb.additionalHeight + this.infoButtonRbLb.pressHeight
        })
    }
    static infoTrigger = Object.freeze({
        width: 25,
        pressDepth: 35,
        baseDepth: 25
    })
    static get sizeTrigger() {
        return Object.freeze({
            width: this.infoTrigger.width,
            height: this.infoTrigger.baseDepth + this.infoTrigger.pressDepth
        })
    }
    static sizeButtonX = Object.freeze({
        width: 50,
        height: 50
    })
    static sizeButtonStartBack = Object.freeze({
        width: 25,
        height: 25
    })
    static sizeCase = Object.freeze({
        width: 558,
        height: 335
    })
    static get sizeController() {
        return Object.freeze({
            width: this.sizeCase.width,
            height: this.sizeCase.height + (this.sizeTrigger.height * 0.9)
        })
    }
    /**
     * Draw the whole controller
     * @param {"FIREFOX"|"CHROMIUM"} mapping
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawController(mapping, ctx, x, y, gamepad, options = {}) {
        x -= this.sizeController.width / 2
        y -= this.sizeController.height / 2

        let startIndexButtonAxes = 10
        let startIndexAxisLeft = 0
        let startIndexAxisRight = 2
        let startIndexStartBack = 8
        let startIndexBigX = 16

        if (mapping === "FIREFOX") {
            startIndexButtonAxes = 9
            startIndexAxisRight = 3
            startIndexStartBack = 6
            startIndexBigX = 8
        }

        /** @type {"LEFT" | "RIGHT"} */
        let pressDirectionHorizontal
        /** @type {"UP" | "DOWN"} */
        let pressDirectionVertical

        if (mapping === "FIREFOX") {
            const startIndexAxisPlus = 6
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
            const startIndexButtonPlus = 12
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

        this.drawTrigger(ctx,
            x + (this.sizeCase.width / 5 * 1) + this.sizeTrigger.width / 2,
            y + this.sizeTrigger.height / 2,
            mapping === "FIREFOX" ? ((gamepad.axes[2] + 1) / 2) : gamepad.buttons[6].value, options)
        this.drawTrigger(ctx,
            x + (this.sizeCase.width / 5 * 4) - this.sizeTrigger.width / 2,
            y + this.sizeTrigger.height / 2,
            mapping === "FIREFOX" ? ((gamepad.axes[5] + 1) / 2) : gamepad.buttons[7].value, options)

        this.drawButtonRbLb(ctx,
            x + (this.sizeCase.width / 20 * 3) + this.sizeButtonRbLb.width / 2,
            y + this.sizeButtonRbLb.height / 2 + this.sizeTrigger.height * 0.55,
            "LB", gamepad.buttons[4].value > 0, options)
        this.drawButtonRbLb(ctx,
            x + (this.sizeCase.width / 20 * 17) - this.sizeButtonRbLb.width / 2,
            y + this.sizeButtonRbLb.height / 2 + this.sizeTrigger.height * 0.55,
            "RB", gamepad.buttons[5].value > 0, options)

        this.drawCase(ctx,
            x + this.sizeCase.width / 2,
            y + this.sizeCase.height / 2 + this.sizeTrigger.height * 0.9,
            options)

        this.drawButtonGroupABXY(ctx,
            x + (this.sizeCase.width / 10 * 8.25) - this.sizeButtonGroupABXY.width / 2,
            y + this.sizeButtonGroupABXY.height / 2 + 70,
            gamepad.buttons[0], gamepad.buttons[1], gamepad.buttons[2], gamepad.buttons[3], options)

        this.drawRsbLsb(ctx,
            x + (this.sizeCase.width / 10 * 1.75) + this.sizeRsbLsb.width / 2,
            y + this.sizeRsbLsb.height / 2 + 75,
            gamepad.axes[startIndexAxisLeft], gamepad.axes[startIndexAxisLeft + 1],
            gamepad.buttons[startIndexButtonAxes].value > 0, options)

        this.drawRsbLsb(ctx,
            x + (this.sizeCase.width / 10 * 7) - this.sizeRsbLsb.width / 2,
            y + this.sizeRsbLsb.height / 2 + 170,
            gamepad.axes[startIndexAxisRight], gamepad.axes[startIndexAxisRight + 1], gamepad.buttons[startIndexButtonAxes + 1].value > 0, options)

        this.drawDPad(ctx,
            x + (this.sizeCase.width / 10 * 3) + this.sizeDPad.width / 2,
            y + this.sizeDPad.height / 2 + 175,
            pressDirectionVertical, pressDirectionHorizontal, options)

        // 8,9 - 6,7 firefox
        this.drawButtonStartBack(ctx,
            x + (this.sizeCase.width / 10 * 4) + this.sizeButtonStartBack.width / 2,
            y + this.sizeButtonStartBack.height / 2 + 105,
            "START", gamepad.buttons[startIndexStartBack].value > 0, options)

        this.drawButtonStartBack(ctx,
            x + (this.sizeCase.width / 10 * 6) - this.sizeButtonStartBack.width / 2,
            y + this.sizeButtonStartBack.height / 2 + 105,
            "BACK", gamepad.buttons[startIndexStartBack + 1].value > 0, options)

        this.drawButtonX(ctx,
            x + (this.sizeCase.width / 2) + 0,
            y + this.sizeButtonX.height / 2 + 65,
            gamepad.buttons[startIndexBigX].value > 0, options)

        if (options.showProfileName === true) {
            ctx.font = "20px Helvetica"
            ctx.fillStyle = options.colorProfileName !== undefined ? options.colorProfileName : "black"
            const textMeasurements = ctx.measureText(options.profileName)
            ctx.fillText(options.profileName, x + this.sizeCase.width / 2 - textMeasurements.width / 2, y + 20)
        }

        drawDebugBoundingBox(ctx, x + this.sizeController.width / 2, y + this.sizeController.height / 2, this.sizeController)
    }
    /**
     * Draw the case of the controller
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawCase(ctx, x, y, options = {}) {
        ctx.translate(x - this.sizeCase.width / 2, y - this.sizeCase.height / 2)
        ctx.scale(2.25, 2.25)
        ctx.fillStyle = options.drawAlphaMask === true ? "white"
            : (options.colorCase !== undefined ? options.colorCase : "white")
        ctx.fill(new Path2D("M 158.75,-3.3333336e-7 C 188.1297,1.2619967 200.15153,6.9023647 211.66666,13.229168 c 7.97865,4.807494 12.50223,13.639725 15.875,23.812499 6.28144,22.082684 18.31653,45.56543 19.84375,66.145833 0.87505,12.34553 5.34551,42.75628 -23.8125,46.30208 -5.45657,-0.78677 -11.52732,-6.52704 -17.19791,-11.90625 -10.13244,-10.00018 -15.82707,-23.03864 -39.6875,-29.10416 H 124.35416 V -3.3333336e-7 Z m -68.791666,0 C 60.578632,1.2619967 48.556805,6.9023647 37.041667,13.229167 29.063019,18.036661 24.539443,26.868892 21.166667,37.041666 14.885229,59.124349 2.8501433,82.607102 1.3229183,103.18751 c -0.87504897,12.34553 -5.345502,42.75628 23.8124987,46.30208 5.456574,-0.78677 11.527325,-6.52704 17.197917,-11.90625 10.132433,-10.00019 15.827062,-23.03864 39.687499,-29.10417 H 124.35417 V -3.3333336e-7 Z"))
        ctx.scale(1 / 2.25, 1 / 2.25)
        ctx.translate(-x + this.sizeCase.width / 2, -y + this.sizeCase.height / 2)

        drawDebugBoundingBox(ctx, x, y, this.sizeCase)
    }
    /**
     * Draw a small button of gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {"START"|"BACK"} buttonType The direction of the button
     * @param {boolean} pressed Button is pressed indicator
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawButtonStartBack(ctx, x, y, buttonType, pressed = false, options = {}) {
        ctx.beginPath()
        ctx.arc(x, y, 25 / 2, 0, 2 * Math.PI);
        if (pressed) {
            ctx.fillStyle = options.drawAlphaMask === true ? "white" :
                (options.colorStartBackPressed !== undefined ? options.colorStartBackPressed : "#313131")
        } else {
            ctx.fillStyle = options.drawAlphaMask === true ? "white" :
                (options.colorStartBack !== undefined ? options.colorStartBack : "#616161")
        }
        ctx.fill()

        drawDebugBoundingBox(ctx, x, y, this.sizeButtonStartBack)
    }
    /**
     * Draw a big button of gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {boolean} pressed Button is pressed indicator
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawButtonX(ctx, x, y, pressed = false, options = {}) {
        ctx.beginPath()
        ctx.arc(x, y, 25, 0, 2 * Math.PI);
        if (pressed) {
            ctx.fillStyle = options.drawAlphaMask === true ? "white" :
                (options.colorXboxPressed !== undefined ? options.colorXboxPressed : "#313131")
        } else {
            ctx.fillStyle = options.drawAlphaMask === true ? "white" :
                (options.colorXbox !== undefined ? options.colorXbox : "#616161")
        }
        ctx.fill()

        drawDebugBoundingBox(ctx, x, y, this.sizeButtonX)
    }
    /**
     * Draw a button of a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} pressedValue Press direction (0 - 1)
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawTrigger(ctx, x, y, pressedValue = 0, options = {}) {
        ctx.fillStyle = options.drawAlphaMask === true ? "white" :
            (options.colorRtLt !== undefined ? options.colorRtLt : "#616161")

        ctx.fillRect(x - this.infoTrigger.width / 2, y - (this.infoTrigger.pressDepth + this.infoTrigger.baseDepth) / 2 + (this.infoTrigger.pressDepth * pressedValue), this.infoTrigger.width, this.infoTrigger.baseDepth + (this.infoTrigger.pressDepth * (1 - pressedValue)))

        drawDebugBoundingBox(ctx, x, y, this.sizeTrigger)
    }
    /**
     * Draw a button of a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {"LB"|"RB"} buttonType The direction of the button
     * @param {boolean} pressed Vertical press direction
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawButtonRbLb(ctx, x, y, buttonType, pressed = undefined, options = {}) {
        ctx.fillStyle = options.drawAlphaMask === true ? "white" :
            (options.colorRbLb !== undefined ? options.colorRbLb : "black")

        ctx.translate(x - this.sizeButtonRbLb.width / 2, y - this.sizeButtonRbLb.height / 2 + (pressed ? this.infoButtonRbLb.pressHeight : 0))
        if (buttonType === "RB") {
            ctx.scale(-1, 1);
            ctx.translate(-this.infoButtonRbLb.pathWidth, 0)
        }
        ctx.fill(new Path2D(`m ${this.infoButtonRbLb.pathWidth},26 0,-8.524568 C 113.3988,7.1608169 98.857572,0.88512457 83.125242,0.3078023 42.799301,2.3602042 20.279728,15.078099 0,26.458333 Z`))
        if (buttonType === "RB") {
            ctx.translate(this.infoButtonRbLb.pathWidth, 0)
            ctx.scale(-1, 1);
        }
        ctx.translate(-x + this.sizeButtonRbLb.width / 2, -y - (pressed ? this.infoButtonRbLb.pressHeight : 0) + this.sizeButtonRbLb.height / 2)
        ctx.fillRect(x - this.sizeButtonRbLb.width / 2,
            y + this.infoButtonRbLb.pathHeight + (pressed ? this.infoButtonRbLb.pressHeight : 0) - this.sizeButtonRbLb.height / 2,
            this.infoButtonRbLb.pathWidth, this.infoButtonRbLb.additionalHeight + (pressed ? 0 : this.infoButtonRbLb.pressHeight))

        drawDebugBoundingBox(ctx, x, y, this.sizeButtonRbLb)
    }
    /**
     * Draw a button of a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {"UP"|"DOWN"} pressDirectionVertical Vertical press direction
     * @param {"LEFT"|"RIGHT"} pressDirectionHorizontal Horizontal press direction
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawDPad(ctx, x, y, pressDirectionVertical = undefined, pressDirectionHorizontal = undefined, options = {}) {
        const positionX = (tileIndex = 0) => x - this.infoDPad.tileWidth / 2 + this.infoDPad.tileWidth * tileIndex
        const positionY = (tileIndex = 0) => y - this.infoDPad.tileWidth / 2 - this.infoDPad.tileWidth * tileIndex

        const fillStyleNormal = options.drawAlphaMask === true ? "white" :
            (options.colorDPad !== undefined ? options.colorDPad : '#000000')
        const fillStylePressed = options.drawAlphaMask === true ? "white" :
            (options.colorDPadPressed !== undefined ? options.colorDPadPressed : "grey")

        // "Underlay" - otherwise some pixel lines are drawn
        ctx.beginPath()
        ctx.rect(positionX(0), positionY(1),
            this.infoDPad.tileWidth, this.infoDPad.tileHeight * 3)
        ctx.rect(positionX(-1), positionY(0),
            this.infoDPad.tileWidth * 3, this.infoDPad.tileHeight)
        ctx.fillStyle = fillStyleNormal
        ctx.fill()

        // Up
        ctx.beginPath()
        ctx.rect(positionX(0), positionY(1),
            this.infoDPad.tileWidth, this.infoDPad.tileHeight)
        ctx.fillStyle = pressDirectionVertical === "UP" ? fillStylePressed : fillStyleNormal
        ctx.moveTo(positionX(0.5), positionY(-0.5))
        ctx.lineTo(positionX(0), positionY(0))
        ctx.lineTo(positionX(1), positionY(0))
        ctx.fill()
        // Down
        ctx.beginPath()
        ctx.rect(positionX(0), positionY(-1),
            this.infoDPad.tileWidth, this.infoDPad.tileHeight)
        ctx.moveTo(positionX(0.5), positionY(-0.5))
        ctx.lineTo(positionX(1), positionY(-1))
        ctx.lineTo(positionX(0), positionY(-1))
        ctx.fillStyle = pressDirectionVertical === "DOWN" ? fillStylePressed : fillStyleNormal
        ctx.fill()
        // Left
        ctx.beginPath()
        ctx.rect(positionX(-1), positionY(0),
            this.infoDPad.tileWidth, this.infoDPad.tileHeight)
        ctx.moveTo(positionX(0.5), positionY(-0.5))
        ctx.lineTo(positionX(0), positionY(0))
        ctx.lineTo(positionX(0), positionY(-1))
        ctx.fillStyle = pressDirectionHorizontal === "LEFT" ? fillStylePressed : fillStyleNormal
        ctx.fill()
        // Right
        ctx.beginPath()
        ctx.rect(positionX(1), positionY(0),
            this.infoDPad.tileWidth, this.infoDPad.tileHeight)
        ctx.moveTo(positionX(0.5), positionY(-0.5))
        ctx.lineTo(positionX(1), positionY(0))
        ctx.lineTo(positionX(1), positionY(-1))
        ctx.fillStyle = pressDirectionHorizontal === "RIGHT" ? fillStylePressed : fillStyleNormal
        ctx.fill()

        drawDebugBoundingBox(ctx, x, y, this.sizeDPad)
    }

    /**
     * Draw a button of a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} axisX Axis X
     * @param {number} axisY Axis Y
     * @param {boolean} pressed Indicator if button is pressed
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawRsbLsb(ctx, x, y, axisX, axisY, pressed = false, options = {}) {
        ctx.beginPath()
        ctx.arc(x, y, (this.infoRsbLsb.axisRadius * 2) * 1.45, 0, 2 * Math.PI)
        if (options.drawAlphaMask === true) {
            ctx.fillStyle = "white"
        } else if (options.colorRsbLsb !== undefined) {
            ctx.fillStyle = options.colorRsbLsb
        } else {
            ctx.fillStyle = ctx.createRadialGradient(x, y, 1, x, y, 55)
            ctx.fillStyle.addColorStop(0, '#C0C0C0')
            ctx.fillStyle.addColorStop(1, '#717171')
        }
        ctx.fill()
        ctx.beginPath()
        const middleButtonRadius = (this.infoRsbLsb.axisRadius * 2) * 0.45
        ctx.arc(x + (axisX * middleButtonRadius), y + (axisY * middleButtonRadius),
            this.infoRsbLsb.axisRadius * (pressed ? 2 : 1.75), 0, 2 * Math.PI)
        if (options.drawAlphaMask === true) {
            ctx.fillStyle = "white"
        } else {
            ctx.fillStyle = ctx.createRadialGradient(
                x + (axisX * (this.infoRsbLsb.axisRadius * 2) * 0.45),
                y + (axisY * (this.infoRsbLsb.axisRadius * 2) * 0.45),
                1, x + (axisX * (this.infoRsbLsb.axisRadius * 2) * 0.45),
                y + (axisY * (this.infoRsbLsb.axisRadius * 2) * 0.45),
                55
            )
            ctx.fillStyle.addColorStop(0, '#000000')
            ctx.fillStyle.addColorStop(1, '#404040')
        }
        ctx.fill()

        drawDebugBoundingBox(ctx, x, y, this.sizeRsbLsb)
    }

    /**
     * Draw a button of a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {string} name Button display text
     * @param {string} color Button color
     * @param {boolean} pressed Indicator if button is pressed
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawButtonABXY(ctx, x, y, name, color = "black", pressed = false, options = {}) {
        ctx.beginPath()
        ctx.arc(x, y, this.infoButtonABXY.radius * 2, 0, 2 * Math.PI);
        ctx.fillStyle = color
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, this.infoButtonABXY.radius * 2, 0, 2 * Math.PI);
        ctx.fillStyle = options.drawAlphaMask === true ? "white" : hexToRgba("#FFFFFF", pressed ? 0.2 : 0.4)
        ctx.fill()

        const fontHeightPt = 20
        ctx.font = `bold ${fontHeightPt}pt Helvetica`
        const textButtonSize = ctx.measureText(name);
        ctx.fillStyle = options.drawAlphaMask === true ? "white" : color
        ctx.fillText(name, x - (textButtonSize.width / 2),
            y + (fontHeightPt * 0.4))

        drawDebugBoundingBox(ctx, x, y, this.sizeButtonABXY)
    }

    /**
     * Draw a button of a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {GamepadButton} buttonA Button A
     * @param {GamepadButton} buttonB Button B
     * @param {GamepadButton} buttonX Button X
     * @param {GamepadButton} buttonY Button Y
     * @param {XBoxOne360ControllerOptions} options
     */
    static drawButtonGroupABXY(ctx, x, y, buttonA, buttonB, buttonX, buttonY, options = {}) {
        this.drawButtonABXY(ctx, x, y + this.sizeButtonABXY.height,
            "A", options.colorA !== undefined ? options.colorA : "#6DA13A", buttonA.value > 0, options)
        this.drawButtonABXY(ctx, x, y - this.sizeButtonABXY.height,
            "Y", options.colorY !== undefined ? options.colorY : "#FA9D23", buttonY.value > 0, options)
        this.drawButtonABXY(ctx, x + this.sizeButtonABXY.width, y,
            "B", options.colorB !== undefined ? options.colorB : "#D41F1F", buttonB.value > 0, options)
        this.drawButtonABXY(ctx, x - this.sizeButtonABXY.width, y,
            "X", options.colorX !== undefined ? options.colorX : "#234EFA", buttonX.value > 0, options)

        drawDebugBoundingBox(ctx, x, y, this.sizeButtonGroupABXY)
    }
}

class XBoxOne360Controller extends GamepadVisualizationProfile {
    /**
     * @param {"CHROMIUM"|"FIREFOX"} xboxMapping
     */
    constructor(xboxMapping) {
        super()
        this.xboxMapping = xboxMapping
    }
    /**
     * Draw a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {XBoxOne360ControllerOptions} options
     */
    draw(ctx, x, y, gamepad, options = {}) {
        DrawCollectionXBoxOne360Controller.drawController(this.xboxMapping, ctx, x, y, gamepad, options)
    }
    /**
     * Get the options of the visualization profile
     * @typedef {{drawAlphaMask?: boolean; profileName?: string; showProfileName?: boolean; colorCase?: string; colorProfileName?: string; colorRtLt?: string; colorRbLb?: string; colorDPad?: string; colorDPadPressed?: string; colorRsbLsb?: string; colorXbox?: string; colorXboxPressed?: string; colorA?: string; colorB?: string; colorX?: string; colorY?: string; colorStartBack?: string; colorStartBackPressed?: string}} XBoxOne360ControllerOptions
     * @returns {{name: string, id: string, inputType: "COLOR"|"TEXT"|"CHECKBOX", description?: string}[]}
     */
    getOptions() {
        return [... super.getOptions(), {
            id: "showProfileName",
            inputType: "CHECKBOX",
            name: "Show profile name"
        }, {
            id: "colorCase",
            inputType: "COLOR",
            name: "Case color"
        }, {
            id: "colorProfileName",
            inputType: "COLOR",
            name: "Profile name color"
        }, {
            id: "colorRtLt",
            inputType: "COLOR",
            name: "RT and LT button color"
        }, {
            id: "colorRbLb",
            inputType: "COLOR",
            name: "RB and LB button color"
        }, {
            id: "colorDPad",
            inputType: "COLOR",
            name: "D-Pad color (normal)"
        }, {
            id: "colorDPadPressed",
            inputType: "COLOR",
            name: "D-Pad color (when pressed)"
        }, {
            id: "colorRsbLsb",
            inputType: "COLOR",
            name: "RSB and LSB button color"
        }, {
            id: "colorXbox",
            inputType: "COLOR",
            name: "XBox button color (normal)"
        }, {
            id: "colorA",
            inputType: "COLOR",
            name: "A button color"
        }, {
            id: "colorB",
            inputType: "COLOR",
            name: "B button color"
        }, {
            id: "colorX",
            inputType: "COLOR",
            name: "X button color"
        }, {
            id: "colorY",
            inputType: "COLOR",
            name: "Y button color"
        }, {
            id: "colorXboxPressed",
            inputType: "COLOR",
            name: "XBox button color (when pressed)"
        }, {
            id: "colorStartBack",
            inputType: "COLOR",
            name: "Start and Back button color (normal)"
        }, {
            id: "colorStartBackPressed",
            inputType: "COLOR",
            name: "Start and Back button color (when pressed)"
        }]
    }
    /**
     * Get the draw size of the gamepad if it would be drawn
     * @returns {{width: number;height: number}}
     */
    getDrawSize() {
        return DrawCollectionXBoxOne360Controller.sizeController
    }
}

class XBoxOne360ControllerChromium extends XBoxOne360Controller {
    constructor() {
        super("CHROMIUM")
    }
    /**
     * The name of the visualization profile
     * @type {string}
     */
    profileName = "XBoxOne360ControllerChromium"
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
     * Get the mapping of the buttons and axes
     * @returns {{buttons: string[], axes: string[]}}
     */
    getMapping() {
        return {
            axes: [
                "LSB-HORIZONTAL",
                "LSB-VERTICAL",
                "RSB-HORIZONTAL",
                "RSB-VERTICAL"
            ],
            buttons: [
                "A", "B", "X", "Y",
                "LB", "RB",
                "LT", "RT",
                "BACK", "START",
                "LSB", "RSB",
                "D-PAD-UP", "D-PAD-DOWN", "D-PAD-LEFT", "D-PAD-RIGHT",
                "XBOX"
            ]
        }
    }
}

class UnknownController extends GamepadVisualizationProfile {
    /**
     * The name of the visualization profile
     * @type {string}
     */
    profileName = "Unknown"
    /**
     * Check if a gamepad is supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadIsSupported(gamepad) {
        return false
    }
    /**
     * Check if a gamepad can be supported
     * @param {Gamepad} gamepad
     * @returns {boolean}
     */
    static gamepadCanBeSupported(gamepad) {
        return true
    }
    /**
     * Draw a gamepad
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {Gamepad} gamepad
     * @param {{drawAlphaMask?: boolean, [key: string]: any}} options
     */
    draw(ctx, x, y, gamepad, options = {}) {
        DrawCollectionXBoxOne360Controller.drawCase(ctx, x, y, options)
    }
    /**
     * Get the options of the visualization profile
     * @returns {{name: string, id: string, inputType: "COLOR"|"TEXT"|"CHECKBOX", description?: string}[]}
     */
    getOptions() {
        return []
    }
    /**
     * Get the mapping of the buttons and axes
     * @returns {{buttons: string[], axes: string[]}}
     */
    getMapping() {
        return {
            axes: Array(100).fill("Unknown"),
            buttons: Array(100).fill("Unknown")
        }
    }
    /**
     * Get the draw size of the gamepad if it would be drawn
     * @returns {{width: number;height: number}}
     */
    getDrawSize() {
        return DrawCollectionXBoxOne360Controller.sizeCase
    }
}

class XBoxOne360ControllerFirefox extends XBoxOne360Controller {
    constructor() {
        super("FIREFOX")
    }
    /**
     * The name of the visualization profile
     * @type {string}
     */
    profileName = "XBoxOne360ControllerFirefox"
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
     * Get the mapping of the buttons and axes
     * @returns {{buttons: string[], axes: string[]}}
     */
    getMapping() {
        return {
            axes: [
                "LSB-HORIZONTAL",
                "LSB-VERTICAL",
                "LT",
                "RSB-HORIZONTAL",
                "RSB-VERTICAL",
                "RT",
                "D-PAD-HORIZONTAL", "D-PAD-VERTICAL"
            ],
            buttons: [
                "A", "B", "X", "Y",
                "LB", "RB",
                "BACK", "START",
                "XBOX",
                "LSB", "RSB"
            ]
        }
    }
}
