figma.showUI(__html__);

let exportFontFamily = false;

figma.ui.onmessage = msg => {
    if (msg.type === 'create-style') {
        exportFontFamily = msg.exportFontFamily;
        parseSelection();
    } else if (msg.type === "alert") {
        figma.notify(msg.message)
    }
};

figma.on("selectionchange", () => {
    parseSelection()
});

function parseSelection() {
    let selection = figma.currentPage.selection;

    console.log("Parse selection.");
    let parent = new FlutterParent();
    for (let node of selection) {
        parseNode(node, parent)
    }
    figma.ui.postMessage(parent.toString())
}

function parseNode(node: SceneNode, parent: FlutterParent) {
    console.log("node: " + node.type);
    if (node.type === "TEXT") {
        parent.addChild(text(node));
    } else if (node.type === "LINE") {
        parent.addChild(line(node))
    } else if (node.type === "RECTANGLE") {

    } else if (node.type === "GROUP" || node.type === "INSTANCE") {
        let groupParent = new FlutterParent();
        for (let child of node.children) {
           parseNode(child, groupParent)
        }
        parent.addChild(groupParent);
    }
}

function line(node: LineNode): FlutterObject {
    let height = node.strokeWeight.toFixed(1);
    let width = node.width.toFixed(1);
    let color = new FlutterColor().fromLineNode(node);

    if (Math.round(node.rotation) == 0) {
        let dividerWidget = new FlutterObject("Divider");
        if (height != "16.0") {
            dividerWidget.addArgument("height", height);
        }
        dividerWidget.addArgument("color", color);
        return dividerWidget
    } else {
        let containerWidget = new FlutterObject("Container");
        containerWidget.addArgument("height", width);
        containerWidget.addArgument("width", height);
        containerWidget.addArgument("color", color);
        return containerWidget
    }
}

function decorator(node: RectangleNode) {

    /*
    BoxDecoration(
        border: Border.fromBorderSide(
            BorderSide(width: 1.0, color: Color(0xFFDDDDDD))
        ),
        borderRadius: BorderRadius.circular(12.0)
    )
     */
}

function text(node: TextNode): FlutterObject {
    let text = toFlutterString(node.characters);
    let fontSize = node.fontSize as number;
    let style = (node.fontName as FontName)["style"];
    let fontFamily = null;
    if (exportFontFamily) {
        fontFamily = toFlutterString((node.fontName as FontName)["family"]);
    }
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
            text = toFlutterString(node.characters.charAt(0).toUpperCase() + node.characters.substring(1));
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
            break
    }

    let textStyle = new FlutterObject("TextStyle");
    textStyle.addArgument("color", color);
    textStyle.addArgument("fontSize", fontSize.toFixed(1));
    textStyle.addArgument("fontFamily", fontFamily);
    textStyle.addArgument("fontWeight", fontWeight);
    textStyle.addArgument("decoration", decoration);

    let textWidget = new FlutterObject("Text");
    textWidget.addValue(text);
    textWidget.addArgument("style", textStyle);
    textWidget.addArgument("textAlign", textAlign);
    return textWidget;
}

class FlutterObject {
    params: any[] = [];
    name: String;

    constructor(name: String) {
        this.name = name
    }

    addValue(value: any) {
        if (value != null) {
            this.params.push(value.toString())
        } else {
            this.params.push("null")
        }
    }

    addArgument(name: string, value: any) {
        if (value != null) {
            this.params.push(name + ": " + value.toString())
        }
    }

    // noinspection JSUnusedGlobalSymbols
    addArgumentOpt(name: string, value: string) {
        if (value == null) {
            this.params.push(name + ": null")
        } else {
            this.params.push(name + ": " + value.toString())
        }
    }

    toString() {
        return this.name + "(" + this.params.join(", ") + ")";
    }
}

class FlutterParent {
    name: string = "Group";
    children: any[] = [];

    addChild(value: any) {
        if (value != null && value.toString().length > 0) {
             this.children.push(value)
        }
    }

    toString() {
        if (this.children.length > 1) {
            return this.name + "(\n" +
                "  children: [" +
                "\n   " + this.children.join(",\n") + "],\n" +
                ");"
        } else {
            return this.children.join("");
        }
    }
}

class FlutterColor {

    fromTextNode(node: TextNode): string {
        let fill = (node.fills as ReadonlyArray<Paint>)[0];
        return this.fromPaint(fill, node.opacity)
    }

    fromLineNode(node: LineNode): string {
        let fill = (node.strokes as ReadonlyArray<Paint>)[0];
        return this.fromPaint(fill, node.opacity)
    }

    fromPaint(fill: Paint, opacity: number): string {
        if (fill.type === "SOLID") {
            let roundOpacity = Math.round(fill.opacity * opacity * 100.0) / 100;
            return this.color(fill.color, roundOpacity)
        } else {
            return this.not_parsed;
        }
    }

    color(rgb: RGB, o: number): string {
        let opacity = Math.round(o * 100);
        let hexColor = "" + hex(o) + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
        if (hexColor.endsWith(this.whiteHexEnd)) {
            let white = this.white[opacity];
            if (white != null) {
                return white
            }
        }
        if (hexColor.endsWith(this.blackHexEnd)) {
            let black: string = this.black[opacity];
            if (black != null) {
                return black
            }
        }
        if (opacity === 0) {
            return this.transparent
        }
        return "Color(0x" + hexColor + ")";
    }

    transparent = "Colors.transparent";

    white: { [index: number]: string } = {
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

    whiteHexEnd = "FFFFFF";

    black: { [index: number]: string } = {
        12: "Colors.black12",
        26: "Colors.black26",
        38: "Colors.black38",
        45: "Colors.black45",
        54: "Colors.black54",
        87: "Colors.black87",
        100: "Colors.black"
    };

    blackHexEnd = "000000";

    not_parsed = "Colors.black"
}

function hex(double: number): String {
    return (Math.round(double * 255)).toString(16).toUpperCase().padStart(2, "0");
}

function toFlutterString(text: string) {
    return "\'" + text + "\'"
}