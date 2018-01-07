var inputText = "";
var isCompostioning = false;

var nodeArray = [];
var textAreaElement = $("#text");

init();

function init()
{
    setTextAreaCallBack();

    $("#savePNG").click(saveAsPNG);

	var inputText = localStorage.getItem("text");
    textAreaElement.val(inputText);
    createMap(-1);
}

function setTextAreaCallBack() {
    textAreaElement.keyup(function (e) {
        executeMapCreation(e);
    });

    textAreaElement.click(function (e) {
        emphasizeNode(e)
    });

    //IME入力中に箱書いたり、テキストボックスを操作されると辛いのでブロック
    textAreaElement.on({
        "compositionstart": function (e) {
            isCompostioning = true;
        },
        "compositionend": function (e) {
            isCompostioning = false;
            executeMapCreation(e);
        }
    });
}

function emphasizeNode(eve)
{
    //テキストエリアの行数とnodeIDは一致するので、キャレットの行数を取得してそのIDを強調表示する
    var emphasizeID = getCaretLineNumber($("#text"), eve);
    changeSingleNodeColor(document.getElementsByClassName("nodeRect"), emphasizeID, "#E1F7E7", "white")
}

function executeMapCreation(eve)
{
    if (inputText != textAreaElement.val() && !isCompostioning) {
        $.when(
            createMap(eve.keyCode)
        ).done(function (result) {
            //変化量(result.normalizedLog)が0のときに下手にキャレットを操作すると副作用が出るので回避
            if (result.normalizeLog.length > 0) {
                moveCaret(result, eve)
            }
            emphasizeNode(eve)
        })
    }
}

function moveCaret(val, eve)
{
    var index = eve.target.selectionStart + caretMove;
    index = setBetween(index, 0, $("#text").val().length);

    dynamicSetinTextArea($("#text"), val.text, index, eve);

    window.setTimeout(function() {
        eve.target.setSelectionRange(index, index);
    }, 0);
}

function createMap(keyCode) {
    inputText = textAreaElement.val();
    var normalizedText = normalizeText(inputText, keyCode);
	localStorage.setItem("text", inputText);
	    
    parseText(normalizedText.text);
    drawNodes();

    var svgSize = changeSVGSize();
    fillBackGroundWhite(svgSize);

    return normalizedText;
}

function drawNodes()
{
    setInitialNodeSettings();
    decideNodePosition();

    initMap();
    for(var i = 0; i < nodeArray.length; i++)
    {
        drawSingleNode(nodeArray[i]);
        var children = nodeArray[i].children;
        for(var j = 0; j < children.length; j++)
        {
            connectNodes(nodeArray[i], children[j]);                
        }
    }
}

function setInitialNodeSettings()
{
    for(var i = 0; i < nodeArray.length; i++)
    {
        nodeArray[i]["width"] = nodeWidth;
        nodeArray[i]["height"] = innerMargin*3 + lineHeight * nodeArray[i].textArray.length
    }
    propagateInnerTextSize(nodeArray)
}

function changeSVGSize()
{
    var size = calculateCurrentSVGSize();

    document.getElementById("map").setAttribute("width", size.width.toString());
    document.getElementById("map").setAttribute("height", size.height.toString());

    return size;
}

function calculateCurrentSVGSize() {
    var rectElements = document.getElementsByClassName("nodeRect");
    var mapElement = document.getElementById("map");

    return {
        width: calculateCurrentSVGWidth(rectElements, mapElement),
        height: calculateCurrentSVGHeight(rectElements, mapElement)
    }
}

function calculateCurrentSVGHeight(rectElements, mapElement) {
    var yMax = rectElements[rectElements.length - 1].getBoundingClientRect().bottom;
    var newHeight = yMax - mapElement.getBoundingClientRect().top;
    return newHeight;
}

function calculateCurrentSVGWidth(rectElements, mapElement) {
    var xMax = 0;
    for (var i = 0; i < rectElements.length; i++) {
        xMax = Math.max(xMax, rectElements[i].getBoundingClientRect().right);
    }

    var newWidth = xMax - document.getElementById("map").getBoundingClientRect().left;
    return newWidth
}

function fillBackGroundWhite(size) {
    //SVGの幅に合わせて背景を白埋め
    var rectElement = document.createElementNS(svgNS, "rect");
    rectElement = setAttributes(rectElement, {
        width: size.width,
        height: size.height,
        x: 0,
        y: 0,
        fill: "White",
        stroke: "White"
    });

    document.getElementById("map").insertBefore(rectElement, document.getElementById("map").firstChild);
}

function initMap()
{
    $("#map").empty();    
}

