define(['util', 'defines'], function(util, defines) {
    function propagateInnerTextSize(nodeArray) {
        for (let i = 0; i < nodeArray.length; i++) {
            if (nodeArray[i].children.length > 0) {
                let propagetedHeight = nodeArray[i].height/nodeArray[i].children.length;
                for (let j = 0; j < nodeArray[i].children.length; j++) {
                    nodeArray[nodeArray[i].children[j].id].height = Math.max(propagetedHeight, nodeArray[nodeArray[i].children[j].id].height);
                }
            }
        }
    }

    function drawSingleNode(node) {
        let rectElement = createRectElement(node);
        let textElement = createTextElement(node);

        document.getElementById('map').appendChild(rectElement);
        document.getElementById('map').appendChild(textElement);
    }

    function connectNodes(fromNode, toNode) {
        let lineElement = document.createElementNS(defines.getConstant('svgNS'), 'line');
        lineElement.setAttribute('x1', fromNode.x + fromNode.width);
        lineElement.setAttribute('y1', fromNode.y + fromNode.height / 2);
        lineElement.setAttribute('x2', toNode.x);
        lineElement.setAttribute('y2', toNode.y + toNode.height / 2);
        lineElement.setAttribute('stroke', 'black');

        document.getElementById('map').appendChild(lineElement);
    }

    function createRectElement(node) {
        let rectSettings = {
            width: node.width,
            height: node.height,
            x: node.x,
            y: node.y,
        };

        let rectElement = document.createElementNS(defines.getConstant('svgNS'), 'rect');
        rectElement = util.setAttributes(rectElement, {fill: 'white', stroke: 'black'});
        rectElement.setAttribute('class', 'nodeRect nodeID-' + node.id);
        rectElement = util.setAttributes(rectElement, rectSettings);

        return rectElement;
    }

    function createTextElement(node) {
        let textSettings = defines.getTextElementSettings(node);
        let textElement = document.createElementNS(defines.getConstant('svgNS'), 'text');
        textElement = util.setAttributes(textElement, textSettings);

        for (let i = 0; i < node.textArray.length; i++) {
            textElement.appendChild(createTSpanElement(node, textSettings.x, i));
        }

        return textElement;
    }

    function createTSpanElement(node, parentX, lineNumber) {
        let tspanElement = document.createElementNS(defines.getConstant('svgNS'), 'tspan');
        tspanElement.innerHTML = node.textArray[lineNumber];
        tspanElement.setAttribute('dy', defines.getConstant('lineHeight'));
        tspanElement.setAttribute('x', parentX);
        return tspanElement;
    }

    function changeSingleNodeColor(nodeRectElements, id, color, defaultColor) {
        for (let i = 0; i < nodeRectElements.length; i++) {
            let nodeID = nodeRectElements[i].className.baseVal.replace('nodeRect', '').replace('nodeID-', '').trim();
            if (nodeID === id) {
                nodeRectElements[i].setAttribute('fill', color);
            } else {
                nodeRectElements[i].setAttribute('fill', defaultColor);
            }
        }
    }

    return {
        propagateInnerTextSize: propagateInnerTextSize,
        drawSingleNode: drawSingleNode,
        connectNodes: connectNodes,
        createRectElement: createRectElement,
        createTextElement: createTextElement,
        createTSpanElement: createTSpanElement,
        changeSingleNodeColor: changeSingleNodeColor,
    };
});
