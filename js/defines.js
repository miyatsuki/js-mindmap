var svgNS = "http://www.w3.org/2000/svg";

var nodeWidth = 105;
var xMargin = 50;
var yMargin = 20;

var lineHeight = 15;
var innerMargin = 3;
var characterPerLine = 16;

function getTextElementSettings(node) {
    return {
        class: "nodeID-" + node.id,
        width: node.width,
        height: node.height - innerMargin * 2,
        x: node.x + innerMargin,
        y: node.y + innerMargin,
        "font-family": "monospace"
    };
}