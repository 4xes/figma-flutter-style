figma.showUI(__html__);
figma.ui.onmessage = msg => {
    if (msg.type === 'create-style') {
        let selection = figma.currentPage.selection;
        for (let node of selection) {
            if (node.type == "TEXT") {
                createStyle(node);
            }
        }
    }
    else if (msg.type === "alert") {
        figma.notify(msg.message);
    }
};
figma.on("selectionchange", () => {
    let selection = figma.currentPage.selection;
    for (let node of selection) {
        if (node.type == "TEXT") {
            createStyle(node);
        }
    }
});
function createStyle(node) {
    let code = "";
    let text = node.characters;
    let fontSize = node.fontSize;
    //TODO support fontFamily
    //var fontFamily = node.fontName["family"];
    let style = node.fontName["style"];
    let color = new FlutterColor().fromTextNode(node);
    let textAlign = null;
    switch (node.textAlignHorizontal) {
        //skip default
        // case "LEFT":
        //   textAlign = "TextAlign.start"
        //   break;
        case "CENTER":
            textAlign = "TextAlign.center";
            break;
        case "RIGHT":
            textAlign = "TextAlign.end";
            break;
        case "JUSTIFIED":
            textAlign = "TextAlign.justify";
            break;
    }
    let fontWeight = null;
    switch (style) {
        // skip default
        // case "Regular":
        // fontWeight = "FontWeight.normal";
        // break;
        case "Semibold":
            fontWeight = "FontWeight.w600";
            break;
        case "Bold":
            fontWeight = "FontWeight.bold";
            break;
    }
    let textStyle = new FlutterObject("TextStyle");
    textStyle.addArgument("color", color);
    textStyle.addArgument("fontSize", fontSize.toFixed(1));
    textStyle.addArgument("fontWeight", fontWeight);
    let textWidget = new FlutterObject("Text");
    textWidget.addValue("\"" + text + "\"");
    textWidget.addArgument("style", textStyle);
    textWidget.addArgument("textAlign", textAlign);
    code += textWidget;
    figma.ui.postMessage(code);
}
class FlutterObject {
    constructor(name) {
        this.params = [];
        this.name = name;
    }
    addValue(value) {
        if (value != null) {
            this.params.push(value.toString());
        }
        else {
            this.params.push("null");
        }
    }
    addArgument(name, value) {
        if (value != null) {
            this.params.push(name + ": " + value.toString());
        }
    }
    addArgumentOpt(name, value) {
        if (value == null) {
            this.params.push(name + ": null");
        }
        else {
            this.params.push(name + ": " + value.toString());
        }
    }
    toString() {
        return this.name + "(" + this.params.join(", ") + ")";
    }
}
class FlutterColor {
    constructor() {
        this.transparent = "Colors.transparent";
        this.white = {
            10: "Colors.white10",
            12: "Colors.white12",
            24: "Colors.white24",
            30: "Colors.white30",
            38: "Colors.white38",
            54: "Colors.white54",
            60: "Colors.white60",
            70: "Colors.white70",
            100: "Colors.white"
        };
        this.black = {
            12: "Colors.black12",
            26: "Colors.black26",
            38: "Colors.black38",
            45: "Colors.black45",
            54: "Colors.black54",
            87: "Colors.black87",
            100: "Colors.black"
        };
        this.not_parsed = "Colors.black";
    }
    fromTextNode(node) {
        return this.fromPaint(node.fills[0]);
    }
    fromPaint(fill) {
        if (fill.type === "SOLID") {
            return this.color(fill.color, fill.opacity);
        }
        else {
            return this.not_parsed;
        }
    }
    color(rgb, o) {
        let opacity = Math.round(o * 100);
        let hexColor = "" + hex(o) + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
        if (hexColor.endsWith("FFFFFF")) {
            let white = this.white[opacity];
            if (white != null) {
                return white;
            }
        }
        if (hexColor.endsWith("000000")) {
            let black = this.black[opacity];
            if (black != null) {
                return black;
            }
        }
        if (opacity === 0) {
            return this.transparent;
        }
        return "Color(0x" + hexColor + ")";
    }
}
function hex(double) {
    return (Math.round(double * 255)).toString(16).toUpperCase().padStart(2, "0");
}
