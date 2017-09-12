suite('compile', function () {

    var assert = chai.assert;

    function test_patcher(calls) {
        return {
            reset: function () {
                // calls.push(['reset']);
            },
            enterTag: function (tag, key) {
                calls.push(['enterTag', tag, key]);
            },
            attribute: function (name, value) {
                calls.push(['attribute', name, value]);
            },
            text: function (text) {
                calls.push(['text', text]);
            },
            exitTag: function () {
                calls.push(['exitTag']);
            },
            skip: function (tag, key) {
                calls.push(['skip', tag, key]);
            }
        };
    }

    function patch(templates, name, next_data, prev_data) {
        var calls = [];
        var bound = new Magery.BoundTemplate(templates[name], {
            patcher: test_patcher(calls),
            data: next_data
        });
        bound.update();
        return calls;
    }

    function createTemplateNode(src) {
        var el = document.getElementById('test-templates');
        if (!el) {
            el = document.createElement('template');
            document.body.appendChild(el);
            el.id = 'test-templates';
        }
        el.innerHTML = src;
        return Magery.compileTemplates(el);
    }

    // test('updateActiveData', function () {
    //     var context = context.toContext({
    //         foo: {
    //             bar: 123,
    //             baz: 456
    //         },
    //         article: {
    //             author: {
    //                 id: 1,
    //                 name: 'test'
    //             },
    //             title: 'foo'
    //         }
    //     });
    //     var active_data = {};
    //     updateActiveData(
    //         active_data,
    //         ['foo', 'bar'],
    //         context.foo.bar,
    //         context
    //     );
    //     assert.deepEqual(active_data, {foo: {bar: 123}});
    //     updateActiveData(
    //         active_data,
    //         ['foo', 'baz'],
    //         context.foo.baz,
    //         context
    //     );
    //     assert.deepEqual(active_data, {foo: context.foo});
    //     updateActiveData(
    //         active_data,
    //         ['article', 'author', 'id'],
    //         context.article.author.id,
    //         context
    //     );
    //     assert.deepEqual(active_data, {
    //         foo: context.foo,
    //         article: {
    //             author: {
    //                 id: 1
    //             }
    //         }
    //     });
    // });

    test('flat children', function () {
        var templates = createTemplateNode(
            '<div data-template="app">' +
                '<i>foo</i>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'app', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'app']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'bar']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'baz']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('nested children', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>foo</i>\n' +
                '<p>\n' +
                '  <b>bar</b>\n' +
                '  <em>baz</em>\n' +
                '</p>\n' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['text', '\n']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[7], ['text', '\n  ']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'bar']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['text', '\n  ']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[13], ['text', 'baz']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['text', '\n']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['text', '\n']);
        assert.deepEqual(patcher_calls[18], ['exitTag']);
        assert.equal(patcher_calls.length, 19);
    });

    test('variable substitution - text', function () {
        var templates = createTemplateNode('<i data-template="foo">Hello, {{name}}!</i>');
        var prev_data = {};
        var next_data = {name: 'world'};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - array', function () {
        var templates = createTemplateNode('<div data-template="foo">{{names}}</div>');
        var prev_data = {};
        var next_data = {names: ['foo', 'bar', 'baz']};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'foo,bar,baz']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - undefined', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - null', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var prev_data = {};
        var next_data = {name: null};
        var changes = true;
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - true', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var prev_data = {};
        var next_data = {name: true};
        var changes = true;
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, true']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - false', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var prev_data = {};
        var next_data = {name: false};
        var changes = true;
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, false']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - object', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var prev_data = {};
        var next_data = {name: {first: 'a', last: 'b'}};
        var changes = true;
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, [object Object]']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - length property', function () {
        var templates = createTemplateNode('<div data-template="foo">Total: {{ items.length }}</div>');
        var prev_data = {};
        var next_data = {items: ['a', 'b', 'c']};
        var changes = true;
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Total: 3']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    // test('with block, variable substitution', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '{{#with user}}' +
    //                 '<i>Hello, {{name}}!</i>' +
    //               '{{/with}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {user: {name: 'world'}};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test('nested with blocks, flat output', function () {
    //     var src = '' +
    //     '{{#define foo}}' +
    //         '<i>foo</i>' +
    //         '{{#with author}}' +
    //             '<b>bar</b>' +
    //             '<em>baz</em>' +
    //             '{{#with profile}}' +
    //                 '<p>test</p>' +
    //             '{{/with}}' +
    //         '{{/with}}' +
    //         '<strong>other</strong>' +
    //     '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {author: {profile: {}}};
    //     var next_data = {author: {profile: {}}};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'foo']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[5], ['text', 'bar']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['enterTag', 'EM', null]);
    //     assert.deepEqual(patcher_calls[8], ['text', 'baz']);
    //     assert.deepEqual(patcher_calls[9], ['exitTag']);
    //     assert.deepEqual(patcher_calls[10], ['enterTag', 'P', null]);
    //     assert.deepEqual(patcher_calls[11], ['text', 'test']);
    //     assert.deepEqual(patcher_calls[12], ['exitTag']);
    //     assert.deepEqual(patcher_calls[13], ['enterTag', 'STRONG', null]);
    //     assert.deepEqual(patcher_calls[14], ['text', 'other']);
    //     assert.deepEqual(patcher_calls[15], ['exitTag']);
    //     assert.deepEqual(patcher_calls[16], ['end']);
    //     assert.equal(patcher_calls.length, 17);
    // });

    // test('nested with blocks, skip identical contexts', function () {
    //     var src = '' +
    //     '{{#define foo}}' +
    //         '<i>foo</i>' +
    //         '{{#with author}}' +
    //             '<b>bar</b>' +
    //             '<em>baz</em>' +
    //         '{{/with}}' +
    //         '{{#with article}}' +
    //             '<p>test</p>' +
    //         '{{/with}}' +
    //     '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {author: 'name', article: 'foo'};
    //     var next_data = {author: 'name', article: 'bar'};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'foo']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['skip', 'B', null]);
    //     assert.deepEqual(patcher_calls[5], ['skip', 'EM', null]);
    //     assert.deepEqual(patcher_calls[6], ['enterTag', 'P', null]);
    //     assert.deepEqual(patcher_calls[7], ['text', 'test']);
    //     assert.deepEqual(patcher_calls[8], ['exitTag']);
    //     assert.deepEqual(patcher_calls[9], ['end']);
    //     assert.equal(patcher_calls.length, 10);
    // });

    test('data-each', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<section data-each="item in items">item</section>' +
                '</div>'
        );
        var prev_data = {};
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'item']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'item']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[12], ['text', 'item']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });

    // test('template-each with multiple child nodes', function () {
    //     createTemplateNode('foo',
    //                        '<h1>title</h1>' +
    //                        '<template-each name="item" in="items">' +
    //                          '<section>item</section>' +
    //                          '<div>separator</div>' +
    //                        '</template-each>' +
    //                        '<p>footer</p>');
    //     var prev_data = {};
    //     var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
    //     var changes = true;
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'SECTION', null]);
    //     assert.deepEqual(patcher_calls[5], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[8], ['text', 'separator']);
    //     assert.deepEqual(patcher_calls[9], ['exitTag']);
    //     assert.deepEqual(patcher_calls[10], ['enterTag', 'SECTION', null]);
    //     assert.deepEqual(patcher_calls[11], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[12], ['exitTag']);
    //     assert.deepEqual(patcher_calls[13], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[14], ['text', 'separator']);
    //     assert.deepEqual(patcher_calls[15], ['exitTag']);
    //     assert.deepEqual(patcher_calls[16], ['enterTag', 'SECTION', null]);
    //     assert.deepEqual(patcher_calls[17], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[18], ['exitTag']);
    //     assert.deepEqual(patcher_calls[19], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[20], ['text', 'separator']);
    //     assert.deepEqual(patcher_calls[21], ['exitTag']);
    //     assert.deepEqual(patcher_calls[22], ['enterTag', 'P', null]);
    //     assert.deepEqual(patcher_calls[23], ['text', 'footer']);
    //     assert.deepEqual(patcher_calls[24], ['exitTag']);
    //     assert.deepEqual(patcher_calls[25], ['end']);
    //     assert.equal(patcher_calls.length, 26);
    // });

    test('data-each introduces new context variable', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<ul>' +
                '<li data-each="item in items">' +
                '{{item.name}}' +
                '</li>' +
                '</ul>' +
                '</div>');
        var prev_data = {};
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'one']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'two']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[13], ['text', 'three']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('data-each with data-key', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<section data-each="item in items" data-key="{{item.name}}">' +
                'item' +
                '</section>' +
                '<p>footer</p>' +
                '</div>');
        var prev_data = {};
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SECTION', 'one']);
        assert.deepEqual(patcher_calls[6], ['text', 'item']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SECTION', 'two']);
        assert.deepEqual(patcher_calls[9], ['text', 'item']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'SECTION', 'three']);
        assert.deepEqual(patcher_calls[12], ['text', 'item']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[15], ['text', 'footer']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.equal(patcher_calls.length, 18);
    });

    // test('template-each skips keys with no changes', function () {
    //     createTemplateNode('foo',
    //                        '<h1>title</h1>' +
    //                        '<ul>' +
    //                          '<template-each name="item" in="items" key="name">' +
    //                            '<li>{{item.name}}</li>' +
    //                          '</template-each>' +
    //                        '</ul>');
    //     var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
    //     var changes = true;

    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher);
    //     renderer.render('foo', data, changes);

    //     data = {items: [
    //         data.items[2],
    //         data.items[0],
    //         data.items[1]
    //     ]};
    //     changes = {items: {}};
        
    //     patcher_calls = [];
    //     renderer.render('foo', data, changes);

    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'UL', null]);
    //     assert.deepEqual(patcher_calls[5], ['skip', 'LI', '3/three/0']);
    //     assert.deepEqual(patcher_calls[6], ['skip', 'LI', '3/one/0']);
    //     assert.deepEqual(patcher_calls[7], ['skip', 'LI', '3/two/0']);
    //     assert.deepEqual(patcher_calls[8], ['exitTag']);
    //     assert.deepEqual(patcher_calls[9], ['end']);
    //     assert.equal(patcher_calls.length, 10);
    // });

    // test('template-each block siblings should avoid conflicting keys', function () {
    //     createTemplateNode('foo',
    //                        '<template-each name="item" in="items" key="id">' +
    //                          '<li>{{item.name}}</li>' +
    //                        '</template-each>' +
    //                        '<template-each name="item" in="items2" key="id">' +
    //                          '<li>{{item.name}}</li>' +
    //                        '</template-each>');

    //     var prev_data = {};
    //     var next_data = {
    //         items: [
    //             {id: 'one', name: '1.1'},
    //             {id: 'two', name: '1.2'}
    //         ],
    //         items2: [
    //             {id: 'one', name: '2.1'},
    //             {id: 'two', name: '2.2'}
    //         ]
    //     };

    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher);
    //     renderer.render('foo', next_data, prev_data);

    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'LI', '4/one/0']);
    //     assert.deepEqual(patcher_calls[2], ['text', '1.1']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'LI', '4/two/0']);
    //     assert.deepEqual(patcher_calls[5], ['text', '1.2']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['enterTag', 'LI', '5/one/0']);
    //     assert.deepEqual(patcher_calls[8], ['text', '2.1']);
    //     assert.deepEqual(patcher_calls[9], ['exitTag']);
    //     assert.deepEqual(patcher_calls[10], ['enterTag', 'LI', '5/two/0']);
    //     assert.deepEqual(patcher_calls[11], ['text', '2.2']);
    //     assert.deepEqual(patcher_calls[12], ['exitTag']);
    //     assert.deepEqual(patcher_calls[13], ['end']);
    //     assert.equal(patcher_calls.length, 14);
    // });

    test('data-if', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        var next_data = {published: true};
        var prev_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
        prev_data = next_data;
        next_data = {published: false};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
        // empty array is falsy
        next_data = {published: []};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
        // empty string is falsy
        next_data = {published: ''};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
        // zero is falsy
        next_data = {published: 0};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
        // undefined is falsy
        next_data = {};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    test('data-unless', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">published</b>' +
                '</div>');
        var next_data = {published: true};
        var prev_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
        prev_data = next_data;
        next_data = {published: false};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
        // empty array is falsy
        prev_data = next_data;
        next_data = {published: []};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
        // empty string is falsy
        prev_data = next_data;
        next_data = {published: ''};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
        // zero is falsy
        prev_data = next_data;
        next_data = {published: 0};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
        // undefined is falsy
        prev_data = next_data;
        next_data = {};
        patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });

    test('call another template block statically', function () {
        var templates = createTemplateNode(
            '<b data-template="bar">{{meta.year}}</b>' +
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar meta="article.meta"></bar>' +
            '</div>');
        var prev_data = {};
        var next_data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['text', '2015']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.equal(patcher_calls.length, 10);
    });

    // test('call another template block dynamically', function () {
    //     var templates = createTemplateNode(
    //         '<b data-template="bar">{{meta.year}}</b>' +
    //             '<div data-template="foo">' +
    //             '<h1>title</h1>' +
    //             '<template-call template="{{article.mytemplate}}" meta="article.meta"></template-call>' +
    //             '</div>');
    //     var prev_data = {};
    //     var next_data = {
    //         article: {
    //             mytemplate: 'bar',
    //             meta: {
    //                 year: 2015
    //             }
    //         }
    //     };
    //     var patcher_calls = patch(templates, 'foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[5], ['text', '2015']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['exitTag']);
    //     assert.equal(patcher_calls.length, 8);
    // });

    test('call another template block with child expansion', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar article="article">' +
                '<i>inner</i>' +
                '</bar>' +
                '</div>' +
                '<div data-template="bar">' +
                '<b>{{article.title}}</b>' +
                '<template-children />' +
                '</div>');
        var prev_data = {};
        var next_data = {
            article: {
                title: 'test',
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'test']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[11], ['text', 'inner']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });

    // test('call another template block dynamically with child expansion', function () {
    //     var templates = createTemplateNode(
    //         '<div data-template="foo">' +
    //             '<h1>title</h1>' +
    //             '<template-call template="{{mytemplate}}" article="article">' +
    //             '<i>inner</i>' +
    //             '</template-call>' +
    //             '</div>' +
    //             '<div data-template="bar">' +
    //             '<b>{{article.title}}</b>' +
    //             '<template-children></template-children>' +
    //             '</div>'
    //     );
    //     var prev_data = {};
    //     var next_data = {
    //         mytemplate: 'bar',
    //         article: {
    //             title: 'test',
    //             meta: {
    //                 year: 2015
    //             }
    //         }
    //     };
    //     var patcher_calls = patch(templates, 'foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[6], ['text', 'test']);
    //     assert.deepEqual(patcher_calls[7], ['exitTag']);
    //     assert.deepEqual(patcher_calls[8], ['enterTag', 'I', null]);
    //     assert.deepEqual(patcher_calls[9], ['text', 'inner']);
    //     assert.deepEqual(patcher_calls[10], ['exitTag']);
    //     assert.deepEqual(patcher_calls[11], ['exitTag']);
    //     assert.deepEqual(patcher_calls[12], ['exitTag']);
    //     assert.equal(patcher_calls.length, 13);
    // });

    test('nested expansions', function () {
        var templates = createTemplateNode(
            '<div data-template="root">' +
                '<one article="article">' +
                '<i>root</i>' +
                '</one>' +
                '</div>' +
                
                '<div data-template="one">' +
                '<h1>title</h1>' +
                '<two meta="article.meta">' +
                '<i>one.1</i>' +
                '<three>' +
                '<i>one.2</i>' +
                '<template-children></template-children>' +
                '</three>' +
                '</two>' +
                '</div>' +

                '<div data-template="two">' +
                '<b>{{meta.year}}</b>' +
                '<template-children></template-children>' +
                '</div>' +
                
                '<div data-template="three">' +
                '<b>three</b>' +
                '<template-children></template-children>' +
                '</div>');
        var prev_data = {};
        var next_data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = patch(templates, 'root', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'root']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'one']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'title']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[8], ['attribute', 'data-bind', 'two']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[10], ['text', '2015']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[13], ['text', 'one.1']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[16], ['attribute', 'data-bind', 'three']);
        assert.deepEqual(patcher_calls[17], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[18], ['text', 'three']);
        assert.deepEqual(patcher_calls[19], ['exitTag']);
        assert.deepEqual(patcher_calls[20], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[21], ['text', 'one.2']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[24], ['text', 'root']);
        assert.deepEqual(patcher_calls[25], ['exitTag']);
        assert.deepEqual(patcher_calls[26], ['exitTag']);
        assert.deepEqual(patcher_calls[27], ['exitTag']);
        assert.deepEqual(patcher_calls[28], ['exitTag']);
        assert.deepEqual(patcher_calls[29], ['exitTag']);
        assert.equal(patcher_calls.length, 30);
    });

    test('skip comment nodes in template', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>foo</i>' +
                '<!-- this is a comment -->' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '</div>');
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'bar']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'baz']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('node attributes', function () {
        var templates = createTemplateNode(
            '<a data-template="foo" href="#" class="btn">foo</a>'
        );
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'A', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(1, 4).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'data-bind', 'foo'],
            ['attribute', 'href', '#']
        ]);
        assert.deepEqual(patcher_calls[4], ['text', 'foo']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    test('boolean attributes - allowfullscreen', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<iframe allowfullscreen="{{a}}"></iframe>' +
                '<iframe allowfullscreen="{{b}}"></iframe>' +
                '<iframe allowfullscreen="{{c}}"></iframe>' +
                '<iframe allowfullscreen></iframe>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'allowfullscreen', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'allowfullscreen', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - async', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<script src="blank.js" async="{{a}}"></script>' +
                '<script src="blank.js" async="{{b}}"></script>' +
                '<script src="blank.js" async="{{c}}"></script>' +
                '<script src="blank.js" async></script>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'async', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'async', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - autofocus', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" autofocus="{{a}}">' +
                '<input type="text" autofocus="{{b}}">' +
                '<input type="text" autofocus="{{c}}">' +
                '<input type="text" autofocus>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'autofocus', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'autofocus', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - autoplay', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<video autoplay="{{a}}"></video>' +
                '<video autoplay="{{b}}"></video>' +
                '<video autoplay="{{c}}"></video>' +
                '<video autoplay></video>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'autoplay', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'autoplay', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - capture', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="file" capture="{{a}}">' +
                '<input type="file" capture="{{b}}">' +
                '<input type="file" capture="{{c}}">' +
                '<input type="file" capture>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'capture', true],
            ['attribute', 'type', 'file']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'file']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'file']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'capture', true],
            ['attribute', 'type', 'file']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });
    
    test('boolean attributes - checked', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="checkbox" checked="{{a}}">' +
                '<input type="checkbox" checked="{{b}}">' +
                '<input type="checkbox" checked="{{c}}">' +
                '<input type="checkbox" checked>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'checked', true],
            ['attribute', 'type', 'checkbox']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'checkbox']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'checkbox']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'checked', true],
            ['attribute', 'type', 'checkbox']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - controls', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<video controls="{{a}}"></video>' +
                '<video controls="{{b}}"></video>' +
                '<video controls="{{c}}"></video>' +
                '<video controls></video>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'controls', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'controls', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });
    
    test('boolean attributes - default', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<audio><track src="test.vtt" default="{{a}}"></audio>' +
                '<audio><track src="test.vtt" default="{{b}}"></audio>' +
                '<audio><track src="test.vtt" default="{{c}}"></audio>' +
                '<audio><track src="test.vtt" default></audio>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[3], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls.slice(4, 6).sort(), [
            ['attribute', 'default', true],
            ['attribute', 'src', 'test.vtt']
        ]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'src', 'test.vtt']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[14], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls[15], ['attribute', 'src', 'test.vtt']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.deepEqual(patcher_calls[18], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[19], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls.slice(20, 22).sort(), [
            ['attribute', 'default', true],
            ['attribute', 'src', 'test.vtt']
        ]);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.equal(patcher_calls.length, 25);
    });

    test('boolean attributes - defer', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<script src="blank.js" defer="{{a}}"></script>' +
                '<script src="blank.js" defer="{{b}}"></script>' +
                '<script src="blank.js" defer="{{c}}"></script>' +
                '<script src="blank.js" defer></script>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'defer', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'defer', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - disabled', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" disabled="{{a}}">' +
                '<input type="text" disabled="{{b}}">' +
                '<input type="text" disabled="{{c}}">' +
                '<input type="text" disabled>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'disabled', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'disabled', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - formvalidate', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<button formnovalidate="{{a}}">Test</button>' +
                '<button formnovalidate="{{b}}">Test</button>' +
                '<button formnovalidate="{{c}}">Test</button>' +
                '<button formnovalidate>Test</button>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'formnovalidate', true]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'Test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[13], ['attribute', 'formnovalidate', true]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - hidden', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<p hidden="{{a}}">Test</p>' +
                '<p hidden="{{b}}">Test</p>' +
                '<p hidden="{{c}}">Test</p>' +
                '<p hidden>Test</p>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'hidden', true]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'Test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[13], ['attribute', 'hidden', true]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - itemscope', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<div itemscope="{{a}}">Test</div>' +
                '<div itemscope="{{b}}">Test</div>' +
                '<div itemscope="{{c}}">Test</div>' +
                '<div itemscope>Test</div>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'itemscope', true]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'Test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[13], ['attribute', 'itemscope', true]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - loop', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<audio loop="{{a}}"></audio>' +
                '<audio loop="{{b}}"></audio>' +
                '<audio loop="{{c}}"></audio>' +
                '<audio loop></audio>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'loop', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'loop', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - multiple', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<select multiple="{{a}}"></select>' +
                '<select multiple="{{b}}"></select>' +
                '<select multiple="{{c}}"></select>' +
                '<select multiple></select>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'multiple', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'multiple', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - muted', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<video muted="{{a}}"></video>' +
                '<video muted="{{b}}"></video>' +
                '<video muted="{{c}}"></video>' +
                '<video muted></video>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'muted', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'muted', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - novalidate', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<form novalidate="{{a}}"></form>' +
                '<form novalidate="{{b}}"></form>' +
                '<form novalidate="{{c}}"></form>' +
                '<form novalidate></form>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'novalidate', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'novalidate', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - open', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<details open="{{a}}"><summary>Test</summary></details>' +
                '<details open="{{b}}"><summary>Test</summary></details>' +
                '<details open="{{c}}"><summary>Test</summary></details>' +
                '<details open><summary>Test</summary></details>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'open', true]);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'Test']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[14], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[15], ['text', 'Test']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.deepEqual(patcher_calls[18], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[19], ['attribute', 'open', true]);
        assert.deepEqual(patcher_calls[20], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[21], ['text', 'Test']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.equal(patcher_calls.length, 25);
    });

    test('boolean attributes - readonly', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" readonly="{{a}}">' +
                '<input type="text" readonly="{{b}}">' +
                '<input type="text" readonly="{{c}}">' +
                '<input type="text" readonly>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'readonly', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'readonly', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - required', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" required="{{a}}">' +
                '<input type="text" required="{{b}}">' +
                '<input type="text" required="{{c}}">' +
                '<input type="text" required>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'required', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'required', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - reversed', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<ol reversed="{{a}}"></ol>' +
                '<ol reversed="{{b}}"></ol>' +
                '<ol reversed="{{c}}"></ol>' +
                '<ol reversed></ol>' +
            '</div>'
        );
        var prev_data = {};
        var next_data = {
            a: true,
            b: false
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'reversed', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'reversed', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('expand variables in node attributes', function () {
        var templates = createTemplateNode(
            '<a data-template="foo" href="{{url}}" class="btn">foo</a>'
        );
        var prev_data = {};
        var next_data = {url: 'http://example.com'};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'A', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(1, 4).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'data-bind', 'foo'],
            ['attribute', 'href', 'http://example.com']
        ]);
        assert.deepEqual(patcher_calls[4], ['text', 'foo']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    // test('collapse adjacent text nodes', function () {
    //     createTemplateNode('foo', 'Hello, <b>world</b>!');
    //     var tmpl = createTemplateNode('bar',
    //                                   'MESSAGE ' +
    //                                   '<template-call template="foo"></template-call>\n' +
    //                                   'END');
    //     var prev_data = {};
    //     var next_data = {};
    //     var patcher_calls = patch(tmpl, next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['text', 'MESSAGE Hello, ']);
    //     assert.deepEqual(patcher_calls[2], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[3], ['text', 'world']);
    //     assert.deepEqual(patcher_calls[4], ['exitTag']);
    //     assert.deepEqual(patcher_calls[5], ['text', '!\nEND']);
    //     assert.deepEqual(patcher_calls[6], ['end']);
    //     assert.equal(patcher_calls.length, 7);
    // });
    
    test('collapse text nodes around conditional', function () {
        createTemplateNode('foo', 'Hello, <b>world</b>!');
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                'MESSAGE ' +
                '<span data-if="{{nope}}"></span>\n' +
                'END' +
                '</div>');
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'MESSAGE \nEND']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    // test('if block with {{else}}', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '{{#if published}}' +
    //                 '<b>published</b>' +
    //               '{{else}}' +
    //                 '<em>not published</em>' +
    //               '{{/if}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {published: true};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'published']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     prev_data = next_data;
    //     next_data = {published: false};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'not published']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     // else blocks of nested tags should not interfere
    //     src = '' +
    //             '{{#define foo}}' +
    //               '{{#if published}}' +
    //                 '<b>published</b>' +
    //                 '{{#if x}}' +
    //                   '<b>x</b>' +
    //                 '{{else}}' +
    //                   '<b>y</b>' +
    //                 '{{/if}}' +
    //               '{{else}}' +
    //                 '<em>not published</em>' +
    //               '{{/if}}' +
    //             '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     prev_data = {};
    //     next_data = {published: false};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'not published']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test('unless block with {{else}}', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '{{#unless published}}' +
    //                 '<b>not published</b>' +
    //               '{{else}}' +
    //                 '<em>published</em>' +
    //               '{{/unless}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {published: true};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'published']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     prev_data = next_data;
    //     next_data = {published: false};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'not published']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     // else blocks of nested tags should not interfere
    //     src = '' +
    //             '{{#define foo}}' +
    //               '{{#unless published}}' +
    //                 '<b>not published</b>' +
    //                 '{{#if x}}' +
    //                   '<b>x</b>' +
    //                 '{{else}}' +
    //                   '<b>y</b>' +
    //                 '{{/if}}' +
    //               '{{else}}' +
    //                 '<em>published</em>' +
    //               '{{/unless}}' +
    //             '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     prev_data = {};
    //     next_data = {published: true};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'published']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test('each block with {{else}}', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '{{#each items}}' +
    //                 '<div>{{name}}</div>' +
    //               '{{else}}' +
    //                 '<div>empty</div>' +
    //               '{{/each}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {items: [{name: 'a'}, {name: 'b'}]};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'a']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[5], ['text', 'b']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['end']);
    //     assert.equal(patcher_calls.length, 8);
    //     // empty array executes else block
    //     prev_data = next_data;
    //     next_data = {items: []};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'empty']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     // undefined is same as empty array, executes else block
    //     prev_data = next_data;
    //     next_data = {};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'empty']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     // nested else tags should not interfere
    //     src = '' +
    //             '{{#define foo}}' +
    //               '{{#each items}}' +
    //                 '{{#each props}}' +
    //                   '<b>prop</b>' +
    //                 '{{else}}' +
    //                   '<b>no props</b>' +
    //                 '{{/each}}' +
    //               '{{else}}' +
    //                 '<div>empty</div>' +
    //               '{{/each}}' +
    //             '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     prev_data = {};
    //     next_data = {items: []};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'empty']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test('{{else}} tag at unexpected point in tree', function () {
    //     // no associated #if or #each block
    //     var src = '' +
    //             '{{#define foo}}' +
    //             '<p>{{else}}</p>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     assert.throws(function () {
    //         renderer.render('foo', next_data, prev_data);
    //     });
    //     // nested, not at the same level as #if block
    //     src = '' +
    //         '{{#define foo}}' +
    //           '{{#if test}}' +
    //             '<p>foo {{else}} bar</p>' +
    //           '{{/if}}' +
    //         '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     prev_data = {};
    //     next_data = {test: true};
    //     patcher_calls = [];
    //     renderer = new render.Renderer(test_patcher, templates);
    //     assert.throws(function () {
    //         renderer.render('foo', next_data, prev_data);
    //     });
    // });

    // test('reference current context using {{.}}', function () {
    //     // as text node
    //     var src = '{{#define foo}}' +
    //               '{{#with name}}' +
    //                 '<div>{{.}}</div>' +
    //               '{{/with}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     var prev_data = {};
    //     var next_data = {name: 'test'};
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'test']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     // as attribute
    //     src = '{{#define foo}}' +
    //             '<div id="{{.}}"></div>' +
    //           '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     renderer = new render.Renderer(test_patcher, templates);
    //     prev_data = {};
    //     next_data = 'test';
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['attribute', 'id', 'test']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    //     // as positional argument to builtin
    //     src = '{{#define foo}}' +
    //             '{{#each .}}' +
    //               '<div>item</div>' +
    //             '{{/each}}' +
    //           '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     renderer = new render.Renderer(test_patcher, templates);
    //     prev_data = [];
    //     next_data = ['one', 'two'];
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[5], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['end']);
    //     assert.equal(patcher_calls.length, 8);
    //     // as keyword argument to builtin
    //     src = '{{#define foo}}' +
    //             '{{#each . key=.}}' +
    //               '<div>item</div>' +
    //             '{{/each}}' +
    //           '{{/define}}';
    //     templates = Magery.loadTemplates(src);
    //     renderer = new render.Renderer(test_patcher, templates);
    //     prev_data = [];
    //     next_data = ['one', 'two'];
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', '9/one/0']);
    //     assert.deepEqual(patcher_calls[2], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', '9/two/0']);
    //     assert.deepEqual(patcher_calls[5], ['text', 'item']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['end']);
    //     assert.equal(patcher_calls.length, 8);
    // });

    // test('expand unescaped blocks {{{html}}}', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '<div>' +
    //                 '<h1>title</h1>' +
    //                 '{{{body}}}' +
    //                 '<div id="footer"></div>' +
    //               '</div>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     var prev_data = {};
    //     var next_data = {body: '<span>Hello, <b>world</b></span>'};
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[3], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[4], ['exitTag']);
    //     assert.deepEqual(patcher_calls[5], ['enterTag', 'SPAN', null]);
    //     assert.deepEqual(patcher_calls[6], ['text', 'Hello, ']);
    //     assert.deepEqual(patcher_calls[7], ['enterTag', 'B', null]);
    //     assert.deepEqual(patcher_calls[8], ['text', 'world']);
    //     assert.deepEqual(patcher_calls[9], ['exitTag']);
    //     assert.deepEqual(patcher_calls[10], ['exitTag']);
    //     assert.deepEqual(patcher_calls[11], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[12], ['attribute', 'id', 'footer']);
    //     assert.deepEqual(patcher_calls[13], ['exitTag']);
    //     assert.deepEqual(patcher_calls[14], ['exitTag']);
    //     assert.deepEqual(patcher_calls[15], ['end']);
    //     assert.equal(patcher_calls.length, 16);
    //     prev_data = next_data;
    //     next_data = {body: '<em>change</em>'};
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[3], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[4], ['exitTag']);
    //     assert.deepEqual(patcher_calls[5], ['enterTag', 'EM', null]);
    //     assert.deepEqual(patcher_calls[6], ['text', 'change']);
    //     assert.deepEqual(patcher_calls[7], ['exitTag']);
    //     assert.deepEqual(patcher_calls[8], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[9], ['attribute', 'id', 'footer']);
    //     assert.deepEqual(patcher_calls[10], ['exitTag']);
    //     assert.deepEqual(patcher_calls[11], ['exitTag']);
    //     assert.deepEqual(patcher_calls[12], ['end']);
    //     assert.equal(patcher_calls.length, 13);
    // });

    // test('expand unescaped blocks {{{html}}} - coerce to string first', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '<div>' +
    //                 '<h1>title</h1>' +
    //                 '{{{body}}}' +
    //                 '<div id="footer"></div>' +
    //               '</div>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     var prev_data = {};
    //     var next_data = {};
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[3], ['text', 'title']);
    //     assert.deepEqual(patcher_calls[4], ['exitTag']);
    //     assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[6], ['attribute', 'id', 'footer']);
    //     assert.deepEqual(patcher_calls[7], ['exitTag']);
    //     assert.deepEqual(patcher_calls[8], ['exitTag']);
    //     assert.deepEqual(patcher_calls[9], ['end']);
    //     assert.equal(patcher_calls.length, 10);
    // });

    // test('expand unescaped blocks with whitespace {{{ html }}}', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '{{{ body }}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     var prev_data = {};
    //     var next_data = {body: '<span>test</span>'};
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'SPAN', null]);
    //     assert.deepEqual(patcher_calls[2], ['text', 'test']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test("don't expand template tags in {{{html}}} vars", function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '<div>{{{html}}} - {{html}} {{name}}</div>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {html: '<h1 rel="{{name}}">Hello, {{name}}!</h1>', name: 'NAME'};
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
    //     assert.deepEqual(patcher_calls[3], ['attribute', 'rel', '{{name}}']);
    //     assert.deepEqual(patcher_calls[4], ['text', 'Hello, {{name}}!']);
    //     assert.deepEqual(patcher_calls[5], ['exitTag']);
    //     assert.deepEqual(patcher_calls[6], [
    //         'text', ' - <h1 rel="{{name}}">Hello, {{name}}!</h1> NAME'
    //     ]);
    //     assert.deepEqual(patcher_calls[7], ['exitTag']);
    //     assert.deepEqual(patcher_calls[8], ['end']);
    //     assert.equal(patcher_calls.length, 9);
    // });

    // test("skip nodes when {{{html}}} unchanged", function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '{{{html}}}' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var prev_data = {};
    //     var next_data = {
    //         html: '<ul><li>one</li><li>two</li></ul><p>footer</p>'
    //     };
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'UL', null]);
    //     assert.deepEqual(patcher_calls[2], ['enterTag', 'LI', null]);
    //     assert.deepEqual(patcher_calls[3], ['text', 'one']);
    //     assert.deepEqual(patcher_calls[4], ['exitTag']);
    //     assert.deepEqual(patcher_calls[5], ['enterTag', 'LI', null]);
    //     assert.deepEqual(patcher_calls[6], ['text', 'two']);
    //     assert.deepEqual(patcher_calls[7], ['exitTag']);
    //     assert.deepEqual(patcher_calls[8], ['exitTag']);
    //     assert.deepEqual(patcher_calls[9], ['enterTag', 'P', null]);
    //     assert.deepEqual(patcher_calls[10], ['text', 'footer']);
    //     assert.deepEqual(patcher_calls[11], ['exitTag']);
    //     assert.deepEqual(patcher_calls[12], ['end']);
    //     assert.equal(patcher_calls.length, 13);
    //     // next render should skip unchanged nodes
    //     prev_data = next_data;
    //     next_data = {
    //         html: prev_data.html,
    //         foo: 'bar'
    //     };
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['skip', 'UL', null]);
    //     assert.deepEqual(patcher_calls[2], ['skip', 'P', null]);
    //     assert.deepEqual(patcher_calls[3], ['end']);
    //     assert.equal(patcher_calls.length, 4);
    // });

    // test('foo="{{{bar}}}" expands but does not escape from attribute', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '<div data-test="{{{data}}}" />' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     var prev_data = {};
    //     var next_data = {
    //         data: '" onclick="badstuff"'
    //     };
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(
    //         patcher_calls[2],
    //         ['attribute', 'data-test', '" onclick="badstuff"']
    //     );
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test('foo="{{{ bar }}}" with whitespace', function () {
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '<div data-test="{{{ data }}}" />' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var renderer = new render.Renderer(test_patcher, templates);
    //     var prev_data = {};
    //     var next_data = {data: 'test'};
    //     patcher_calls = [];
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['attribute', 'data-test', 'test']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.deepEqual(patcher_calls[4], ['end']);
    //     assert.equal(patcher_calls.length, 5);
    // });

    // test('externally managed blocks via {{#skip}}', function () {
    //     // for libraries that don't play nicely, e.g. maps / charts / ace editor
    //     // content is always skipped over by patcher after first render
    //     var src = '' +
    //             '{{#define foo}}' +
    //               '<div id="container">' +
    //                 '{{#skip}}' +
    //                   '<div id="unmanaged">{{name}}</div>' +
    //                   '<span>test</span>' +
    //                 '{{/skip}}' +
    //                 '<div id="managed">{{name}}</div>' +
    //               '</div>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     // first render recurses into children
    //     var prev_data = {};
    //     var next_data = {name: 'asdf'};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates, true);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['attribute', 'id', 'container']);
    //     assert.deepEqual(patcher_calls[3], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[4], ['attribute', 'id', 'unmanaged']);
    //     assert.deepEqual(patcher_calls[5], ['text', 'asdf']);
    //     assert.deepEqual(patcher_calls[6], ['exitTag']);
    //     assert.deepEqual(patcher_calls[7], ['enterTag', 'SPAN', null]);
    //     assert.deepEqual(patcher_calls[8], ['text', 'test']);
    //     assert.deepEqual(patcher_calls[9], ['exitTag']);
    //     assert.deepEqual(patcher_calls[10], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[11], ['attribute', 'id', 'managed']);
    //     assert.deepEqual(patcher_calls[12], ['text', 'asdf']);
    //     assert.deepEqual(patcher_calls[13], ['exitTag']);
    //     assert.deepEqual(patcher_calls[14], ['exitTag']);
    //     assert.deepEqual(patcher_calls[15], ['end']);
    //     assert.equal(patcher_calls.length, 16);
    //     // subsequent renders skip over elements
    //     prev_data = next_data;
    //     next_data = {name: 'wibble'};
    //     patcher_calls = [];
    //     var renderer = new render.Renderer(test_patcher, templates, false);
    //     renderer.render('foo', next_data, prev_data);
    //     assert.deepEqual(patcher_calls[0], ['start']);
    //     assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[2], ['attribute', 'id', 'container']);
    //     assert.deepEqual(patcher_calls[3], ['skip', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[4], ['skip', 'SPAN', null]);
    //     assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[6], ['attribute', 'id', 'managed']);
    //     assert.deepEqual(patcher_calls[7], ['text', 'wibble']);
    //     assert.deepEqual(patcher_calls[8], ['exitTag']);
    //     assert.deepEqual(patcher_calls[9], ['exitTag']);
    //     assert.deepEqual(patcher_calls[10], ['end']);
    //     assert.equal(patcher_calls.length, 11);
    // });

    test('render missing variables in text block', function () {
        var templates = createTemplateNode(
            '<h1 data-template="foo">Hello, {{user.name}}!</h1>'
        );
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, !']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('render missing variables in text attributes', function () {
        var templates = createTemplateNode(
            '<a data-template="foo" href="{{url}}">link</a>'
        );
        var prev_data = {};
        var next_data = {};
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'A', null]);
        assert.deepEqual(patcher_calls.slice(1, 3), [
            ['attribute', 'data-bind', 'foo'],
            ['attribute', 'href', '']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('template tags inside select element', function () {
        var templates = createTemplateNode(
            '<select data-template="foo">' +
                '<option data-each="opt in options" value="{{opt.value}}">{{opt.label}}</option>' +
                '</select>');
        var prev_data = {};
        var next_data = {
            options: [
                {value: 1, label: 'one'},
                {value: 2, label: 'two'},
                {value: 3, label: 'three'},
            ]
        };
        var patcher_calls = patch(templates, 'foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'value', 1]);
        assert.deepEqual(patcher_calls[4], ['text', 'one']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'value', 2]);
        assert.deepEqual(patcher_calls[8], ['text', 'two']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[11], ['attribute', 'value', 3]);
        assert.deepEqual(patcher_calls[12], ['text', 'three']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });

});
