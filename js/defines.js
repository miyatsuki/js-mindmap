define(function() {
    let constant = {
        svgNS: 'http://www.w3.org/2000/svg',
        nodeWidth: 105,
        xMargin: 50,
        yMargin: 20,
        lineHeight: 15,
        innerMargin: 3,
        characterPerLine: 16
    };
    constant["xPerLevel"] = constant.nodeWidth + constant.xMargin;

    function getConstant(id) {
        return constant[id];
    }

    function getTextElementSettings(node) {
        return {
            'class': 'nodeID-' + node.id,
            'width': node.width,
            'height': node.height - constant.innerMargin * 2,
            'x': node.x + constant.innerMargin,
            'y': node.y + constant.innerMargin,
            'font-family': 'monospace',
        };
    }

    return {
        'getConstant': getConstant,
        'getTextElementSettings': getTextElementSettings,
    };
});

