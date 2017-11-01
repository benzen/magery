var Patcher = require('./patch').Patcher;

exports._template = function (render) {
    var f = function (node, data, handlers) {
        var patcher = new Patcher(node);
        return render.call(this, patcher, data, handlers);
    };
    f._render = render;
    return f;
};
