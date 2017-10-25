suite('Patch', function () {

    var assert = chai.assert;
    
    function createTemplateNode(src) {
        var el = document.getElementById('test-templates');
        if (!el) {
            el = document.createElement('div');
            document.body.appendChild(el);
            el.id = 'test-templates';
            el.style = 'display: none;';
        }
        el.innerHTML = src;
        return compile.eval(el);
    }

    function child(node /*...*/) {
        for (var i = 1; i < arguments.length; i++) {
            node = node.childNodes[arguments[i]];
        }
        return node;
    }

    function click(el){
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */,
            true /* cancelable */,
            window,
            null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/,
            null
        );
        el.dispatchEvent(ev);
    }

    var transform_log = [];
    var test_transforms = {};
    Object.keys(transforms).forEach(function (k) {
        var f = transforms[k];
        test_transforms[k] = function () {
            transform_log.push(k);
            return f.apply(this, arguments);
        };
    });

    var patcher = new patch.Patcher(test_transforms);

    function makeElement(html) {
        var el = document.createElement('div');
        el.innerHTML = html;
        return el.childNodes[0];
    };

    test('flat children', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<i>asdf</i>' +
                '<em>baz</em>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>foo</i>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '</div>');
        transform_log = [];
        var data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<i>foo</i><b>bar</b><em>baz</em>');
        assert.deepEqual(transform_log, [
            'replaceText',
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('nested children', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<i>foo</i>' +
                '<p>' +
                '<em>qux</em>' +
                '</p>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>foo</i>' +
                '<p>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '</p>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<i>foo</i><p><b>bar</b><em>baz</em></p>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'replaceText'
        ]);
    });

    test('single span vs div', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<span>Hello</span>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>Hello</b>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b>Hello</b>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'removeChild'
        ]);
    });

    test('comment nodes in DOM', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<!-- comment -->' +
                '<span>Hello</span>' +
                '<!-- comment2 -->' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>Hello</b>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b>Hello</b>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'removeChild',
            'removeChild',
            'removeChild'
        ]);
    });

    test('same outer element, different inner', function () {
        var div = makeElement(
            '<div data-bind="foo"><div><b>Hello</b></div></div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<div><i>Hello</i></div>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<div><i>Hello</i></div>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'removeChild'
        ]);
    });

    test('different inner text', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>Hello</b>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>Hi</b>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b>Hi</b>');
        assert.deepEqual(transform_log, [
            'replaceText'
        ]);
    });

    test('different element class', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b class="one">Hello</b>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b class="two">Hello</b>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b class="two">Hello</b>');
        assert.deepEqual(transform_log, [
            'setAttribute'
        ]);
    });

    test('remove attributes not rendered', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<a class="btn" href="#" rel="me">test</a>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<a href="http://example.com">test</a>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<a href="http://example.com">test</a>');
        assert.deepEqual(transform_log, [
            'setAttribute',
            'removeAttribute',
            'removeAttribute'
        ]);
    });

    test('managing attributes across multiple renders', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<a class="btn" href="#" rel="me">test</a>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<a data-if="me" class="btn" href="#" rel="me">test</a>' +
                '<a data-unless="me" class="btn" href="#">test</a>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {me: true});
        assert.equal(
            div.innerHTML,
            '<a class="btn" href="#" rel="me">test</a>'
        );
        assert.deepEqual(transform_log, [
        ]);
        transform_log = [];
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {me: false});
        assert.equal(
            div.innerHTML,
            '<a class="btn" href="#">test</a>'
        );
        assert.deepEqual(transform_log, [
            'removeAttribute'
        ]);
    });

    test('same DOM means no change', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b class="one">test</b>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b class="one">{{name}}</b>' +
                '</div>'
        );
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {name: 'test'});
        assert.equal(div.innerHTML, '<b class="one">test</b>');
        assert.deepEqual(transform_log, [
        ]);
    });

    test('multiple siblings', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>one</b>' +
                '<i>two</i>' +
                '<em>three</em>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>one</b>' +
                '<i class="test">two</i>' +
                '<em>three</em>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(
            div.innerHTML,
            '<b>one</b><i class="test">two</i><em>three</em>'
        );
        assert.deepEqual(transform_log, [
            'setAttribute'
        ]);
    });

    test('append sibling', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>one</b>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>one</b>' +
                '<i>two</i>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b>one</b><i>two</i>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('remove sibling from end', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>one</b>' +
                '<i>two</i>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>one</b>' +
                '</div>');
        
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b>one</b>');
        assert.deepEqual(transform_log, [
            'removeChild'
        ]);
    });
 
    test('replace node, keep sibling', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>one</b>' +
                '<b>two</b>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>one</i>' +
                '<b>two</b>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<i>one</i><b>two</b>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'replaceText',
            'removeChild'
        ]);
    });

    test('replace all siblings', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>one</b>' +
                '<b>two</b>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>one</i>' +
                '<i>two</i>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<i>one</i><i>two</i>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'insertElement',
            'insertTextNode',
            'removeChild',
            'removeChild'
        ]);
    });

    test('insert middle sibling', function () {
        var div = makeElement(
            '<div data-bind="foo">' +
                '<b>one</b>' +
                '<em>three</em>' +
                '</div>'
        );
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<b>one</b>' +
                '<i>two</i>' +
                '<em>three</em>' +
                '</div>');
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {};
        patcher.render(templates, 'foo', data);
        assert.equal(div.innerHTML, '<b>one</b><i>two</i><em>three</em>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('remove sibling with keys', function () {
        var div = makeElement(
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var templates = createTemplateNode(
            '<ul data-template="foo">' +
                '<li data-each="item in items" data-key="{{item.id}}">' +
                '{{item.id}}' +
                '</li>' +
                '</ul>');
        var data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', data);
        // second render using keys
        transform_log = [];
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            items: [
                data.items[1],
                data.items[2]
            ]
        });
        assert.equal(
            div.outerHTML,
            '<ul data-bind="foo">' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        window.div = div;
        assert.deepEqual(transform_log, [
            'replaceChild'
        ]);
    });

    test('re-order siblings with keys', function () {
        var div = makeElement(
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var templates = createTemplateNode(
            '<ul data-template="foo">' +
                '<li data-each="item in items" data-key="{{item.id}}">' +
                '{{item.id}}' +
                '</li>' +
                '</ul>');
        var data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', data);
        // second render using keys
        transform_log = [];
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            items: [
                data.items[2],
                data.items[0],
                data.items[1]
            ]
        });
        assert.equal(
            div.outerHTML,
            '<ul data-bind="foo">' +
              '<li>three</li>' +
              '<li>one</li>' +
              '<li>two</li>' +
            '</ul>'
        );
        window.div = div;
        assert.deepEqual(transform_log, [
            'replaceChild',
            'replaceChild',
            'appendChild'
        ]);
    });

    test('prepend sibling with keys', function () {
        var div = makeElement(
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var templates = createTemplateNode(
            '<ul data-template="foo">' +
                '<li data-each="item in items" data-key="{{item.id}}">' +
                '{{item.id}}' +
                '</li>' +
                '</ul>');
        var data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', data);
        // second render using keys
        transform_log = [];
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            items: [
                {id: 'zero'},
                data.items[0],
                data.items[1],
                data.items[2]
            ]
        });
        assert.equal(
            div.outerHTML,
            '<ul data-bind="foo">' +
              '<li>zero</li>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        window.div = div;
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('append sibling with keys', function () {
        var div = makeElement(
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var templates = createTemplateNode(
            '<ul data-template="foo">' +
                '<li data-each="item in items" data-key="{{item.id}}">' +
                '{{item.id}}' +
                '</li>' +
                '</ul>');
        var data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', data);
        // second render using keys
        transform_log = [];
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            items: [
                data.items[0],
                data.items[1],
                data.items[2],
                {id: 'four'}
            ]
        });
        assert.equal(
            div.outerHTML,
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
              '<li>four</li>' +
            '</ul>'
        );
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('insert middle sibling with keys', function () {
        var div = makeElement(
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var templates = createTemplateNode(
            '<ul data-template="foo">' +
                '<li data-each="item in items" data-key="{{item.id}}">' +
                '{{item.id}}' +
                '</li>' +
                '</ul>');
        var data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', data);
        // second render using keys
        transform_log = [];
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            items: [
                data.items[0],
                data.items[1],
                {id: '2.5'},
                data.items[2]
            ]
        });
        assert.equal(
            div.outerHTML,
            '<ul data-bind="foo">' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>2.5</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('escaped var', function () {
        var div = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<span>Hello, {{name}}!</span>' +
                '</div>');
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            name: 'world'
        });
        assert.equal(div.childNodes[0].innerHTML, 'Hello, world!');
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            name: '<script>alert("bad stuff");</script>'
        });
        assert.equal(
            div.childNodes[0].innerHTML,
            'Hello, &lt;script&gt;alert("bad stuff");&lt;/script&gt;!'
        );
    });

    test('escaped var with whitespace', function () {
        var div = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<span>Hello, {{ name }}!</span>' +
                '</div>');
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            name: 'world'
        });
        assert.equal(div.childNodes[0].innerHTML, 'Hello, world!');
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            name: '<script>alert("bad stuff");</script>'
        });
        assert.equal(
            div.childNodes[0].innerHTML,
            'Hello, &lt;script&gt;alert("bad stuff");&lt;/script&gt;!'
        );
    });

    test('escaped attribute', function () {
        var div = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<span class="{{type}}">foo</span>' +
                '</div>');
        var patcher = new patch.Patcher(div, test_transforms);
        var data = {type: 'test" onclick="throw new Error(\'fail\');'};
        patcher.render(templates, 'foo', data);
        assert.equal(
            div.childNodes[0].className,
            'test" onclick="throw new Error(\'fail\');'
        );
        assert.equal(
            div.innerHTML,
            '<span class="test&quot; onclick=&quot;throw new Error(\'fail\');">foo</span>'
        );
        // this should not trigger an error
        click(div.childNodes[0]);
    });

    // test('patch using body from render of complete html document', function () {
    //     var div = makeElement('<h1>Foo</h1>');
    //     createTemplateNode('app',
    //                        '<html>' +
    //                          '<head>' +
    //                            '<link rel="preload" href=".">' +
    //                          '</head>' +
    //                          '<body>' +
    //                            '<h1>Bar</h1>' +
    //                          '</body>' +
    //                        '</html>');
    //     var prev_data = {};
    //     var next_data = {};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
    //     var renderer = new render.Renderer(patcher, bound);
    //     renderer.render('app', next_data, prev_data);
    //     assert.equal(child(div, 0).tagName, 'H1');
    //     assert.equal(child(div, 0).textContent, 'Bar');
    //     assert.equal(div.childNodes.length, 1);
    // });

    // test('patch using body from render of complete html document (with doctype + whitespace)', function () {
    //     var div = makeElement('<h1>Foo</h1>');
    //     createTemplateNode('app',
    //                        '<!DOCTYPE html>\n' +
    //                        '<html>\n' +
    //                        '  <head>\n' +
    //                        '    <link rel="preload" href=".">\n' +
    //                        '  </head>\n' +
    //                        '  <body>\n' +
    //                        '    <p>Test</p>\n' +
    //                        '    <h1>Bar</h1>\n' +
    //                        '  </body>\n' +
    //                        '</html>\n');
    //     var prev_data = {};
    //     var next_data = {};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
    //     var renderer = new render.Renderer(patcher, bound);
    //     renderer.render('app', next_data, prev_data);
    //     assert.equal(child(div, 3).tagName, 'H1');
    //     assert.equal(child(div, 3).textContent, 'Bar');
    //     assert.equal(div.childNodes.length, 5);
    // });

    // test('collapse adjacent text nodes', function () {
    //     var div = makeElement(
    //         '<ul>\n  \n    <li>Foo</li>\n    <li>Bar</li>\n  \n</ul>\n'
    //     );
    //     createTemplateNode('item',
    //                        '<span data-if="name">\n' +
    //                        '  {{name}}\n' +
    //                        '</span>\n');
    //     createTemplateNode('app',
    //                        '<ul>\n' +
    //                        '  <li data-each="item in items">\n' +
    //                        '    <template-call template="item" name="item.name">\n' +
    //                        '  </li>' +
    //                        '</ul>\n');
    //     var prev_data = {};
    //     var next_data = {items: [{name: 'Foo'}, {name: 'Bar'}]};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
    //     var renderer = new render.Renderer(patcher, bound);
    //     renderer.render('app', next_data, prev_data);
    //     assert.equal(child(div, 0).tagName, 'UL');
    //     assert.equal(child(div, 0, 1).tagName, 'LI');
    //     assert.equal(child(div, 0, 1, 1).tagName, 'SPAN');
    //     assert.equal(child(div, 0, 1, 1).textContent, 'Foo');
    //     assert.equal(child(div, 0, 3).tagName, 'LI');
    //     assert.equal(child(div, 0, 3, 0).tagName, 'SPAN');
    //     assert.equal(child(div, 0, 3, 0).textContent, 'Bar');
    //     assert.equal(div.children.length, 1);
    //     assert.equal(child(div, 0).children.length, 2);
    //     assert.equal(child(div, 0, 0).childNodes.length, 3);
    //     assert.equal(child(div, 0, 0, 0).childNodes.length, 3);
    // });

    test('checked property using template conditional', function () {
        var div = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input data-if="complete" type="checkbox" checked />' +
                '<input data-unless="complete" type="checkbox" />' +
                '</div>');
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            complete: false
        });
        assert.strictEqual(child(div, 0).checked, false, 'one');
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            complete: true
        });
        assert.strictEqual(child(div, 0).checked, true, 'two');
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            complete: false
        });
        assert.strictEqual(child(div, 0).checked, false, 'three');
    });

    test('value property', function () {
        var div = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" value="{{message}}" />' +
                '</div>');
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            message: ''
        });
        assert.strictEqual(child(div, 0).value, "");
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            message: 'testing'
        });
        assert.strictEqual(child(div, 0).value, "testing");
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            message: 'asdf'
        });
        assert.strictEqual(child(div, 0).value, "asdf");
    });

    // test('autofocus on conditional causes focus', function () {
    //     var div = document.createElement('div');
    //     var tmpl = createTemplateNode('app',
    //                        '<input data-if="active" type="text" autofocus />' +
    //                        '<input data-unless="active" type="text" rel="test" />');
    //     // need to place this in the body so it can receive focus
    //     document.body.appendChild(div);
    //     var prev_data = {};
    //     var next_data = {};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
    //     var state = {
    //         patcher: patcher,
    //         bound_template: bound,
    //         text_buffer: ''
    //     };
    //     tmpl.content.render(state, next_data, prev_data);
    //     assert.notEqual(document.activeElement, child(div, 0));
    //     prev_data = next_data;
    //     next_data = {active: true};
    //     tmpl.content.render(state, next_data, prev_data);
    //     assert.equal(document.activeElement, child(div, 0));
    //     prev_data = next_data;
    //     next_data = {active: false};
    //     tmpl.content.render(state, next_data, prev_data);
    //     assert.notEqual(document.activeElement, child(div, 0));
    //     document.body.removeChild(div);
    // });

    // test("don't remove attributes on container", function () {
    //     var div = document.createElement('div');
    //     div.setAttribute('id', 'testing');
    //     var calls = [];
    //     div.addEventListener('click', function () {
    //         calls.push('click');
    //     });
    //     var templates = createTemplateNode(
    //         '<div data-template="foo">' +
    //             '<b>test</b>' +
    //             '</div>');
    //     var bound = templates['foo'].bind({
    //         data: {},
    //         patcher: new patch.Patcher(div, test_transforms)
    //     });
    //     assert.strictEqual(div.getAttribute('id'), 'testing', 'id not removed');
    //     click(div);
    //     assert.deepEqual(calls, ['click'], 'event handler not removed');
    // });

    // test("don't destroy external changes inside #skip tags", function () {
    //     var div = document.createElement('div');
    //     var div2 = document.createElement('div');
    //     var templates = Magery.loadTemplates(
    //         '{{#define app}}' +
    //           '<div id="container">' +
    //             '{{#skip}}' +
    //               '<div id="unmanaged">{{name}}</div>' +
    //             '{{/skip}}' +
    //             '<div id="managed">{{name}}</div>' +
    //           '</div>' +
    //         '{{/define}}'
    //     );
    //     var prev_data = {};
    //     var next_data = {name: 'test'};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var renderer = new render.Renderer(patcher, templates, true);
    //     renderer.render('app', next_data, prev_data);
    //     div2.innerHTML = 
    //         '<div id="container">' +
    //           '<div id="unmanaged">test</div>' +
    //           '<div id="managed">test</div>' +
    //         '</div>';
    //     assert.ok(div.isEqualNode(div2));
    //     prev_data = next_data;
    //     next_data = {name: 'foo'};
    //     renderer.render('app', next_data, prev_data);
    //     div2.innerHTML =
    //         '<div id="container">' +
    //           '<div id="unmanaged">test</div>' +
    //           '<div id="managed">foo</div>' +
    //         '</div>';
    //     assert.ok(div.isEqualNode(div2));
    //     div.childNodes[0].childNodes[0].innerHTML = '<span>foo</span><span>bar</span>';
    //     div.childNodes[0].childNodes[0].setAttribute('data-test', '123');
    //     prev_data = next_data;
    //     next_data = {name: 'foo'};
    //     renderer.render('app', next_data, prev_data);
    //     div2.innerHTML =
    //         '<div id="container">' +
    //           '<div data-test="123" id="unmanaged">' +
    //             '<span>foo</span>' +
    //             '<span>bar</span>' +
    //           '</div>' +
    //           '<div id="managed">foo</div>' +
    //         '</div>';
    //     assert.ok(div.isEqualNode(div2));
    // });

    test('textarea text nodes set as value', function () {
        var div = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<textarea><b>Hello, {{name}}!</b></textarea>' +
                '</div>');
        var patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            name: 'world'
        });
        assert.strictEqual(child(div, 0).value, "<b>Hello, world!</b>");
        patcher = new patch.Patcher(div, test_transforms);
        patcher.render(templates, 'foo', {
            name: 'testing'
        });
        assert.strictEqual(child(div, 0).value, "<b>Hello, testing!</b>");
    });
    
});
