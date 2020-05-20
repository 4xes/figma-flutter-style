figma.showUI(__html__, {height: 300 });

let exportFontFamily = false;
let exportSizes = true;

figma.ui.onmessage = msg => {
    if (msg.type === 'create-style') {
        console.log(msg);
        exportFontFamily = msg.exportFontFamily;
        exportSizes = msg.exportSizes;
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
    try {
        let parent = new FlutterParent("Group");
        for (let node of selection) {
            group(node, parent)
        }
        figma.ui.postMessage(parent.toString())
    } catch (e) {
        e.print()
    }
}

function group(node: SceneNode, parent: FlutterParent) {
    console.log("node: " + node.type);
    if (node.visible) {
        if (node.type === "TEXT") {
            parent.addChild(text(node));
        } else if (node.type === "LINE") {
            parent.addChild(line(node))
        } else if (node.type === "VECTOR") {
            parent.addChild(vector(node))
        } else if (node.type === "RECTANGLE") {
            let child = rectangle(node)
            if (child != null) {
                if (exportSizes) {
                    child.addSizes(node)
                }
                parent.addChild(child)
            }
        } else if (node.type == "FRAME" || node.type === "GROUP" || node.type === "INSTANCE" || node.type == "COMPONENT") {
            let groupParent = new FlutterParent("Group");
            for (let child of node.children) {
                group(child, groupParent)
            }
            if (hasBorderOrBackground(node)) {
                let container = containerWithDecoration(node, true)
                container.addChild(groupParent)
                parent.addChild(container)
            } else {
                parent.addChild(groupParent);
            }
            if (exportSizes && groupParent.isGroup()) {
                groupParent.addSizes(node)
            }
        }
    }
}

function vector(node: VectorNode): FlutterObject {
    let icon = new FlutterObject("Icon", "AppIcons." + node.name);
    if (node.fills != figma.mixed && node.fills.length > 0) {
        let fill = node.fills[0]
        if (fill.type == "SOLID") {
            let color = FlutterColor.fromPaint(fill, node.opacity)
            icon.addArgument("color", color)
        }
    }
    if (exportSizes) {
        let height = node.height.toFixed(1);
        if (height !== "24.0") {
            icon.addArgument("size", height)
        }
    }
    return icon
}

function rectangle(node: RectangleNode): FlutterObject {
    if (node.fills != figma.mixed && node.fills.length > 0) {
        let fill = node.fills[0]
        if (fill.type == "SOLID" || fill.type.startsWith("GRADIENT_")) {
            return containerWithDecoration(node)
        }
        if (node.fills[0].type == "IMAGE") {
            return new FlutterObject("Image.asset",  toFlutterString("assets/images/" + node.name + ".png"))
        }
    } else {
        return null
    }
}

function hasBorderOrBackground(node: any): boolean {
    if (node.type === "INSTANCE" || node.type == "COMPONENT") {
        console.log(node.type)
        let hasFills = false
        if (node.fills !== figma.mixed) {
            hasFills = node.fills.length > 0
        }
        let hasBorder = node.strokes.length > 0 && node.strokeWeight > 0;
        return hasFills && hasBorder
    } else {
        return false
    }
}

function line(node: LineNode): FlutterObject {
    let height = node.strokeWeight.toFixed(1);
    let width = node.width.toFixed(1);
    let color = FlutterColor.fromLineNode(node);

    if (Math.round(node.rotation) === 0) {
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

function containerWithDecoration(node: any, withClipRect = false) {
    let boxDecoration = new FlutterObject("BoxDecoration");
    let hasBorder = node.strokes.length > 0 && node.strokeWeight > 0;
    if (hasBorder) {
        let firstPaint = node.strokes[0];
        let borderColor = FlutterColor.fromPaint(firstPaint, node.opacity);
        let borderSide = new FlutterObject("BorderSide");
        borderSide.addArgument("width", node.strokeWeight.toFixed(1));
        borderSide.addArgument("color", borderColor);
        let border = new FlutterObject("Border.fromBorderSide", borderSide);
        boxDecoration.addArgument("border", border)
    }
    let borderRadius;
    if (node.cornerRadius !== figma.mixed) {
        if (node.cornerRadius !== 0) {
            borderRadius = new FlutterObject("BorderRadius.circular", node.cornerRadius.toFixed(1));
            boxDecoration.addArgument("borderRadius", borderRadius);
        }
    } else {
        borderRadius = new FlutterObject("BorderRadius.only");
        if (node.topLeftRadius !== 0) {
            let radius = new FlutterObject("Radius.circular", node.topLeftRadius.toFixed(1));
            borderRadius.addArgument("topLeft", radius)
        }
        if (node.topRightRadius !== 0) {
            let radius = new FlutterObject("Radius.circular", node.topRightRadius.toFixed(1));
            borderRadius.addArgument("topRight", radius)
        }
        if (node.bottomLeftRadius !== 0) {
            let radius = new FlutterObject("Radius.circular", node.bottomLeftRadius.toFixed(1));
            borderRadius.addArgument("bottomLeft", radius)
        }
        if (node.bottomRightRadius !== 0) {
            let radius = new FlutterObject("Radius.circular", node.bottomRightRadius.toFixed(1));
            borderRadius.addArgument("bottomRight", radius)
        }
        boxDecoration.addArgument("borderRadius", borderRadius);
    }
    if (node.fills !== figma.mixed) {
        if (node.fills.length > 0) {
            let fill = node.fills[0]
            if (fill.type == "SOLID") {
                let color = FlutterColor.fromPaint(node.fills[0], node.opacity);
                boxDecoration.addArgument("color", color)
            } else if(fill.type == "IMAGE") {
                boxDecoration.addArgument("image", imageDecoration(node, fill))
            } else if (fill.type.startsWith("GRADIENT_")) {

            }
        }
    }
    let container = new FlutterParent("Container")
    container.addArgument("decoration", boxDecoration)
    return container;
}

function imageDecoration(node: SceneNode, paint: ImagePaint): FlutterObject {
    let imageDecoration = new FlutterObject("DecorationImage")
    imageDecoration.addArgument("image", new FlutterObject("AssetImage", toFlutterString(node.name)))
    imageDecoration.addArgument("fit", "BoxFit.cover")
    return imageDecoration
}

function text(node: TextNode): FlutterObject {
    try {
        let text = toFlutterString(node.characters);
        let fontSize = node.fontSize as number;
        let style = (node.fontName as FontName)["style"];
        let fontFamily = null;
        if (exportFontFamily) {
            fontFamily = toFlutterString((node.fontName as FontName)["family"]);
        }
        let color = FlutterColor.fromTextNode(node);
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
        let fontStyle = null;
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
            case "Regular Italic":
                fontStyle = "FontStyle.italic"
                break;
        }
        //overflow: TextOverflow.ellipsis, maxLines: 1
        let textStyle = new FlutterObject("TextStyle");
        textStyle.addArgument("color", color);
        textStyle.addArgument("fontSize", fontSize.toFixed(1));
        textStyle.addArgument("fontFamily", fontFamily);
        textStyle.addArgument("fontWeight", fontWeight);
        textStyle.addArgument("fontStyle", fontStyle)
        textStyle.addArgument("decoration", decoration);
        if (node.characters.endsWith("...") || node.characters.endsWith("…")) {
            textStyle.addArgument("overflow", "TextOverflow.ellipsis")
            textStyle.addArgument("maxLines", 1)
        }

        let textWidget = new FlutterObject("Text");
        textWidget.addValue(text);
        textWidget.addArgument("style", textStyle);
        textWidget.addArgument("textAlign", textAlign);
        return textWidget;
    } catch (e) {
        console.log(e);
        return null;
    }
}

class FlutterObject {
    params: any[] = [];
    name: String;

    constructor(name: string, ...args: any[]) {
        this.name = name;
        for (let i = 0; i < args.length; i++) {
            this.params.push(args[i])
        }
    }

    addSizes(node: SceneNode) {
        this.addArgument("width", node.width.toFixed(1));
        this.addArgument("height", node.height.toFixed(1));
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

class FlutterParent extends FlutterObject {
    children: any[] = [];

    constructor(name: string) {
        super(name);
    }

    addChild(value: any) {
        if (value != null && value.toString().length > 0) {
            this.children.push(value)
        }
    }

    isGroup() {
        return this.children.length > 1 || this.params.length > 0
    }

    toString() {
        if (this.isGroup()) {
            let concat = this.params;
            if (this.children.length == 1) {
                concat = concat.concat("child: " + "\n" + this.children[0])
            } else if (this.children.length > 1) {
                concat = concat.concat("children: [\n" + this.children.join(",\n") + "]")
            }
            return this.name + "(" + concat.join(", ") + ")";
        } else {
            return this.children.join("");
        }
    }
}

class FlutterColor {
    static fromTextNode(node: TextNode): string {
        if (node.fills === figma.mixed) {
            //todo try to parse
            return this.mixed
        } else {
            let array = node.fills as ReadonlyArray<Paint>;
            if (array.length > 0) {
                return this.fromPaint(array[0], node.opacity)
            } else {
                return null
            }
        }
    }

    static fromLineNode(node: LineNode): string {
        let fill = (node.strokes as ReadonlyArray<Paint>)[0];
        return this.fromPaint(fill, node.opacity)
    }

    static fromPaint(fill: Paint, opacity: number): string {
        if (fill.type === "SOLID") {
            let roundOpacity = Math.round(fill.opacity * opacity * 100.0) / 100;
            return this.color(fill.color, roundOpacity)
        } else {
            return null;
        }
    }

    static color(rgb: RGB, o: number): string {
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

    static transparent = "Colors.transparent";

    static white: { [index: number]: string } = {
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

    static whiteHexEnd = "FFFFFF";

    static black: { [index: number]: string } = {
        12: "Colors.black12",
        26: "Colors.black26",
        38: "Colors.black38",
        45: "Colors.black45",
        54: "Colors.black54",
        87: "Colors.black87",
        100: "Colors.black"
    };

    static blackHexEnd = "000000";

    static mixed = "figma.mixed";
}

function hex(double: number): String {
    return (Math.round(double * 255)).toString(16).toUpperCase().padStart(2, "0");
}

function toFlutterString(text: string) {
    return ("\'" + text + "\'").replace(/(\r\n|\n|\r)/gm,"\\n")
}