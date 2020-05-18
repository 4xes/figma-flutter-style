figma.showUI(__html__);
figma.ui.onmessage = msg => {
    if (msg.type === 'create-style') {
        parseSelection();
    }
    else if (msg.type === "alert") {
        figma.notify(msg.message);
    }
};
figma.on("selectionchange", () => {
    parseSelection();
});
function parseSelection() {
    let selection = figma.currentPage.selection;
    let parent = new FlutterParent();
    for (let node of selection) {
        parseNode(node, parent);
    }
    figma.ui.postMessage(parent.toString());
}
function parseNode(node, parent) {
    console.log(node.type);
    if (node.type == "TEXT") {
        parent.addChild(textWidget(node));
    }
    else if (node.type == "GROUP" || node.type == "INSTANCE") {
        let groupParent = new FlutterParent();
        for (let child of node.children) {
            console.log(child.type);
            parseNode(child, groupParent);
        }
        parent.addChild(groupParent);
    }
}
function textWidget(node) {
    let code = "";
    let text = "\"" + node.characters + "\"";
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
    switch (node.textCase) {
        case "LOWER":
            text += ".toLowerCase()";
            break;
        case "TITLE":
            text = "\"" + node.characters.charAt(0).toUpperCase() + node.characters.substring(1) + "\"";
            break;
        case "UPPER":
            text += ".toUpperCase()";
            break;
    }
    let decoration = null;
    switch (node.textDecoration) {
        //skip default
        // case "NONE":
        //     decoration = "TextDecoration.none";
        //     break;
        case "UNDERLINE":
            decoration = "TextDecoration.underline";
            break;
        case "STRIKETHROUGH":
            decoration = "TextDecoration.overline";
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
    textStyle.addArgument("decoration", decoration);
    let textWidget = new FlutterObject("Text");
    textWidget.addValue(text);
    textWidget.addArgument("style", textStyle);
    textWidget.addArgument("textAlign", textAlign);
    code += textWidget;
    return code;
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
    // noinspection JSUnusedGlobalSymbols
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
class FlutterParent {
    constructor() {
        this.name = "Group";
        this.children = [];
    }
    addChild(value) {
        this.children.push(value);
    }
    toString() {
        if (this.children.length > 1) {
            return this.name + "(\n" +
                "  children: [" +
                "\n   " + this.children.join(",\n") + "],\n" +
                ");";
        }
        else {
            return this.children.join("");
        }
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
        this.whiteHexEnd = "FFFFFF";
        this.black = {
            12: "Colors.black12",
            26: "Colors.black26",
            38: "Colors.black38",
            45: "Colors.black45",
            54: "Colors.black54",
            87: "Colors.black87",
            100: "Colors.black"
        };
        this.blackHexEnd = "000000";
        this.not_parsed = "Colors.black";
    }
    fromTextNode(node) {
        let fill = node.fills[0];
        return this.fromPaint(fill, node.opacity);
    }
    fromPaint(fill, opacity) {
        if (fill.type === "SOLID") {
            let roundOpacity = Math.round(fill.opacity * opacity * 100.0) / 100;
            return this.color(fill.color, roundOpacity);
        }
        else {
            return this.not_parsed;
        }
    }
    color(rgb, o) {
        let opacity = Math.round(o * 100);
        let hexColor = "" + hex(o) + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
        if (hexColor.endsWith(this.whiteHexEnd)) {
            let white = this.white[opacity];
            if (white != null) {
                return white;
            }
        }
        if (hexColor.endsWith(this.blackHexEnd)) {
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
