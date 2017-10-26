suite('Events', function () {

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

    function input(el, value){
        var ev = document.createEvent('Event');
        ev.initEvent('input', true, false);
        el.value = value;
        el.dispatchEvent(ev);
    }
    
    function change(el, value){
        var ev = document.createEvent('Event');
        ev.initEvent('change', true, false);
        el.value = value;
        el.dispatchEvent(ev);
    }

    test('click event to dispatch', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(event)">click me</button>' +
                '</div>');
        var data = {};
        templates['main'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(container, 0));
                done();
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
    });

    test('click event with context data', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(user)">click me</button>' +
                '</div>');
        var data = {user: {name: 'test'}};
        templates['main'].bind({
            clicked: function (user) {
                assert.deepEqual(user, {name: 'test'});
                done();
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
    });
    
    test('click event with event and context data', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(event, user)">click me</button>' +
                '</div>');
        var data = {user: {name: 'test'}};
        templates['main'].bind({
            clicked: function (event, user) {
                assert.equal(event.target, child(container, 0));
                assert.deepEqual(user, {name: 'test'});
                done();
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
    });
    
    test('reference named item in loop', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button data-each="item in items" onclick="test(item)">test</button>' +
                '</div>');
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var calls = [];
        templates['main'].bind({
            test: function (item) {
                calls.push(item.name);
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
        click(child(container, 1));
        click(child(container, 2));
        assert.deepEqual(calls, ['one', 'two', 'three']);
    });

    test('render html tags back into input', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input type="text" value="{{user.name}}" oninput="updateID(user, event)">' +
                '</div>');
        var data = {user: {name: 'test'}};
        templates['main'].bind({
            updateID: function (user, event) {
                user.name = event.target.value;
                Magery.patch(templates, 'main', data, container);
            }
        });
        Magery.patch(templates, 'main', data, container);
        assert.equal(child(container, 0).value, 'test');
        input(child(container, 0), '<h1>test</h1>');
        assert.equal(child(container, 0).value, '<h1>test</h1>');
    });
    
    test('update input value via dispatch + patch', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input type="text" value="{{name}}" oninput="updateInput()">' +
                '</div>');
        var data = {name: 'testing'};
        templates['main'].bind({
            updateInput: function () {
                data.name = 'bar';
                Magery.patch(templates, 'main', data, container);
            }
        });
        Magery.patch(templates, 'main', data, container);
        var input = child(container, 0);
        input.value = 'foo';
        assert.equal(input.value, 'foo');
        // input event fires synchronously
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        input.dispatchEvent(event);
        assert.equal(input.value, 'bar');
    });

    test('update select box value onchange', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<select onchange="update(event)">' +
                '<option data-each="option in options" value="{{option.value}}" selected="{{option.selected}}">' +
                '{{option.label}}' +
                '</option>' +
                '</select>' +
                '</div>');
        var data = {
            options: [
                {value: 1, label: 'one', selected: false},
                {value: 2, label: 'two', selected: true},
                {value: 3, label: 'three', selected: false}
            ]
        };
        templates['main'].bind({
            update: function (event) {
                data.options.forEach(function (opt) {
                    opt.selected = opt.value == event.target.value;
                });
                Magery.patch(templates, 'main', data, container);
            }
        });
        Magery.patch(templates, 'main', data, container);
        var select = child(container, 0);
        var optionOne = child(select, 0);
        var optionTwo = child(select, 1);
        var optionThree = child(select, 2);
        document.body.appendChild(container);
        assert.ok(!optionOne.selected, 'option one (pre)');
        assert.ok(optionTwo.selected, 'option two (pre)');
        assert.ok(!optionThree.selected, 'option three (pre)');
        assert.equal(select.value, 2);
        change(child(container, 0), '3');
        setTimeout(function () {
            assert.ok(!optionOne.selected, 'option one (pre)');
            assert.ok(!optionTwo.selected, 'option two (pre)');
            assert.ok(optionThree.selected, 'option three (pre)');
            assert.equal(select.value, 3);
            done();
        }, 0);
    });

    test('update checkbox via dispatch', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input data-if="checked" type="checkbox" onclick="toggle()" checked>' +
                '<input data-unless="checked" type="checkbox" onclick="toggle()">' +
                '</div>');
        var data = {checked: true};
        templates['main'].bind({
            toggle: function () {
                data.checked = !data.checked;
            }
        });
        Magery.patch(templates, 'main', data, container);
        var input = child(container, 0);
        document.body.appendChild(container);
        assert.ok(input.checked);
        click(input);
        setTimeout(function () {
            assert.ok(!input.checked);
            click(input);
            setTimeout(function () {
                assert.ok(input.checked);
                document.body.removeChild(container);
                done();
            }, 0);
        }, 0);
    });
    
    test('update radio via event handler', function (done) {
        var container = document.createElement('form');
        var templates = createTemplateNode(
            '<form data-template="main" method="GET" action="">' +
                '<div data-each="option in options">' +
                    '<input data-if="option.checked" type="radio" onclick="pick(option.value)" name="example" value="{{option.value}}" checked>' +
                    '<input data-unless="option.checked" type="radio" onclick="pick(option.value)" name="example" value="{{option.value}}">' +
                '</div>' +
            '</form>'
        );
        var data = {
            options: [
                {value: 'one', checked: false},
                {value: 'two', checked: true},
                {value: 'three', checked: false}
            ]
        };
        var radioOne, radioTwo, radioThree;
        templates['main'].bind({
            pick: function (value) {
                data.options.forEach(function (option) {
                    option.checked = (option.value === value);
                });
                Magery.patch(templates, 'main', data, container);
            }
        });
        Magery.patch(templates, 'main', data, container);
        radioOne = child(container, 0, 0);
        radioTwo = child(container, 1, 0);
        radioThree = child(container, 2, 0);
        document.body.appendChild(container);
        assert.ok(!radioOne.checked, 'radioOne (0)');
        assert.ok(radioTwo.checked, 'radioTwo (0)');
        assert.ok(!radioThree.checked, 'radioThree (0)');
        click(radioThree);
        setTimeout(function () {
            assert.ok(!radioOne.checked, 'radioOne (1)');
            assert.ok(!radioTwo.checked, 'radioTwo (1)');
            assert.ok(radioThree.checked, 'radioThree (1)');
            click(radioOne);
            setTimeout(function () {
                assert.ok(radioOne.checked, 'radioOne (2)');
                assert.ok(!radioTwo.checked, 'radioTwo (2)');
                assert.ok(!radioThree.checked, 'radioThree (2)');
                document.body.removeChild(container);
                done();
            }, 0);
        }, 0);
    });

    test('bind handlers on nested template definition', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<div data-template="entry">' +
                    '<p>{{ item_one.name }}: {{ item_one.count }}</p>' +
                    '<button onclick="incrementCount()">Add one</button>' +
                '</div>' +
                '<button onclick="incrementCount()">Add one</button>' +
            '</div>'
        );
        var data = {
            item_one: {
                name: 'one',
                count: 0
            },
            item_two: {
                name: 'two',
                count: 0
            }
        };
        templates['main'].bind({
            incrementCount: function () {
                data.item_two.count++;
            }
        });
        templates['entry'].bind({
            incrementCount: function () {
                data.item_one.count++;
            }
        });
        Magery.patch(templates, 'main', data, container);
        var btn1 = child(container, 0, 1);
        var btn2 = child(container, 1);
        assert.equal(data.item_one.count, 0, 'item_one.count after patch');
        assert.equal(data.item_two.count, 0, 'item_two.count after patch');
        click(btn1);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn1');
        assert.equal(data.item_two.count, 0, 'item_two.count after click btn1');
        click(btn2);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn2');
        assert.equal(data.item_two.count, 1, 'item_two count after click btn2');
        done();
    });

    test('bind handlers on components', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="entry">' +
                '<p>{{ item.name }}: {{ item.count }}</p>' +
                '<button onclick="incrementCount()">Add one</button>' +
            '</div>' +
            '<div data-template="main">' +
                '<entry item="item_one"></entry>' +
                '<button onclick="incrementCount()">Add one</button>' +
            '</div>'
        );
        var data = {
            item_one: {
                name: 'one',
                count: 0
            },
            item_two: {
                name: 'two',
                count: 0
            }
        };
        templates['main'].bind({
            incrementCount: function () {
                data.item_two.count++;
            }
        });
        templates['entry'].bind({
            incrementCount: function () {
                data.item_one.count++;
            }
        });
        Magery.patch(templates, 'main', data, container);
        var btn1 = child(container, 0, 1);
        var btn2 = child(container, 1);
        assert.equal(data.item_one.count, 0, 'item_one.count after patch');
        assert.equal(data.item_two.count, 0, 'item_two.count after patch');
        click(btn1);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn1');
        assert.equal(data.item_two.count, 0, 'item_two.count after click btn1');
        click(btn2);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn2');
        assert.equal(data.item_two.count, 1, 'item_two count after click btn2');
        done();
    });

    test('bind handlers inside template-children', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="entry">' +
                '<p>{{ item.name }}: {{ item.count }}</p>' +
                '<button onclick="incrementCount()">Add one</button>' +
                '<template-children></template-children>' +
            '</div>' +
            '<div data-template="main">' +
                '<entry item="item_one">' +
                    '<button onclick="incrementCount()">Add one</button>' +
                '</entry>' +
            '</div>'
        );
        var data = {
            item_one: {
                name: 'one',
                count: 0
            },
            item_two: {
                name: 'two',
                count: 0
            }
        };
        templates['main'].bind({
            incrementCount: function () {
                data.item_two.count++;
            }
        });
        templates['entry'].bind({
            incrementCount: function () {
                data.item_one.count++;
            }
        });
        Magery.patch(templates, 'main', data, container);
        var btn1 = child(container, 0, 1);
        var btn2 = child(container, 0, 2);
        assert.equal(data.item_one.count, 0, 'item_one.count after patch');
        assert.equal(data.item_two.count, 0, 'item_two.count after patch');
        click(btn1);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn1');
        assert.equal(data.item_two.count, 0, 'item_two.count after click btn1');
        click(btn2);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn2');
        assert.equal(data.item_two.count, 1, 'item_two count after click btn2');
        done();
    });

    test('Inside handlers, \'this\' is bound to top-most rendered element of template', function (done) {
        var element = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(event)">click me</button>' +
                '</div>');
        var data = {};
        templates['main'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(element, 0));
                assert.equal(this, element);
                done();
            }
        });
        Magery.patch(templates, 'main', data, element);
        click(child(element, 0));
    });

    test('\'this\' in nested template calls', function (done) {
        var element = document.createElement('div');
        var templates = createTemplateNode(
            '<button data-template="bar" onclick="clicked(event)">click me</button>' +
            '<div data-template="foo">' +
                '<bar></bar>' +
            '</div>');
        var data = {};
        templates['bar'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(element, 0));
                assert.equal(this, child(element, 0));
                done();
            }
        });
        Magery.patch(templates, 'foo', data, element);
        click(child(element, 0));
    });

    test('\'this\' in nested template definitions', function (done) {
        var element = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<div data-template="asdf">' +
                  '<button onclick="clicked(event)">click me</button>' +
                '</div>' +
            '</div>'
        );
        var data = {};
        templates['asdf'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(element, 0, 0));
                assert.equal(this, child(element, 0));
                done();
            }
        });
        Magery.patch(templates, 'main', data, element);
        click(child(element, 0, 0));
    });

    test('bind event on static template call', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<button class="btn" data-template="my-btn">Test</button>' +
            '<div data-template="main">' +
                '<my-btn onclick="clicked(event)"></my-btn>' +
            '</div>');
        var data = {};
        // event should trigger caller not callee handlers
        templates['main'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(container, 0));
                done();
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
    });

    test('bind event on dynamic template call', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<button class="btn" data-template="my-btn">Test</button>' +
            '<div data-template="main">' +
                '<template-call template="my-{{ type }}" onclick="clicked(event)">' +
                '</tepmlate-call>' +
            '</div>');
        var data = {type: 'btn'};
        // event should trigger caller not callee handlers
        templates['main'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(container, 0));
                done();
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
    });

    test('bind event inside nested template calls', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<select data-template="foo">' +
                '<option value="1">one</option>' +
                '<option value="2">two</option>' +
            '</select>' +
            '<div data-template="example-wrapper">' +
                '<template-call template="{{ tmpl }}"></template-call>' +
            '</div>' +
            '<div data-template="main">' +
                '<example-wrapper onclick="clicked(event)" tmpl="{{ tmpl }}"></example-wrapper>' +
            '</div>'
        );
        var data = {tmpl: 'foo'};
        // event should trigger caller not callee handlers
        templates['main'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(container, 0));
                done();
            }
        });
        Magery.patch(templates, 'main', data, container);
        click(child(container, 0));
    });

    test('remove old event handlers on replaced element', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="bar">test</div>' +
            '<div data-template="foo">' +
                '<select>' +
                    '<option value="1">one</option>' +
                    '<option value="2">two</option>' +
                '</select>' +
            '</div>' +
            '<div data-template="example-wrapper" class="{{ tmpl }}">' +
                '<template-call template="{{ tmpl }}"></template-call>' +
            '</div>' +
            '<div data-template="main">' +
                '<example-wrapper data-if="show" oninput="input(event)" tmpl="{{ tmpl1 }}"></example-wrapper>' +
                '<example-wrapper onchange="change(event)" tmpl="{{ tmpl2 }}"></example-wrapper>' +
             '</div>'
        );
        var data = {
            show: true,
            tmpl1: 'bar',
            tmpl2: 'foo'
        };
        var changes = 0;
        var inputs = 0;
        // event should trigger caller not callee handlers
        templates['main'].bind({
            input: function (event) {
                inputs++;
            },
            change: function (event) {
                changes++;
            }
        });
        Magery.patch(templates, 'main', data, container);
        input(child(container, 1, 0, 0), '1');
        change(child(container, 1, 0, 0), '1');
        assert.equal(changes, 1);
        assert.equal(inputs, 0);
        data.show = false;
        Magery.patch(templates, 'main', data, container);
        input(child(container, 0, 0, 0), '2');
        change(child(container, 0, 0, 0), '2');
        assert.equal(changes, 2);
        assert.equal(inputs, 0);
    });

});
