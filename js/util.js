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

    console.log(text)
    //一回空にして入れ直すとキャレットが飛ばないらしい？
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