function adjustInnerTextSize(nodeArray)
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