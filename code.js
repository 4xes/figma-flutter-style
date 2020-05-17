// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".
figma.showUI(__html__);
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-style') {
        var selection = figma.currentPage.selection;
        var code = "";
        for (var node of selection) {
            if (node.type == "TEXT") {
                createStyle(node);
            }
        }
        //figma.closePlugin(entries.toString());
    }
    else {
        figma.closePlugin();
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
};
function createStyle(node) {
    var code = "";
    var text = node.characters;
    let fontSize = node.fontSize;
    //TODO support fontFamily
    //var fontFamily = node.fontName["family"];
    var style = node.fontName["style"];
    var color = new FlutterColor().fromTextNode(node);
    var textAlign = null;
    switch (node.textAlignHorizontal) {
        case "LEFT": //default
            // textAlign = "TextAlign.start"
            break;
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
    var fontWeight = null;
    switch (style) {
        case "Regular": //default
        //fontWeight = "FontWeight.normal"
        case "Semibold":
            fontWeight = "FontWeight.w600";
        case "Bold":
            fontWeight = "FontWeight.bold";
            break;
    }
    var textStyle = new FlutterObject("TextStyle");
    textStyle.addArgument("color", color);
    textStyle.addArgument("fontSize", fontSize.toFixed(1));
    textStyle.addArgument("fontWeight", fontWeight);
    textStyle.addArgument("textAlign", textAlign);
    var textWidget = new FlutterObject("Text");
    textWidget.addValue("\"" + text + "\"");
    textWidget.addArgument("style", textStyle.toString());
    code += textWidget.toString();
    figma.ui.postMessage(code);
}
class FlutterObject {
    constructor(name) {
        this.params = [];
        this.name = name;
    }
    addValue(value) {
        this.params.push(value);
    }
    addArgument(name, value) {
        if (value != null) {
            this.params.push(name + ": " + value);
        }
    }
    addArgumentOpt(name, value) {
        this.params.push(name + ": " + value);
    }
    toString() {
        return name + "(" + this.params.join(", ") + ")";
    }
}
class FlutterColor {
    constructor() {
        this.transparent = "Colors.transparent";
        this.white = {
            "10": "Colors.white10",
            "12": "Colors.white12",
            "24": "Colors.white24",
            "30": "Colors.white30",
            "38": "Colors.white38",
            "54": "Colors.white54",
            "60": "Colors.white60",
            "70": "Colors.white70",
            "100": "Colors.white"
        };
        this.black = {
            "12": "Colors.black12",
            "26": "Colors.black26",
            "38": "Colors.black38",
            "45": "Colors.black45",
            "54": "Colors.black54",
            "87": "Colors.black87",
            "100": "Colors.black"
        };
        this.not_parsed = "Colors.black";
    }
    fromTextNode(node) {
        return this.fromPaint(node.fills[0]);
    }
    fromPaint(fill) {
        if (fill.type == "SOLID") {
            return this.color(fill.color, fill.opacity);
        }
        else {
            return this.not_parsed;
        }
    }
    color(rgb, o) {
        var opacity = Math.round(o * 100).toString();
        var hexColor = "" + hex(o) + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
        if (hexColor.endsWith("FFFFFF")) {
            var white = this.white[opacity];
            if (white != null) {
                return white;
            }
        }
        if (hexColor.endsWith("000000")) {
            var black = this.black[opacity];
            if (black != null) {
                return black;
            }
        }
        if (opacity == "0") {
            return this.transparent;
        }
        return "Color(0x" + hexColor + ")";
    }
}
;
function hex(double) {
    return (Math.round(double * 255)).toString(16).toUpperCase().padStart(2, "0");
}
