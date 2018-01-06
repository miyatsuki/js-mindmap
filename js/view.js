function adjustInnerTextSize()
{
    var innerTextElements = document.getElementsByClassName("innerText");

    //各ノードの実際の高さにnodeArrayのheightをあわせる
    setActualInnerTextSize(innerTextElements, nodeArray)

    //節ノードの方がheightが高い場合は葉ノードにheightを伝搬させる
    propagateInnerTextSize(nodeArray)
}

function setActualInnerTextSize(innerTextElements, nodeArray)
{
    for(var i = 0; i < innerTextElements.length; i++)
    {
        var height = innerTextElements[i].getBoundingClientRect().height;
        var nodeID = innerTextElements[i].className.replace("innerText", "").replace("nodeID-", "").trim()
        nodeArray[nodeID].height = height;
    }
}

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
    var rectElement = document.createElementNS(svgNS, "rect");
    rectElement = setAttributes(rectElement, {fill: "white", stroke: "black"})

    rectElement.setAttribute("class", "nodeRect nodeID-" + node.id)

    var foreignElement = document.createElementNS(svgNS, "foreignObject");
    foreignElement.setAttribute("class", "nodeID-" + node.id)

    var innerElement = document.createElementNS(htmlNS, "div");
    innerElement.innerHTML = node.text;
    innerElement.classList.add("innerText", "nodeID-" + node.id);

    document.getElementById("map").appendChild(rectElement);
    document.getElementById("map").appendChild(foreignElement);
    foreignElement.appendChild(innerElement);

    changeNodePosition(node);
}

function changeSingleNodeColor(nodeRectElements, id, color, defaultColor)
{
    for(var i = 0; i < nodeRectElements.length; i++)
    {
        var nodeID = nodeRectElements[i].className.baseVal.replace("nodeRect", "").replace("nodeID-", "").trim()
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