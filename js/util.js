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