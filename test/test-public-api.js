suite('Public API', function () {

    var assert = chai.assert;

    test('Magery.compile() within template node', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template>' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>' +
            '</template>';
        var templates = Magery.compile(container.childNodes[0]);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar'].sort());
    });

    test('Magery.compile() within div node', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>';
        var templates = Magery.compile(container);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar'].sort());
    });

    test('Magery.compile() directly on data-tagname node', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template data-tagname="my-foo">foo</template>';
        var templates = Magery.compile(container.childNodes[0]);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo'].sort());
    });

    test('Magery.compile() with selector', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<div class="magery-templates">' +
              '<template data-tagname="my-foo">foo</template>' +
              '<template data-tagname="my-bar">bar</template>' +
            '</div>' +
            '<div>' +
              '<template data-tagname="my-baz">baz</template>' +
              '<template data-tagname="my-qux">qux</template>' +
            '</div>' +
            '<template data-tagname="my-quux" class="magery-templates">' +
              'quux' +
            '</template>';
        container.style.display = 'none';
        document.body.appendChild(container);
        var templates = Magery.compile('.magery-templates');
        document.body.removeChild(container);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar', 'my-quux'].sort());
    });

    test('Magery.compile(node) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>';
        var templates1 = {'my-asdf': 123};
        var templates2 = Magery.compile(container, templates1);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['my-asdf', 'my-foo', 'my-bar'].sort());
        assert.equal(templates1['my-asdf'], 123);
    });

    test('Magery.compile(template_tag) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template>' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>' +
            '</template>';
        var templates1 = {'my-asdf': 123};
        var templates2 = Magery.compile(container.childNodes[0], templates1);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['my-asdf', 'my-foo', 'my-bar'].sort());
        assert.equal(templates1['my-asdf'], 123);
    });

    test('Magery.compile(selector) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<div class="magery-templates">' +
              '<template data-tagname="my-foo">foo</template>' +
              '<template data-tagname="my-bar">bar</template>' +
            '</div>' +
            '<div>' +
              '<template data-tagname="my-baz">baz</template>' +
              '<template data-tagname="my-qux">qux</template>' +
            '</div>' +
            '<template data-tagname="my-quux" class="magery-templates">' +
              'quux' +
            '</template>';
        container.style.display = 'none';
        document.body.appendChild(container);
        var templates1 = {'my-asdf': 123};
        var templates2 = Magery.compile('.magery-templates', templates1);
        document.body.removeChild(container);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['my-asdf', 'my-foo', 'my-bar', 'my-quux'].sort());
        assert.equal(templates1['my-asdf'], 123);
    });

    // test('Magery.patch()', function () {
    // });

    // test('Magery.patch() on mismatched tag type', function () {
    // });

    // test('Template.bind()', function () {
    // });

});
