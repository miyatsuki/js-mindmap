function propagateInnerTextSize(nodeArray)
{
    for(var i = 0; i < nodeArray.length; i++)
    {
        if(nodeArray[i].children.length > 0)
        {
            var propagetedHeight = nodeArray[i].height/nodeArray[i].children.length;
            for(var j = 0 ; j < nodeArray[i].children.length; j++)
            {
                nodeArray[nodeArray[i].children[j].id].height = Math.max(propagetedHeight, nodeArray[nodeArray[i].children[j].id].height);
            }
        }
    }    
}

function drawSingleNode(node)
{
    var rectSettings = {
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y
    };

    var textSettings = {
        width: node.width,
        height: node.height - innerMargin * 2,
        x: node.x + innerMargin,
        y: node.y + innerMargin,
        "font-family": "monospace"
    };

    var rectElement = document.createElementNS(svgNS, "rect");
    rectElement = setAttributes(rectElement, {fill: "white", stroke: "black"});
    rectElement.setAttribute("class", "nodeRect nodeID-" + node.id);
    rectElement = setAttributes(rectElement, rectSettings);

    var textElement = document.createElementNS(svgNS, "text");
    textElement.setAttribute("class", "nodeID-" + node.id);
    textElement = setAttributes(textElement,textSettings);
    
    for(var i = 0; i < node.textArray.length; i++)
    {
        var tspanElement =  document.createElementNS(svgNS, "tspan");
        tspanElement.innerHTML = node.textArray[i];
        tspanElement.setAttribute("dy", lineHeight);
        tspanElement.setAttribute("x", textSettings.x);
        textElement.appendChild(tspanElement);
    }

    document.getElementById("map").appendChild(rectElement);
    document.getElementById("map").appendChild(textElement);
    
}

function changeSingleNodeColor(nodeRectElements, id, color, defaultColor)
{
    for(var i = 0; i < nodeRectElements.length; i++)
    {
        var nodeID = nodeRectElements[i].className.baseVal.replace("nodeRect", "").replace("nodeID-", "").trim();
        if(nodeID == id)
        {
            nodeRectElements[i].setAttribute("fill", color)
        }
        else
        {
            nodeRectElements[i].setAttribute("fill", defaultColor)
        }
    }
}