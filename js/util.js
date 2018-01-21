define(['defines'], function(defines) {
    /**
    * get current height of mindmap
    * @param {htmlElement} element htmlElement to setAttribue
    * @param {dict} attributesDict name of attribute and value
    * @return {htmlElement} input element with attributes setted
    */
    function setAttributes(element, attributesDict) {
        if (arguments.length !== 2) {
            throw new Error('setAttributes needs 2 arguments!');
        }

        for (let key in attributesDict) {
            if (attributesDict.hasOwnProperty(key)) {
                element.setAttribute(key, attributesDict[key]);
            }
        }

        return element;
    }

    /**
    * sets text in text area and moves caret at the same time
    * @param {htmlElement} element htmlElement that represents textarea
    * @param {string} text text to set in textarea
    * @param {integer} index position of caret
    * @param {object} eve eventListener
    */
    function dynamicSetInTextArea(element, text, index, eve) {
        // テキストエリアに代入する用の関数

        if (element.length !== 1) {
            throw new Error(
                'element length is not 1.\n'
                + 'Please check you are selecting the correct JQuery element.'
            );
        }

        // 一回空にして入れ直すとキャレットが飛ばないらしい？
        element.val();
        element.focus().val(text);
        eve.target.setSelectionRange(index, index);
    }

    /**
    * gets line number of caret in textarea
    * @param {htmlElement} element htmlElement that represents textarea
    * @param {object} eve eventListener
    * @return {integer} line number of caret
    */
    function getCaretLineNumber(element, eve) {
        // キャレットが今何行目にいるか

        if (element.length !== 1) {
            throw new Error(
                'element length is not 1.\n'
                + 'Please check you are selecting the correct JQuery element.'
            );
        }

        let leftWords = eve.target.selectionStart;
        let texts = element.val().split('\n');

        let ans = 0;
        while (ans < texts.length && leftWords >= 0) {
            leftWords -= texts[ans].length + 1; // 改行文字の分
            ans++;
        }

        // 最後の一回余計に++されるので一つ引いて返す
        return ans - 1;
    }

    function setBetween(x, min, max) {
        let ans = x;
        ans = Math.max(ans, min);
        ans = Math.min(ans, max);
        return ans;
    }


    /**
    * break texts into array using defined 'characterPerLine'
    * @param {string} text text to break into lines
    * @return {array} string broken int lines
    */
    function breakWord(text) {
        let ans = [''];
        let characterPerLine = defines.getConstant('characterPerLine');

        let lines = 0;
        let count = 0;
        for (let i = 0; i < text.length; i++) {
            count += text[i].match(/^[0-9a-zA-Z]+$/) ? 1 : 2;
            if (count < characterPerLine) {
                ans[lines] = ans[lines] + text[i];
            } else {
                lines++;
                ans[lines] = '';
                i--;
                count = 0;
            }
        }

        return ans;
    }

    /**
    * get height of text according to the define and line number
    * @param {integer} num number of lines
    * @return {integer} pixels for num lines texts
    */
    function getTextHeight(num) {
        return defines.getConstant('lineHeight') * num;
    }

    /**
    * get height of text according to the define and line number
    * @param {string} name name of svg element
    * @return {svgElement} SVG element create by document.createElementNS
    */
    function createSVGElement(name) {
        return document.createElementNS(defines.getConstant('svgNS'), name);
    }

    /**
    * get height of text according to the define and line number
    * @param {integer} level level of the node
    * @return {integer} x position according to the level
    */
    function getXfromLevel(level) {
        let width = defines.getConstant('nodeWidth');
        let margin = defines.getConstant('xMargin');
        return level * (width + margin);
    }

    return {
        setAttributes: setAttributes,
        dynamicSetInTextArea: dynamicSetInTextArea,
        getCaretLineNumber: getCaretLineNumber,
        setBetween: setBetween,
        breakWord: breakWord,
        getTextHeight: getTextHeight,
        createSVGElement: createSVGElement,
        getXfromLevel: getXfromLevel,
    };
});
