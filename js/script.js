require(['util', 'defines', 'view'], function(util, defines, view) {
    let inputText = '';
    let isCompostioning = false;

    let nodeArray = [];
    let textAreaElement = $('#text');

    console.log(defines);
    console.log(util);

    init();

    function init() {
        setTextAreaCallBack();

        $('#savePNG').click(saveAsPNG);

        let inputText = localStorage.getItem('text');
        textAreaElement.val(inputText);
        createMap(-1);
    }

    function setTextAreaCallBack() {
        textAreaElement.keyup(function(e) {
            executeMapCreation(e);
        });

        textAreaElement.click(function(e) {
            emphasizeNode(e);
        });

        // IME入力中に箱書いたり、テキストボックスを操作されると辛いのでブロック
        textAreaElement.on({
            'compositionstart': function() {
                isCompostioning = true;
            },
            'compositionend': function(e) {
                isCompostioning = false;
                executeMapCreation(e);
            },
        });
    }

    function emphasizeNode(eve) {
        // テキストエリアの行数とnodeIDは一致するので、キャレットの行数を取得してそのIDを強調表示する
        let emphasizeID = util.getCaretLineNumber($('#text'), eve);
        view.changeSingleNodeColor(
            document.getElementsByClassName('nodeRect'),
            emphasizeID,
            '#E1F7E7',
            'white'
        );
    }

    function executeMapCreation(eve) {
        if (inputText !== textAreaElement.val() && !isCompostioning) {
            $.when(
                createMap(eve.keyCode)
            ).done(function(result) {
                // 変化量(result.normalizedLog)が0のときに下手にキャレットを操作すると副作用が出るので回避
                if (result.normalizeLog.length > 0) {
                    moveCaret(result, eve);
                }
                emphasizeNode(eve);
            });
        }
    }

    function moveCaret(val, eve) {
        let index = eve.target.selectionStart + val.caretMove;
        index = setBetween(index, 0, textAreaElement.val().length);

        dynamicSetInTextArea(textAreaElement, val.text, index, eve);

        window.setTimeout(function() {
            eve.target.setSelectionRange(index, index);
        }, 0);
    }

    function createMap(keyCode) {
        inputText = textAreaElement.val();
        let normalizedText = normalizeText(inputText, keyCode);
        localStorage.setItem('text', inputText);

        parseText(normalizedText.text);
        drawNodes();

        let svgSize = changeSVGSize();
        fillBackGroundWhite(svgSize);

        return normalizedText;
    }

    function drawNodes() {
        setInitialNodeSettings();
        decideNodePosition();

        initMap();
        for (let i = 0; i < nodeArray.length; i++) {
            view.drawSingleNode(nodeArray[i]);
            let children = nodeArray[i].children;
            for (let j = 0; j < children.length; j++) {
                view.connectNodes(nodeArray[i], children[j]);
            }
        }
    }

    function setInitialNodeSettings() {
        for (let i = 0; i < nodeArray.length; i++) {
            let node = nodeArray[i];
            node['width'] = defines.getConstant('nodeWidth');

            let heightMargin = defines.getConstant('innerMargin') * 3;
            let textLines = node.textArray.length;
            let textHeight = defines.getConstant('lineHeight') * textLines;
            node['height'] = heightMargin + textHeight;
        }
        view.propagateInnerTextSize(nodeArray);
    }

    function changeSVGSize() {
        let size = calculateCurrentSVGSize();
        let mapElement = document.getElementById('map');
        mapElement.setAttribute('width', size.width.toString());
        mapElement.setAttribute('height', size.height.toString());

        return size;
    }

    function calculateCurrentSVGSize() {
        let rectElements = document.getElementsByClassName('nodeRect');
        let mapElement = document.getElementById('map');

        return {
            width: calculateCurrentSVGWidth(rectElements, mapElement),
            height: calculateCurrentSVGHeight(rectElements, mapElement),
        };
    }

    function calculateCurrentSVGHeight(rectElements, mapElement) {
        let yMax = util.getLastOf(rectElements).getBoundingClientRect().bottom;
        return yMax - mapElement.getBoundingClientRect().top;
    }

    function calculateCurrentSVGWidth(rectElements, mapElement) {
        let xMax = 0;
        for (let i = 0; i < rectElements.length; i++) {
            let ithElementxMax = rectElements[i].getBoundingClientRect().right;
            xMax = Math.max(xMax, ithElementxMax);
        }

        return xMax - mapElement.getBoundingClientRect().left;
    }

    function fillBackGroundWhite(size) {
        // SVGの幅に合わせて背景を白埋め
        let rectElement = document.createElementNS(
            defines.getConstant('svgNS'),
            'rect'
        );
        rectElement = util.setAttributes(rectElement, {
            width: size.width,
            height: size.height,
            x: 0,
            y: 0,
            fill: 'White',
            stroke: 'White',
        });

        let mapElement = document.getElementById('map');
        mapElement.insertBefore(rectElement, mapElement.firstChild);
    }

    function initMap() {
        $('#map').empty();
    }

    function decideNodePosition() {
        let yCounter = 0;
        let i;
        for (i = 0; i < nodeArray.length; i++) {
            let node = nodeArray[i];
            let level = node.level;
            node['x'] = level * defines.getConstant('xPerLevel');

            if (node.children.length === 0) {
                node['y'] = yCounter;
                yCounter += node.height + defines.getConstant('yMargin');
            }
        }

        for (i = nodeArray.length - 1; i >= 0; i--) {
            let node = nodeArray[i];

            if (node.children.length > 0) {
                let y = 0;
                let middleNodeID = Math.floor(node.children.length / 2);
                let upperMiddleChild = node.children[middleNodeID];
                let lowerMiddleChild = node.children[middleNodeID - 1];

                if (node.children.length % 2 === 1) {
                    y = util.getCenterY(upperMiddleChild);
                } else {
                    let y1 = util.getCenterY(upperMiddleChild);
                    let y2 = util.getCenterY(lowerMiddleChild);
                    y = (y1 + y2) / 2;
                }

                nodeArray[i]['y'] = y - node.height / 2; ;
            }
        }
    }

    function normalizeText(input, keyCode) {
        let textArray = input.split('\n');
//        let changed = false;
        let caretMove = 0;
        let normalizeLog = [];

        for (let i = 0; i < textArray.length; i++) {
            let text = textArray[i];

            // 文頭のスペース入力効率化のため、全角スペースを半角1個に変換
            // 全角1スペースがいきなり2スペースになると焦るので置換だけにする
            if (/　/.test(text)) {
                text = text.replace(/　/g, ' ');
//                changed = true;
                caretMove += 0;
                normalizeLog.push('全角1スペ -> 半角1スペ');
            }

            // 文頭の＊入力効率化のため、文頭の＊を*に変換
            if (/^\s*＊/.test(text)) {
                text = text.replace('＊', '*');
//                changed = true;
                caretMove += 0;
                normalizeLog.push('/^\s*＊/');
            }

            // 文頭の＊の入力効率化のため、*直後にスペースが無かったら自動挿入
            if (/^\s*\*/.test(text) && !/^\s*\*\s/.test(text)) {
                // backspaceキー(8)とdelete(46)が押されている間に自動挿入が発動すると辛いので除外
                if (!(keyCode === 8 || keyCode === 46)) {
                    text = text.replace('*', '* ');
//                    changed = true;
                    caretMove += 1;
                    normalizeLog.push('/^\s*\*\s');
                }
            }

            // 逆に*直後のスペースが多すぎるとmd的にだめなので1つにする
            while (/\*\s{2,}/.test(text)) {
                text = text.replace(/\*\s\s/, '* ');
//                changed = true;
                caretMove -= 1;
                normalizeLog.push('/\*\s{2,}/');
            }

            textArray[i] = text;
        }

        return {
            caretMove: caretMove,
            text: textArray.join('\n'),
            normalizeLog: normalizeLog,
        };
    }

    function parseText(input) {
        let lines = input.split('\n');
        let levelArray = [null];
        nodeArray = [];

        let i;
        for (i = 0; i < lines.length; i++) {
            let level = -1;
            let text = lines[i];

            for (let j = 0; j < text.length; j++) {
                if (text.startsWith('  ')) {
                    text = text.substring(2);
                    level++;
                } else if (text.startsWith('*')) {
                    text = text.substring(1);
                    level++;
                    break;
                } else if (text.startsWith(' *')) {
                    text = text.substring(2);
                    level++;
                    break;
                } else {
                    break;
                }
            }

            let textArray = util.breakWord(
                text.trim(),
                defines.getConstant('characterPerLine')
            );

            let node = {
                id: i.toString(),
                textArray: textArray,
                level: level,
                parent: levelArray[level],
            };

            nodeArray.push(node);
            levelArray[level + 1] = node;
        }

        let childrenMap = {};

        for (i = nodeArray.length - 1; i >= 0; i--) {
            if (nodeArray[i].id in childrenMap) {
                nodeArray[i]['children'] = childrenMap[nodeArray[i].id];
            } else {
                nodeArray[i]['children'] = [];
            }

            if (nodeArray[i].parent != null) {
                if (!(nodeArray[i].parent.id in childrenMap)) {
                    childrenMap[nodeArray[i].parent.id] = [];
                }

                childrenMap[nodeArray[i].parent.id].push(nodeArray[i]);
            }
        }
    }

    function saveAsPNG() {
        let svg = document.querySelector('svg');
        let svgData = new XMLSerializer().serializeToString(svg);
        let canvas = document.createElement('canvas');
        canvas.width = svg.width.baseVal.value;
        canvas.height = svg.height.baseVal.value;

        let ctx = canvas.getContext('2d');
        let image = new Image;
        image.onload = function() {
            ctx.drawImage(image, 0, 0);
            let a = document.getElementById('download-link');
            if (a == null) {
                a = document.createElement('a');
                a.id = 'download-link';
                document.getElementById('inputArea').appendChild(a);
            }

            a.href = canvas.toDataURL('image/png');
            a.setAttribute('download', 'image.png');
            a.text = 'ダウンロード(' + new Date().toString() + ')';
        };
        let svgString = btoa(unescape(encodeURIComponent(svgData)));
        image.src = 'data:image/svg+xml;charset=utf-8;base64,' + svgString;
    }
});
