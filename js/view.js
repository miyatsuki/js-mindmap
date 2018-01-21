define(['util', 'defines'], function(util, defines) {
    /**
    * adjusts height of each node according from their parent node
    * @param {array} nodeArray array[node]
    */
    function propagateInnerTextSize(nodeArray) {
        for (let i = 0; i < nodeArray.length; i++) {
            let node = nodeArray[i];
            if (node.children.length > 0) {
                let propagetedHeight = node.height/node.children.length;
                for (let j = 0; j < node.children.length; j++) {
                    let childNodeHeight = nodeArray[node.children[j].id];
                    if (propagetedHeight > childNodeHeight) {
                        childNode.height = propagetedHeight;
                    }
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

    /**
    * create line element to connect nodes
    * @param {node} fromNode node where line starts
    * @param {node} toNode node where line ends
    */
    function connectNodes(fromNode, toNode) {
        let lineElement = util.createSVGElement('line');
        lineElement.setAttribute('x1', fromNode.x + fromNode.width);
        lineElement.setAttribute('y1', fromNode.y + fromNode.height / 2);
        lineElement.setAttribute('x2', toNode.x);
        lineElement.setAttribute('y2', toNode.y + toNode.height / 2);
        lineElement.setAttribute('stroke', 'black');

        document.getElementById('map').appendChild(lineElement);
    }

    /**
    * create SVG rect element from node information
    * @param {node} node node to create rect element
    * @return {svgElement} rect element created from the node
    */
    function createRectElement(node) {
        let rectSettings = {
            width: node.width,
            height: node.height,
            x: node.x,
            y: node.y,
        };

        let rectElement = util.createSVGElement('rect');
        rectElement = util.setAttributes(rectElement, {
            fill: 'white',
            stroke: 'black',
        });
        rectElement.setAttribute('class', 'nodeRect nodeID-' + node.id);
        rectElement = util.setAttributes(rectElement, rectSettings);

        return rectElement;
    }

    /**
    * create SVG text element from node information
    * @param {node} node node to create text element
    * @return {svgElement} text element created from the node
    */
    function createTextElement(node) {
        let textSettings = defines.getTextElementSettings(node);
        let textElement = util.createSVGElement('text');
        textElement = util.setAttributes(textElement, textSettings);

        for (let i = 0; i < node.textArray.length; i++) {
            let x = textSettings.x;
            textElement.appendChild(createTSpanElement(node, x, i));
        }

        return textElement;
    }

    /**
    * create SVG tspan element from node information
    * @param {node} node node to create tspan element
    * @param {integer} parentX x position of the created element
    * @param {integer} lineNumber number of line of the created element
    * @return {svgElement} tspan element created from the node
    */
    function createTSpanElement(node, parentX, lineNumber) {
        let tspanElement = util.createSVGElement('tspan');
        tspanElement.innerHTML = node.textArray[lineNumber];
        tspanElement.setAttribute('dy', defines.getConstant('lineHeight'));
        tspanElement.setAttribute('x', parentX);
        return tspanElement;
    }

    /**
    * changes the color of rect element according to the node-id
    * @param {array} nodeRectElements array[rectElements]
    * @param {integer} id node id to change color
    * @param {string} color sets the elements with node-id by color
    * @param {string} defaultColor sets the elements NOT with node-id by default
    */
    function changeSingleNodeColor(nodeRectElements, id, color, defaultColor) {
        for (let i = 0; i < nodeRectElements.length; i++) {
            let classNames = nodeRectElements[i].className.baseVal;
            let nodeID = classNames.replace(/(nodeRect|nodeID-)/, '').trim();
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
