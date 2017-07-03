/**
 * Walks a template node tree, sending render events to the patcher via method
 * calls. All interaction with the DOM should be done in the patcher/transforms,
 * these functions only process template nodes and prev/next data in order to
 * emit events.
 */

var utils = require('./utils');
var builtins = require('./builtins');


function Renderer(patcher, bound_template) {
    this.bound_template = bound_template;
    this.patcher = patcher;
    this.text_buffer = null;
}

Renderer.prototype.render = function (template_id, next_data, prev_data) {
    this.patcher.start();
    this.renderTemplate(template_id, next_data, prev_data, null);
    this.flushText();
    this.patcher.end(next_data);
};

Renderer.prototype.renderTemplate = function (template_id, next_data, prev_data, inner) {
    var template = document.getElementById(template_id);
    if (!template) {
        throw new Error("Template not found: '" + template_id + "'");
    }
    this.children(template.content, next_data, prev_data, null, inner);
};

Renderer.prototype.child = function (node, i, next_data, prev_data, key, inner) {
    if (utils.isTextNode(node)) {
        this.text(node, next_data);
    }
    else if (utils.isTemplateTag(node)) {
        this.templateTag(node, next_data, prev_data, key, inner);
    }
    else if (utils.isElementNode(node)) {
        var k = key && key + '/' + i;
        this.element(node, next_data, prev_data, k, inner);
    }
};

Renderer.prototype.children = function (parent, next_data, prev_data, key, inner) {
    var self = this;
    utils.eachNode(parent.childNodes, function (node, i) {
        self.child(node, i, next_data, prev_data, key, inner);
    });
};

Renderer.prototype.flushText = function () {
    if (this.text_buffer) {
        this.patcher.text(this.text_buffer);
        this.text_buffer = null;
    }
};

Renderer.prototype.element = function (node, next_data, prev_data, key, inner) {
    this.flushText();
    this.patcher.enterTag(node.tagName, key);
    for (var i = 0, len = node.attributes.length; i < len; i++) {
        var attr = node.attributes[i];
        var event_match = /^on([a-zA-Z]+)/.exec(attr.name);
        if (event_match) {
            this.patcher.eventListener(
                event_match[1],
                attr.value,
                next_data,
                this.bound_template
            );
        }
        else {
            this.patcher.attribute(
                attr.name,
                this.expandVars(attr.value, next_data)
            );
        }
    }
    this.children(node, next_data, prev_data, null, inner);
    this.flushText();
    this.patcher.exitTag();
};

Renderer.prototype.expandVars = function (str, data) {
    return str.replace(/{{\s*([^}]+?)\s*}}/g,
        function (full, property) {
            return utils.lookup(data, utils.propertyPath(property));
        }
    );
};

Renderer.prototype.text = function (node, data) {
    var str = this.expandVars(node.textContent, data);
    if (!this.text_buffer) {
        this.text_buffer = str;
    }
    else {
        this.text_buffer += str;
    }
};

Renderer.prototype.templateTag = function (node, next_data, prev_data, key, inner) {
    var name = utils.templateTagName(node);
    var f = builtins[name];
    if (!f) {
        throw new Error('Unknown template tag: ' + node.tagName);
    }
    return f(this, node, next_data, prev_data, key, inner);
};

exports.Renderer = Renderer;