function decideNodePosition()
{
    var yCounter = 0;

    for(var i = 0; i < nodeArray.length; i++)
    {
        var level = nodeArray[i].level;
        nodeArray[i]["x"] = level * (nodeWidth + xMargin);

        if(nodeArray[i].children.length == 0)
        {
            nodeArray[i]["y"] = yCounter;
            yCounter += nodeArray[i].height + yMargin;
        }
    }

    for(var i = nodeArray.length - 1; i >= 0; i--)
    {
        if(nodeArray[i].children.length > 0)
        {
            var y = 0;
            var middleNodeID = Math.floor(nodeArray[i].children.length/2);

            if(nodeArray[i].children.length % 2 == 1)
            {
                y = nodeArray[i].children[middleNodeID].y + nodeArray[i].children[middleNodeID].height/2 - nodeArray[i].height/2;
            }
            else
            {
                var y1 = nodeArray[i].children[middleNodeID].y + nodeArray[i].children[middleNodeID].height/2 - nodeArray[i].height/2;
                var y2 = nodeArray[i].children[middleNodeID - 1].y + nodeArray[i].children[middleNodeID - 1].height/2 - nodeArray[i].height/2;
                y = (y1 + y2)/2;
            }

            nodeArray[i]["y"] = y;
        }
    }
}

function connectNodes(fromNode, toNode)
{
    var lineElement = document.createElementNS(svgNS, "line");
    lineElement.setAttribute("x1", fromNode.x + fromNode.width);
    lineElement.setAttribute("y1", fromNode.y + fromNode.height/2);
    lineElement.setAttribute("x2", toNode.x);
    lineElement.setAttribute("y2", toNode.y + toNode.height/2);
    lineElement.setAttribute("stroke", "black");

    document.getElementById("map").appendChild(lineElement);
}

function normalizeText(text, keyCode) {
    textArray = text.split("\n");
    changed = false;
    caretMove = 0;
    normalizeLog = [];

    for(var i = 0; i < textArray.length; i++)
    {
        var text = textArray[i];

        //文頭のスペース入力効率化のため、全角スペースを半角1個に変換
        //全角1スペースがいきなり2スペースになると焦るので置換だけにする
        if(/　/.test(text))
        {
            text = text.replace(/　/g, " ");
            changed = true;
            caretMove += 0; 
            normalizeLog.push("全角1スペ -> 半角1スペ")
        }

        //文頭の＊入力効率化のため、文頭の＊を*に変換
        if(/^\s*＊/.test(text))
        {
            text = text.replace("＊", "*");
            changed = true;
            caretMove += 0; 
            normalizeLog.push("/^\s*＊/")
        }

        //文頭の＊の入力効率化のため、*直後にスペースが無かったら自動挿入
        if(/^\s*\*/.test(text) && !/^\s*\*\s/.test(text))
        {
            //backspaceキー(8)とdelete(46)が押されている間に自動挿入が発動すると辛いので除外
            if (!(keyCode === 8 || keyCode === 46))
            {
                text = text.replace("*", "* ");
                changed = true;
                caretMove += 1;
                normalizeLog.push("/^\s*\*\s")
            }
        }

        //逆に*直後のスペースが多すぎるとmd的にだめなので1つにする
        while(/\*\s{2,}/.test(text))
        {
            text = text.replace(/\*\s\s/, "* ");
            changed = true;
            caretMove -= 1;
            normalizeLog.push("/\*\s{2,}/")
        }

        textArray[i] = text;
        
    }

    return {caretMove: caretMove, text: textArray.join("\n"), normalizeLog: normalizeLog};
}

function parseText(text)
{
    lines = text.split("\n");
    mapObject = {};
    nodeArray = [];

    levelArray = [];
    levelArray[0] = null;

    for(var i = 0; i < lines.length; i++)
    {
        var level = -1;
        var text = lines[i];

        for(var j = 0; j < text.length; j++)
        {
            if(text.startsWith("  "))
            {
                text = text.substring(2);
                level++;
            }
            else if(text.startsWith("*"))
            {
                text = text.substring(1);
                level++;
                break;
            }
            else if(text.startsWith(" *"))
            {
                text = text.substring(2);
                level++;
                break;
            }
            else
            {
                break;
            }
        }

        textArray = breakWord(text.trim(), characterPerLine);

        var node = {id: i.toString(), textArray: textArray, level: level, parent: levelArray[level]};
        nodeArray.push(node);
        levelArray[level + 1] = node;
    }
    
    childrenMap = {};

    for(var i = nodeArray.length - 1; i >= 0; i--)
    {
        if(nodeArray[i].id in childrenMap)
        {
            nodeArray[i]["children"] = childrenMap[nodeArray[i].id];
        }
        else
        {
            nodeArray[i]["children"] = [];                
        }

        if(nodeArray[i].parent != null)
        {
            if(!(nodeArray[i].parent.id in childrenMap))
            {
                childrenMap[nodeArray[i].parent.id] = []
            }

            childrenMap[nodeArray[i].parent.id].push(nodeArray[i]);
        }
    }
}

function saveAsPNG()
{
    html2canvas(document.body).then(function(canvas){
        var a = document.getElementById("download-link");
        if(a == null)
        {
            a = document.createElement("a");
            a.id = "download-link";
            document.getElementById("inputArea").appendChild(a)
        }

        a.href = canvas.toDataURL("image/png");
        a.setAttribute("download", "image.png");
        a.text = "ダウンロード(" + new Date().toString() + ")";
    })
}