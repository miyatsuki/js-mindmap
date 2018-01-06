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
    //一回空にして入れ直すとフォーカスが飛ばないらしい？
	element.val();	
    element.focus().val(text);
    eve.setSelectionRange(index, index);
}

function setBetween(x, min, max)
{
    var ans = x;
    ans = Math.max(ans, min);
    ans = Math.min(ans, max);
    return ans;
}