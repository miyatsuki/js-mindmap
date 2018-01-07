function setAttributes(element, attributesDict)
{
    if(arguments.length != 2)
    {
        throw "setAttributes needs 2 arguments!"
    }

    for(key in attributesDict)
    {
        element.setAttribute(key, attributesDict[key]);
    }

    return element;
}

//テキストエリアに代入する用の関数
function dynamicSetinTextArea(element, text, index, eve)
{
    if(element.length != 1)
    {
        throw new Error("element length is not 1.\n Please check you are selecting the corect JQuery element.")
    }

    //一回空にして入れ直すとキャレットが飛ばないらしい？
	element.val();	
    element.focus().val(text);
    eve.target.setSelectionRange(index, index);
}

//キャレットが今何行目にいるか
function getCaretLineNumber(element, eve)
{
    if(element.length != 1)
    {
        throw new Error("element length is not 1.\n Please check you are selecting the corect JQuery element.")
    }

    var index = eve.target.selectionStart;

    var leftWords = index;
    var texts = element.val().split("\n");

    var ans = 0;
    while(ans < texts.length && leftWords >= 0)
    {
        leftWords -= texts[ans].length + 1; //改行文字の分
        ans++;
    }

    //最後の一回余計に++されるので一つ引いて返す
    return ans - 1;
}

function setBetween(x, min, max)
{
    var ans = x;
    ans = Math.max(ans, min);
    ans = Math.min(ans, max);
    return ans;
}

function breakWord(text, characterPerLine)
{
    ans = [""];

    var lines = 0;
    var count = 0;
    for(var i = 0; i < text.length; i++)
    {
        if(text[i] == undefined)
        {
            throw new Error("hge")
        }

        count += text[i].match(/^[0-9a-zA-Z]+$/) ? 1 : 2;
        if(count < characterPerLine)
        {
            ans[lines] = ans[lines] + text[i];
        }

        if(count >= characterPerLine)
        {
            lines++
            ans[lines] = "";
            i--;
            count = 0;
        }
    }

    return ans;
}