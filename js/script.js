var svgNS = "http://www.w3.org/2000/svg";
var htmlNS = "http://www.w3.org/1999/xhtml"

var inputText = "";
var isCompostioning = false;
var context = {pressedKeyCode: null};

$("#text").keyup(function(e){
    context.pressedKeyCode = e.keyCode
    var eve = $(this).get(0);
    $.when(createMap($(this).get(0))).done(function(result) {
        moveCaret(result, eve)
        });
})

//IME入力中に箱書いたり、テキストボックスを操作されると辛いのでブロック
$("#text").on("compositionstart", function(){
    isCompostioning = true;0
})

$("#text").on("compositionend", function(){
    isCompostioning = false;
    var eve = $(this).get(0);
    $.when(createMap($(this).get(0))).done(function(result) {
        moveCaret(result, eve)
        });
})

$("#savePNG").click(function(){
    saveAsPNG();
})


var nodeWidth = 100;
var nodeHeight = 50;
var xMargin = 50;
var yMargin = 20;

function moveCaret(val, eve)
{
    //変化量(val)が0のときに下手にキャレットを操作すると副作用が出るので即戻る
    if(val == 0)
    {
        return;
    }

    var index = eve.selectionStart;
    index += val;

    index = Math.max(0, index);
    index = Math.min($("#text").val().length, index)
    eve.setSelectionRange(index, index)

    window.setTimeout(function() {
        eve.setSelectionRange(index, index);
    }, 0);
}

function createMap(eve){
    if(inputText == $("#text").val() || isCompostioning)
    {
        return 0;
    }

    inputText = $("#text").val()

    var normalizedText = normalizeText(inputText);
    var index = 0;

    //テキストボックス内の値を書き換えるとカーソルが後ろに飛ぶようなので先に値を拾っておく
    if(normalizedText.changed)
    {
        var revIndex = inputText.length - index + 1;

        inputText = normalizedText.text;
        $("#text").val(inputText);

        index += normalizedText.caretMove;
        }

    drawMap(inputText);

    return index;
}

function drawMap(text)
{
    initMap();

    nodeArray = parseText(text);
    nodeArray = decideNodePosition(nodeArray);

    for(var i = 0; i < nodeArray.length; i++)
    {
        drawSingleNode(nodeArray[i].text, nodeArray[i].x, nodeArray[i].y)
        var children = nodeArray[i].children;
        for(var j = 0; j < children.length; j++)
        {
            connectNodes(nodeArray[i], children[j]);                
        }
    }

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
    rectElement.setAttribute("width", newWidth);
    rectElement.setAttribute("height", newHeight);
    rectElement.setAttribute("x", 0);
    rectElement.setAttribute("y", 0);
    rectElement.setAttribute("fill", "white");
    rectElement.setAttribute("stroke", "White");

    document.getElementById("map").insertBefore(rectElement, document.getElementById("map").firstChild);
}

function initMap()
{
    $("#map").empty();    
}

function decideNodePosition(nodeArray)
{
    var leafCounter = 0;

    for(var i = 0; i < nodeArray.length; i++)
    {
        var level = nodeArray[i].level;
        nodeArray[i]["x"] = level*(nodeWidth + xMargin)

        if(nodeArray[i].children.length == 0)
        {
            nodeArray[i]["y"] = leafCounter*(nodeHeight + yMargin)
            leafCounter++;
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
                y = nodeArray[i].children[middleNodeID].y;
            }
            else
            {
                var y1 = nodeArray[i].children[middleNodeID].y;
                var y2 = nodeArray[i].children[middleNodeID - 1].y;
                y = (y1 + y2)/2;
            }

            nodeArray[i]["y"] = y;
        }
    }

    return nodeArray
}

function drawSingleNode(text, x, y)
{
    var rectElement = document.createElementNS(svgNS, "rect");
    rectElement.setAttribute("width", nodeWidth);
    rectElement.setAttribute("height", nodeHeight);
    rectElement.setAttribute("x", x);
    rectElement.setAttribute("y", y);
    rectElement.setAttribute("fill", "white");
    rectElement.setAttribute("stroke", "black");
    var foreignElement = document.createElementNS(svgNS, "foreignObject");
    foreignElement.setAttribute("width", nodeWidth);
    foreignElement.setAttribute("height", nodeHeight); 
    foreignElement.setAttribute("x", x);
    foreignElement.setAttribute("y", y);
    var innerElement = document.createElementNS(htmlNS, "div");
    innerElement.innerHTML = text;
    innerElement.setAttribute("class", "innerText");

    document.getElementById("map").appendChild(rectElement);
    document.getElementById("map").appendChild(foreignElement);
    foreignElement.appendChild(innerElement);
}

function connectNodes(fromNode, toNode)
{
    var lineElement = document.createElementNS(svgNS, "line");
    lineElement.setAttribute("x1", fromNode.x + nodeWidth);
    lineElement.setAttribute("y1", fromNode.y + nodeHeight/2);
    lineElement.setAttribute("x2", toNode.x);
    lineElement.setAttribute("y2", toNode.y + nodeHeight/2);
    lineElement.setAttribute("stroke", "black");

    document.getElementById("map").appendChild(lineElement);
}

function normalizeText(text)
{
    textArray = text.split("\n")
    changed = false;
    caretMove = 0;

    for(var i = 0; i < textArray.length; i++)
    {
        var text = textArray[i];

        //文頭のスペース入力効率化のため、全角スペースを半角2個に変換
        if(/　/.test(text))
        {
            text = text.replace(/　/g, "  ");
            changed = true;
            caretMove += 1; 
        }

        //文頭の＊入力効率化のため、文頭の＊を*に変換
        if(/^\s*＊/.test(text))
        {
            text = text.replace("＊", "*")
            changed = true;
            caretMove += 0; 
        }

        //文頭の＊の入力効率化のため、*直後にスペースが無かったら自動挿入
        if(!/^\s*\*\s/.test(text))
        {
            //backspaceキー(8)とdelete(46)が押されている間に自動挿入が発動すると辛いので除外
            if(!(context.pressedKeyCode == 8 || context.pressedKeyCode == 46))
            {
                text = text.replace("*", "* ")
                changed = true;
                caretMove += 1;
            }
        }

        //逆に*直後のスペースが多すぎるとmd的にだめなので1つにする
        while(/\*\s{2,}/.test(text))
        {
            text = text.replace(/\*\s\s/, "* ")
            changed = true;
            caretMove -= 1;
        }

        textArray[i] = text;
        
    }

    return {changed: changed, caretMove: caretMove, text: textArray.join("\n")};
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

    return nodeArray;
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