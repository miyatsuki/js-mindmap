function setAttributes(element, attributesDict)
{
    for(key in attributesDict)
    {
        element.setAttribute(key, attributesDict[key]);
    }

    return element;
}