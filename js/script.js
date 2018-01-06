var inputText = "";
var isCompostioning = false;
var context = {pressedKeyCode: null};

var nodeArray = [];
var eve = undefined;
var isBeforeAdjusted = true;

init();

function init()
{
    $("#text").keyup(function(e){
        eve = e;
        context.pressedKeyCode = e.keyCode
        executeMapCreation();
    })

    $("#text").click(function(e){
        eve = e;
        emphasizeNode()
    })
    
    //IME入力中に箱書いたり、テキストボックスを操作されると辛いのでブロック
    $("#text").on("compositionstart", function(){
        isCompostioning = true;
    })
    
    $("#text").on("compositionend", function(){
        isCompostioning = false;
        eve = e;
        executeMapCreation();
    })
    
    $("#savePNG").click(function(){
        saveAsPNG();
	})
	
	var inputText = localStorage.getItem("text");
	$("#text").val(inputText);
    createMap(undefined);
    onTextAreaChanged();
    
    var observer = new MutationObserver(onTextAreaChanged)
    observer.observe(document.getElementById("map"), {childList: true})
}

function onTextAreaChanged()
{
    if(isBeforeAdjusted)
    {
        adjustInnerTextSize();
        drawNodes();
    
        //初回描画だとeveがundefinedになる
        if(eve != undefined)
        {
            emphasizeNode()
        }
    
        changeSVGSize();    
    }

    isBeforeAdjusted = false;
}

function emphasizeNode()
{
    //テキストエリアの行数とnodeIDは一致するので、キャレットの行数を取得してそのIDを強調表示する
    var emphasizeID = getCaretLineNumber($("#text"), eve);
    changeSingleNodeColor(document.getElementsByClassName("nodeRect"), emphasizeID, "#E1F7E7", "white")
}

function executeMapCreation()
{
    isBeforeAdjusted = true;

    $.when(
        createMap()
    ).done(function(result) {
        //変化量(result.normalizedLog)が0のときに下手にキャレットを操作すると副作用が出るので回避
        if(result.normalizeLog.length > 0)
        {
            moveCaret(result)
        }
        emphasizeNode()
    })
}

function moveCaret(val)
{
    var index = eve.target.selectionStart + caretMove;
    index = setBetween(index, 0, $("#text").val().length);

    dynamicSetinTextArea($("#text"), val.text, index);

    window.setTimeout(function() {
        eve.target.setSelectionRange(index, index);
    }, 0);
}

function createMap(){
    if(inputText == $("#text").val() || isCompostioning)
    {
        return {caretMove: 0, text: inputText, normalizeLog: []};
    }

    inputText = $("#text").val()
	var normalizedText = normalizeText(inputText);
	localStorage.setItem("text", inputText);
	    
    parseText(normalizedText.text);
    setInitialNodeSettings();
    drawNodes();

    return normalizedText;
}

function drawNodes()
{
    decideNodePosition();

    initMap();
    for(var i = 0; i < nodeArray.length; i++)
    {
        drawSingleNode(nodeArray[i])
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
        nodeArray[i]["height"] = nodeHeight;
    }
}

function changeSVGSize()
{
    //今のmindmapを書くのに必要なSVGの範囲を調べる
    var xMax = 0;
    var yMax = 0;

    var textElements = document.getElementsByClassName("innerText");
    for(var i = 0; i < textElements.length; i++)
    {
        xMax = Math.max(xMax, textElements[i].getBoundingClientRect().right);
        yMax = Math.max(yMax, textElements[i].getBoundingClientRect().bottom);
    }

    var newWidth = xMax - document.getElementById("map").getBoundingClientRect().left 
    var newHeight = yMax - document.getElementById("map").getBoundingClientRect().top

    document.getElementById("map").setAttribute("width", newWidth)
    document.getElementById("map").setAttribute("height", newHeight)

    //SVGの幅に合わせて背景を白埋め
    var rectElement = document.createElementNS(svgNS, "rect");
    rectElement = setAttributes(rectElement, {width: newWidth, height: newHeight, x: 0, y: 0, fill: "White", stroke: "White"})

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
        nodeArray[i]["x"] = level*(nodeWidth + xMargin)

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

function changeNodePosition(node)
{
    var commonSettings = {
            width: node.width,
            height: node.height,
            x: node.x,
            y: node.y
    }

    var nodeElements = document.getElementsByClassName("nodeID-" + node.id)

    for(var i = 0; i < nodeElements.length; i++)
    {
        if(nodeElements[i].tagName.toUpperCase() != "DIV")
        {
            nodeElements[i] = setAttributes(nodeElements[i], commonSettings);
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

function normalizeText(text)
{
    textArray = text.split("\n")
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
            text = text.replace("＊", "*")
            changed = true;
            caretMove += 0; 
            normalizeLog.push("/^\s*＊/")
        }

        //文頭の＊の入力効率化のため、*直後にスペースが無かったら自動挿入
        if(/^\s*\*/.test(text) && !/^\s*\*\s/.test(text))
        {
            //backspaceキー(8)とdelete(46)が押されている間に自動挿入が発動すると辛いので除外
            if(!(context.pressedKeyCode == 8 || context.pressedKeyCode == 46))
            {
                text = text.replace("*", "* ")
                changed = true;
                caretMove += 1;
                normalizeLog.push("/^\s*\*\s")
            }
        }

        //逆に*直後のスペースが多すぎるとmd的にだめなので1つにする
        while(/\*\s{2,}/.test(text))
        {
            text = text.replace(/\*\s\s/, "* ")
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
    textArray = text.split("\n")
    mapObject = new Object();
    nodeArray = [];

    levelArray = [];
    levelArray[0] = null;

    for(var i = 0; i < textArray.length; i++)
    {
        var level = -1;
        var text = textArray[i];

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
            else
            {
                break;
            }
        }

        text = text.trim();

        var node = {id: i.toString(), text: text, level: level, parent: levelArray[level]}
        nodeArray.push(node)
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
    var svg = document.querySelector("svg");
    var svgData = new XMLSerializer().serializeToString(svg);
    var canvas = document.createElement("canvas");
    canvas.width = svg.width.baseVal.value;
    canvas.height = svg.height.baseVal.value;

    var ctx = canvas.getContext("2d");
    var image = new Image;
    image.onload = function(){
        ctx.drawImage( image, 0, 0 );
        var a = document.getElementById("download-link");
        if(a == null)
        {
            a = document.createElement("a");
            a.id = "download-link"
            document.getElementById("inputArea").appendChild(a)
        }

        a.href = canvas.toDataURL("image/png");
        a.setAttribute("download", "image.png");
        a.text = "ダウンロード(" + new Date().toString() + ")";
    }
    image.src = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgData)));
}