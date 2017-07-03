var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT = 11;

exports.isDocumentFragment = function (node) {
    return node.nodeType === DOCUMENT_FRAGMENT;
};

exports.isElementNode = function (node) {
    return node.nodeType === ELEMENT_NODE;
};

exports.isTextNode = function (node) {
    return node.nodeType === TEXT_NODE;
};

exports.eachNode = function (nodelist, f) {
    var i = 0;
    var node = nodelist[0];
    while (node) {
        var tmp = node;
        // need to call nextSibling before f() because f()
        // might remove the node from the DOM
        node = node.nextSibling;
        f(tmp, i++, nodelist);
    }
};

exports.mapNodes = function (nodelist, f) {
    var results = [];
    exports.eachNode(nodelist, function (node, i) {
        results[i] = f(node, i, nodelist);
    });
    return results;
};

exports.propertyPath = function (str) {
    return str.split('.').filter(function (x) {
        return x;
    });
};

// finds property path array (e.g. ['foo', 'bar']) in data object
exports.lookup = function (data, props) {
    var value = data;
    for(var i = 0, len = props.length; i < len; i++) {
        if (value === undefined || value === null) {
            return '';
        }
        value = value[props[i]];
    }
    return (value === undefined || value === null) ? '' : value;
};
