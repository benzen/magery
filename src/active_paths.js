var utils = require('./utils');

exports.markPath = function (obj, props) {
    switch (props.length) {
    case 0: return;
    case 1: obj[props[0]] = true; return;
    default:
        for(var i = 0, len = props.length - 2; i < len; i++) {
            var k = props[i];
            if (obj[k] === true) {
                return;
            }
            if (obj[k] === undefined) {
                obj[k] = {};
            }
            obj = obj[k];
        }
        if (obj[props[i]]) {
            obj[props[i]] = true;
        }
        else {
            var val = {};
            val[props[i + 1]] = true;
            obj[props[i]] = val;
        }
    }
};

exports.mergePaths = function (a, b) {
    for (var k in b) {
        if (a[k] === true) {
            continue;
        }
        else if (b[k] === true) {
            a[k] = true;
        }
        else if (!a[k]) {
            a[k] = b[k];
        }
        else {
            if (Object.keys(a[k])[0] == Object.keys(b[k])[0]) {
                exports.mergePaths(a[k], b[k]);
            }
            else {
                a[k] = true;
            }
        }
    }
};

exports.equivalentPathObjects = function (a, b) {
    var a_keys = Object.keys(a);
    var b_keys = Object.keys(b);
    // same number of keys
    if (a_keys.length !== b_keys.length) {
        return false;
    }
    a_keys.sort();
    b_keys.sort();
    // same keys
    for (var i = a_keys.length - 1; i >= 0; i--) {
        if (a_keys[i] !== b_keys[i]) {
            return false;
        }
    }
    // same values
    for (i = a_keys.length - 1; i >= 0; i--) {
        var k = a_keys[i];
        var a_val = a[k];
        var b_val = b[k];
        if (a_val === true && b_val === true) {
            continue;
        }
        else if (a_val === true || b_val === true) {
            return false;
        }
        else if (!exports.equivalentPathObjects(a[k], b[k])) {
            return false;
        }
    }
    return true;
};

exports.stringPaths = function (str) {
    var paths = {};
    var m = str.match(/{{\s*([^}]+?)\s*}}/g);
    if (m) {
        m.forEach(function (v) {
            exports.markPath(
                paths,
                utils.propertyPath(v.replace(/^{{\s*|\s*}}$/g, ''))
            );
        });
    }
    return paths;
};

function updateChildPaths (paths, node) {
    var wildcard = false;
    var child_paths = utils.mapNodes(node.childNodes, initNode);
    for (var i = 0, len = child_paths.length; i < len; i++) {
        var p = child_paths[i];
        if (!p) {
            wildcard = true;
            break;
        }
        exports.mergePaths(paths, p);
    }
    utils.eachNode(node.childNodes, function (child, i) {
        var p = child_paths[i];
        if (p && Object.keys(p).length === 0) {
            child.static = true;
        }
        else if (wildcard || !exports.equivalentPathObjects(p, paths)) {
            child.active_paths = p;
        }
    });
    return wildcard ? false: paths;
};

exports.elementPaths = function (node) {
    var paths = {};
    var remove = null;
    var path;
    if (node.attributes) {
        for (var i = 0, len = node.attributes.length; i < len; i++) {
            var attr = node.attributes[i];
            if (attr.name == 'data-each') {
                var parts = attr.value.split(' in ');
                if (parts.length < 2) {
                    throw new Error(
                        'Badly formed data-each attribute value: ' + attr.value
                    );
                }
                path = utils.propertyPath(parts[1]);
                exports.markPath(paths, path);
                remove = parts[0];
            }
            if (attr.name == 'data-if') {
                path = utils.propertyPath(attr.value);
                exports.markPath(paths, path);
            }
            else if (attr.name == 'data-unless') {
                path = utils.propertyPath(attr.value);
                exports.markPath(paths, path);
            }
            else {
                exports.mergePaths(paths, exports.stringPaths(attr.value));
            }
        }
    }
    paths = updateChildPaths(paths, node);
    if (remove) {
        delete paths[remove];
    }
    return paths;
};

function templateCallPaths(node) {
    var paths = {};
    for (var i = 0, len = node.attributes.length; i < len; i++) {
        var attr = node.attributes[i];
        if (attr.name === 'template') {
            exports.mergePaths(paths, exports.stringPaths(attr.value));
        }
        else {
            exports.markPath(paths, utils.propertyPath(attr.value));
        }
    }
    paths = updateChildPaths(paths, node);
    return paths;
}

function templateChildrenPaths(node) {
    return false;
}

var templateTags = {
    'call': templateCallPaths,
    'children': templateChildrenPaths
};

function initNode(node) {
    if (utils.isTextNode(node)) {
        return exports.stringPaths(node.textContent);
    }
    else {
        var name = utils.templateTagName(node);
        if (name) {
            var f = templateTags[name];
            if (!f) {
                throw new Error('Unknown template tag: ' + node.tagName);
            }
            return f(node);
        }
        else if (utils.isElementNode(node) || utils.isDocumentFragment(node)) {
            return exports.elementPaths(node);
        }
    }
    return false;
}

exports.markPaths = function (container) {
    utils.eachNode(container.childNodes, function (child) {
        child.active_paths = initNode(child);
        child.static = (
            child.active_paths && (Object.keys(child.active_paths).length === 0)
        );
    });
};
