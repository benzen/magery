var magery =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(5);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var render = __webpack_require__(2);

	function getAttr(node, name) {
	    var attr = node.attributes.getNamedItem(name);
	    if (attr) {
	        return attr.value;
	    }
	    throw new Error(
	        render.errorMessage(
	            node,
	            node.tagName + " missing required attribute '" + name + "'"
	        )
	    );
	}

	function hasAttr(node, name) {
	    return !!(node.attributes.getNamedItem(name));
	}

	// TODO: remove this counter side-effect and handle in the template init?
	var each_counter = 0;
	exports['each'] = function (renderer, node, next_data, prev_data, key, inner) {
	    // the counter is to avoid adjacent each blocks from
	    // interfering with each others keys
	    var count = node.count;
	    if (!count) {
	        count = node.count = each_counter++;
	    }
	    var path = render.propertyPath(getAttr(node, 'in'));
	    var iterable = render.lookup(next_data, path);
	    var key_path = null;
	    if (hasAttr(node, 'key')) {
	        key_path = render.propertyPath(getAttr(node, 'key'));
	    }
	    var d = Object.assign({}, next_data);
	    for (var i = 0, len = iterable.length; i < len; i++) {
	        var item = iterable[i];
	        d[getAttr(node, 'name')] = item;
	        var item_key = key_path && render.lookup(item, key_path);
	        var k = key;
	        if (item_key) {
	            if (k) {
	                k += '/' + item_key;
	            }
	            else {
	                k = item_key;
	            }
	        }
	        k = k && count + '/' + k;
	        renderer.children(node, d, prev_data, k);
	    }
	};

	function isTruthy(x) {
	    if (Array.isArray(x)) {
	        return x.length > 0;
	    }
	    return x;
	}

	exports['if'] = function (renderer, node, next_data, prev_data, key, inner) {
	    var path = render.propertyPath(getAttr(node, 'test'));
	    var test = render.lookup(next_data, path);
	    if (isTruthy(test)) {
	        renderer.children(node, next_data, prev_data, key, inner);
	    }
	};

	exports['unless'] = function (renderer, node, next_data, prev_data, key, inner) {
	    var path = render.propertyPath(getAttr(node, 'test'));
	    var test = render.lookup(next_data, path);
	    if (!isTruthy(test)) {
	        renderer.children(node, next_data, prev_data, key, inner);
	    }
	};

	exports['call'] = function (renderer, node, next_data, prev_data, key, inner) {
	    var template_id = renderer.expandVars(getAttr(node, 'template'), next_data);
	    var nd = {};
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var name = node.attributes[i].name;
	        if (name !== 'template') {
	            var path = render.propertyPath(node.attributes[i].value);
	            var value = render.lookup(next_data, path);
	            nd[name] = value;
	        }
	    }
	    var inner2 = function () {
	        renderer.children(node, next_data, prev_data, key, inner);
	    };
	    renderer.renderTemplate(template_id, nd, prev_data, inner2);
	};

	exports['children'] = function (renderer, node, next_data, prev_data, key, inner) {
	    inner();
	};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Walks a template node tree, sending render events to the patcher via method
	 * calls. All interaction with the DOM should be done in the patcher/transforms,
	 * these functions only process template nodes and prev/next data in order to
	 * emit events.
	 */

	var utils = __webpack_require__(3);
	var builtins = __webpack_require__(1);

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;


	function isTemplateTag(node) {
	    return /^TEMPLATE-/.test(node.tagName);
	}

	function templateTagName(node) {
	    if (node._template_tag) {
	        return node._template_tag;
	    }
	    var m = /^TEMPLATE-([^\s/>]+)/.exec(node.tagName);
	    if (!m) {
	        throw new Error('Not a template tag: ' + node.tagName);
	    }
	    node._template_tag = m[1].toLowerCase();
	    return node._template_tag;
	}

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

	function Renderer(patcher) {
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
	    if (node.nodeType === TEXT_NODE) {
	        this.text(node, next_data);
	    }
	    else if (isTemplateTag(node)) {
	        this.templateTag(node, next_data, prev_data, key, inner);
	    }
	    else if (node.nodeType === ELEMENT_NODE) {
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
	    console.log(['element', node.tagName, next_data]);
	    this.flushText();
	    this.patcher.enterTag(node.tagName, key);
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var attr = node.attributes[i];
	        this.patcher.attribute(
	            attr.name,
	            this.expandVars(attr.value, next_data)
	        );
	    }
	    this.children(node, next_data, prev_data, null, inner);
	    this.flushText();
	    this.patcher.exitTag();
	};

	Renderer.prototype.expandVars = function (str, data) {
	    return str.replace(/{{\s*([^}]+?)\s*}}/g,
	        function (full, property) {
	            return exports.lookup(data, exports.propertyPath(property));
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
	    var name = templateTagName(node);
	    var f = builtins[name];
	    if (!f) {
	        throw new Error('Unknown template tag: ' + node.tagName);
	    }
	    return f(this, node, next_data, prev_data, key, inner);
	};

	exports.Renderer = Renderer;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	exports.htmlEscape = function (str) {
	    return String(str)
	        .replace(/&/g, '&amp;')
	        .replace(/"/g, '&quot;')
	        .replace(/'/g, '&#39;')
	        .replace(/</g, '&lt;')
	        .replace(/>/g, '&gt;');
	};

	exports.eachNode = function (nodelist, f) {
	    var i = 0;
	    var node = nodelist[0];
	    while (node) {
	        var tmp = node;
	        // need to call nextSibling before f() because f()
	        // might remove the node from the DOM
	        node = node.nextSibling;
	        f(tmp, i++);
	    }
	};


/***/ }),
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	// var parsers = require('./parsers');
	// var context = require('./context');
	var render = __webpack_require__(2);
	var patch = __webpack_require__(6);


	/***** Public API *****/

	// exports.loadTemplates = parsers.loadTemplates;

	// exports.patch = function (templates, name, node, next_data, prev_data, first_pass) {
	//     var patcher = new patch.Patcher(node);
	//     var renderer = new render.Renderer(patcher, templates, first_pass);
	//     renderer.render(name, next_data, prev_data);
	// };

	exports.bind = function (element, template_id, data, handlers) {
	    var patcher = new patch.Patcher(element);
	    var renderer = new render.Renderer(patcher);
	    renderer.render(template_id, data, null, handlers);
	};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Processes render events (e.g. enterTag, exitTag) and matches them against the
	 * current state of the DOM. Where there is a mismatch a transform function is
	 * called to reconcile the differences. The Patcher code should only _read_ the
	 * DOM, performing DOM mutation only through transform calls.
	 */

	var utils = __webpack_require__(3);
	var transforms = __webpack_require__(7);
	var Set = __webpack_require__(8);

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;

	function matches(node, tag, key) {
	    return (
	        node.tagName === tag ||
	        node.nodeType === TEXT_NODE && tag === '#text'
	    ) && node.key == key;
	};

	function align(parent, node, tag, key) {
	    if (node && matches(node, tag, key)) {
	        return node;
	    }
	    if (key && parent.keymap) {
	        return parent.keymap[key] || null;
	    }
	    return null;
	};

	// deletes all children in parent starting from node (inclusive)
	function deleteChildren(transforms, parent, node) {
	    while (node) {
	        var tmp = node;
	        node = node.nextSibling;
	        transforms.removeChild(parent, tmp);
	    }
	}

	// includes some virtual attributes (e.g. 'checked')
	function getAttributes(node) {
	    var attrs = node.attributes;
	    if (node.checked) {
	        attrs = Array.prototype.slice.call(attrs);
	        attrs.push({name: 'checked', value: node.checked});
	    }
	    return attrs;
	}

	function deleteUnvisitedAttributes(transforms, node) {
	    var attrs = getAttributes(node);
	    var remove = [];
	    var i, len;
	    for (i = 0, len = attrs.length; i < len; i++) {
	        var attr = attrs[i];
	        if (!node.visited_attributes.has(attr.name)) {
	            remove.push(attr.name);
	        }
	    }
	    for (i = 0, len = remove.length; i < len; i++) {
	        transforms.removeAttribute(node, remove[i]);
	        if (remove[i] === 'value') {
	            transforms.removeEventListener(node, 'input', resetInput);
	        }
	    }
	};

	// deletes children not marked as visited during patch
	function deleteUnvisitedEvents(transforms, node) {
	    if (!node.event_handlers) {
	        return;
	    }
	    for (var type in node.event_handlers) {
	        if (!node.visited_events.has(type)) {
	            transforms.removeEventListener(node, type, node.event_handlers[type]);
	            delete node.event_handlers[type];
	        }
	    }
	};


	function Patcher(node, custom_transforms) {
	    this.container = node;
	    this.parent = null;
	    this.current = null;
	    this.transforms = custom_transforms || transforms;
	};

	exports.Patcher = Patcher;

	Patcher.prototype.start = function () {
	    this.stepInto(this.container);
	};

	Patcher.prototype.stepInto = function (node) {
	    node.visited_attributes = new Set();
	    node.visited_events = new Set();
	    this.parent = node;
	    this.current = node.firstChild;
	};

	Patcher.prototype.enterTag = function (tag, key) {
	    var node = align(this.parent, this.current, tag, key);
	    if (!node) {
	        node = this.transforms.insertElement(this.parent, this.current, tag);
	        if (key) {
	            if (!this.parent.keymap) {
	                this.parent.keymap = {};
	            }
	            this.parent.keymap[key] = node;
	            node.key = key;
	        }
	    }
	    else if (!this.current) {
	        this.transforms.appendChild(this.parent, node);
	    }
	    else if (node !== this.current) {
	        this.transforms.replaceChild(this.parent, node, this.current);
	    }
	    this.stepInto(node);
	};

	function getListener(node, type) {
	    return node.event_handlers && node.event_handlers[type];
	}

	function setListener(transforms, node, type, handler) {
	    transforms.addEventListener(node, type, handler);
	    node.visited_events.add(type);
	    if (!node.event_handlers) {
	        node.event_handlers = {};
	    }
	    node.event_handlers[type] = handler;
	}

	function replaceListener(transforms, node, type, handler) {
	    var old_handler = getListener(node, type);
	    if (old_handler) {
	        // remove existing event handler
	        transforms.removeEventListener(node, type, old_handler);
	    }
	    setListener(transforms, node, type, handler);
	}

	// TODO: these get re-bound every render of an element because
	// the context etc may have changed - probably a better to do this
	Patcher.prototype.eventListener = function (type, name, context, path) {
	    var container = this.container;
	    var f = function (event) {
	        if (container.dispatch) {
	            container.dispatch(name, event, context, path);
	        }
	        var node = event.target;
	        if (node.tagName === 'INPUT') {
	            var nodeType = node.getAttribute('type');
	            if (type == 'change') {
	                if (nodeType === 'checkbox') {
	                    resetCheckbox(event);
	                }
	                else if (nodeType === 'radio') {
	                    resetRadio(event);
	                }
	            }
	            else if (type == 'input' && node.hasAttribute('value')) {
	                resetInput(event);
	            }
	        }
	        else if (node.tagName === 'SELECT') {
	            resetSelected(event);
	        }
	    };
	    replaceListener(this.transforms, this.parent, type, f);
	};

	// force checkbox node checked property to match last rendered attribute
	function resetCheckbox(event) {
	    event.target.checked = event.target.hasAttribute('checked');
	}

	function resetRadio(event) {
	    var expected = event.target.hasAttribute('checked');
	    if (event.target.checked != expected) {
	        if (event.target.name) {
	            // TODO: are radio buttons with the same name in different forms
	            // considered part of the same group?
	            var els = document.getElementsByName(event.target.name);
	            for (var i = 0, len = els.length; i < len; i++) {
	                var el = els[i];
	                el.checked = el.hasAttribute('checked');
	            }
	        }
	        else {
	            // not part of a group
	            event.target.checked = expected;
	        }
	    }
	    //event.target.checked = event.target.hasAttribute('checked');
	}

	// force option node selected property to match last rendered attribute
	function resetSelected(event) {
	    var options = event.target.getElementsByTagName('option');
	    for (var i = 0, len = options.length; i < len; i++) {
	        var option = options[i];
	        option.selected = option.hasAttribute('selected');
	    }
	}

	// force input to match last render of value attribute
	function resetInput(event) {
	    var node = event.target;
	    var expected = node.getAttribute('value');
	    if (node.value !== expected) {
	        node.value = expected;
	    }
	}

	Patcher.prototype.attribute = function (name, value) {
	    var node = this.parent;
	    if (node.getAttribute(name) !== value) {
	        this.transforms.setAttribute(node, name, utils.htmlEscape(value));
	    }
	    node.visited_attributes.add(name);
	};

	Patcher.prototype.text = function (text) {
	    var node = align(this.parent, this.current, '#text', null);
	    if (!node) {
	        node = this.transforms.insertTextNode(this.parent, this.current, text);
	    }
	    else if (node.textContent !== text) {
	        this.transforms.replaceText(node, text);
	    }
	    this.current = node.nextSibling;
	};

	Patcher.prototype.exitTag = function () {
	    // delete unvisited child nodes
	    deleteChildren(this.transforms, this.parent, this.current);
	    var node = this.parent;
	    this.parent = node.parentNode;
	    this.current = node.nextSibling;
	    deleteUnvisitedAttributes(this.transforms, node);
	    deleteUnvisitedEvents(this.transforms, node);
	    if (node.tagName === 'INPUT') {
	        var type = node.getAttribute('type');
	        if (type === 'checkbox' && !getListener(node, 'change')) {
	            setListener(this.transforms, node, 'change', resetCheckbox);
	        }
	        else if (type === 'radio' && !getListener(node, 'change')) {
	            setListener(this.transforms, node, 'change', resetRadio);
	        }
	        else if (node.hasAttribute('value') && !getListener(node, 'input')) {
	            setListener(this.transforms, node, 'input', resetInput);
	        }
	    }
	    else if (node.tagName === 'SELECT') {
	        setListener(this.transforms, node, 'change', resetSelected);
	    }
	};

	Patcher.prototype.skip = function (tag, key) {
	    var node = align(this.parent, this.current, tag, key);
	    if (!this.current) {
	        this.transforms.appendChild(this.parent, node);
	    }
	    else if (node !== this.current) {
	        this.transforms.replaceChild(this.parent, node, this.current);
	    }
	    this.current = node.nextSibling;
	};

	Patcher.prototype.end = function (data) {
	    deleteChildren(this.transforms, this.parent, this.current);
	    this.parent = null;
	};


/***/ }),
/* 7 */
/***/ (function(module, exports) {

	/**
	 * DOM mutation procedures called by the patcher. This module provides
	 * a cleaner API for our purposes and a place to intercept and
	 * monitor mutations during testing.
	 */

	exports.insertTextNode = function (parent, before, str) {
	    var node = document.createTextNode(str);
	    parent.insertBefore(node, before);
	    return node;
	};

	exports.replaceText = function (node, str) {
	    node.textContent = str;
	    return node;
	};

	exports.replaceChild = function (parent, node, old) {
	    parent.replaceChild(node, old);
	    return node;
	};

	exports.appendChild = function (parent, node) {
	    parent.appendChild(node);
	    return node;
	};

	exports.insertElement = function (parent, before, tag) {
	    var node = document.createElement(tag);
	    parent.insertBefore(node, before);
	    return node;
	};

	exports.removeChild = function (parent, node) {
	    parent.removeChild(node);
	    return node;
	};

	exports.setAttribute = function (node, name, value) {
	    switch (name) {
	        case 'checked':
	            node.checked = true;
	            break;
	        case 'selected':
	            node.selected = true;
	            break;
	        case 'value':
	            node.value = value;
	            break;
	        case 'autofocus':
	            node.focus();
	            break;
	    }
	    node.setAttribute(name, value);
	    return node;
	};

	exports.removeAttribute = function (node, name) {
	    switch (name) {
	        case 'checked':
	            node.checked = false;
	            break;
	        case 'selected':
	            node.selected = false;
	            break;
	        case 'value':
	            node.value = '';
	            break;
	        case 'autofocus':
	            node.blur();
	            break;
	    }
	    node.removeAttribute(name);
	    return node;
	};

	exports.addEventListener = function (node, name, handler) {
	    node.addEventListener(name, handler, false);
	    return node;
	};

	exports.removeEventListener = function (node, name, handler) {
	    node.removeEventListener(name, handler);
	    return node;
	};


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	function Set() {
	    this.values = [];
	}

	Set.prototype.add = function (x) {
	    this.values.push(x);
	};

	Set.prototype.has = function (x) {
	    return this.values.indexOf(x) !== -1;
	};

	// use built in Set() if available
	module.exports = window.Set || Set;


/***/ })
/******/ ]);