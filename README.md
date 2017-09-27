# Magery

Easy-to-use JavaScript templates that can work with server-side
rendering in any language.

Magery uses HTML5 templates and JSON data to patch the DOM using
JavaScript. On the server, these templates are simple enough to be
rendered without a JavaScript runtime. On the client, they can be used
to dynamically update the page in response to JavaScript events.

- [Aims](#aims)
- [Download](#download)
- [Example](#example)
- [Template syntax](#template-syntax)
  - [Variables](#variables)
  - [Booleans](#booleans)
  - [Attributes](#attributes)
    - [data-template](#data-template)
    - [data-each](#data-each)
    - [data-key](#data-key)
    - [data-if](#data-if)
    - [data-unless](#data-unless)
    - [data-managed](#data-managed)
    - [data-embed](#data-embed)
    - [Processing order](#processing-order)
  - [Tags](#tags)
    - [template-children](#template-children)
    - [Components](#components)
  - [Events](#events)
- [API](#api)
  - [Magery.compileTemplates](#magerycompiletemplatesselector)
  - [Template.bind](#templatebindhandlers)
  - [Template.patch](#templatepatchtarget-data-prev_data-compare)
- [Immutable data](#immutable-data)
- [State management](#state-management)
- [Server-side rendering](#server-side-rendering)
- [Tests](https://caolan.github.io/magery/test/)
- [Benchmarks](https://caolan.github.io/magery/bench/)
- [Live editor](https://caolan.github.io/magery/editor/)

## Aims

- To make enhancing your *multi-page* website with JavaScript easier
- To work with your choice of back end language
- To be [relatively small](#file-size) so you can use it for little (or large)
  enhancements

I wrote this library to prove that you don't need a 'single page app'
to build great dynamic websites. In many cases the best possible user
experience is a multi-page website with thoughtful JavaScript
enhancements. The only downside is the almost-inevitable tangle of
jQuery that goes with it. Magery is an attempt to fix that.

If you're interested in the motivations behind this library,
you might like to read the [blog post](https://caolan.org/posts/progressive_enhancement_and_modern_javascript.html) 
that started it (Magery's syntax has since been updated).

## Download

- [magery.js](https://raw.githubusercontent.com/caolan/magery/master/build/magery.js) (development)
- [magery.min.js](https://raw.githubusercontent.com/caolan/magery/master/build/magery.min.js) (production)

### File size

While there are no doubt smaller libraries out there, Magery is
positioned on the more lightweight end of the spectrum. This is to
encourage its use for relatively small improvements to
server-generated pages.

A comparison with some popular minified production builds:

    Angular v1.6.4:              ########################################  163 kb
    React + React DOM v15.6.1:   #####################################     150 kb
    jQuery v3.2.1:               #####################                      85 kb
    jQuery (slim build) v3.2.1:  #################                          68 kb
    Magery (2017-08-28):         ###                                        12 kb

## Example

A basic 'Hello, world!' example which demonstrates compiling templates
and patching the DOM:

``` html
<!DOCTYPE html>
<html>
  <head>
    <title>Example</title>
    <meta charset="utf-8">
  </head>
  <body>
    <!-- target -->
    <h1 id="hello"></h1>

    <!-- templates -->
    <template id="myTemplates">

      <h1 data-template="greeting">
        Hello, {{ name }}!
      </h1>

    </template>

    <!-- javascript -->
    <script src="../build/magery.min.js"></script>
    <script>
      var templates = Magery.compileTemplates('#myTemplates');
      var target = document.getElementById('hello');
      var data = {"name": "world"};

      templates['greeting'].patch(target, data);
    </script>
  </body>
</html>
```

You also can [view this example in the browser](https://caolan.github.io/magery/examples/example.html), or see the [other
examples](examples).

## Template syntax

### Variables

You can pass JSON data to [Template.patch()](#templatepatchtarget-data-prev_data-compare) as a context for your
templates. Properties of the context object can be inserted into the
page using `{{` double curly braces `}}`:

``` html
<h1 data-template="greeting">
  Hello, {{ name }}!
  <img src="{{ avatar_url }}" alt="{{ name }}'s avatar">
</h1>
```

Variables can be expanded in both attributes and text. The inserted
values are escaped so it is not possible to insert raw HTML into the
page.

### Booleans

Some attributes do not hold values and are either on/off depending on
their presence. The `checked` attribute is a good example:

``` html
<input type="checkbox" checked>
```

For convenience, Magery allows you to use a variable, and will only
insert the attribute if the variable is *truthy* (i.e. not `0`,
`false`, `null`, `undefined` or `[]`).

``` html
<input type="checkbox" checked="{{ recurring_order }}">
```

### Attributes

#### data-template

This is how you define a template. A template name must consist only
of the lower-case letters `a-z` and `-`, so they can be used as
[component tags](#components).
    
Once rendered, the name provided in the `data-template` attribute will
be added to the rendered element's `data-bind` attribute (this is
useful when trying to match components rendered on the server).
    
##### Example use
    
Template:
``` html
<h1 data-template="hello">
  Hello, {{name}}!
</h1>
```
        
Data:
``` javascript
{name: "world"}
```

 Result:
 ``` html
<h1 data-bind="hello">
  Hello, world!
</h1>
```

#### data-each

Loop over an array, rendering the current element for each item in the
array. This attribute's value should be in the form `"item in array"`
where `item` is the name to use for the current item being rendered,
and `array` is the context property to iterate over.
    
##### Example use
    
Template:
``` html
<ol>
  <li data-each="user in highscores">
    {{ user.name }}: {{ user.score }} points
  </li>
</ol>
```
        
Data:
``` javascript
{
  highscores: [
    {name: 'popchop', score: 100},
    {name: 'fuzzable', score: 98},
    {name: 'deathmop', score: 72}
  ]
}
```
        
Result:

``` html
<ol>
  <li>popchop: 100 points</li>
  <li>fuzzable: 98 points</li>
  <li>deathmop: 72 points</li>
</ol>
```
        
If possible, combine `data-each` with a `data-key` attribute to
uniquely identify each element in the loop. This enables Magery to
more efficiently patch the DOM.
        
Template:

``` html
<ul>
  <li data-each="item in basket" data-key="{{ item.id }}">
    {{ item.title }}
  </li>
</ul>
```

Data:

``` javascript
{
  basket: [
    {id: 1000, title: 'jelly'},
    {id: 1001, title: 'custard'},
    {id: 1002, title: 'cake'}
  ]
}
```
        
Result:

``` html
<ul>
  <li>jelly</li>
  <li>custard</li>
  <li>cake</li>
</ul>
```

#### data-key

Helps Magery match up elements between page updates for improved
performance. The attribute can use the normal variable `{{` expansion
`}}` syntax and its value <span class="underline">must</span> be
unique within the parent element.
    
This attribute is particularly useful when combined with the
`data-each` attribute but it can be used elsewhere too. See
the [data-each](#data-each) examples for more information.

#### data-if

Conditionally expands the element if a context property evaluates to
true. Note that an empty Array in Magery is considered false.
    
##### Example use
    
Template:
``` html
<span data-if="article.published">
  Published: {{ article.pubDate }}
</span>
```
        
Data:
``` javascript
{
  article: {
    published: true,
    pubDate: 'today'
  }
}
```
        
Result:

``` html
<span>Published: today</span>
```

#### data-unless

This is the compliment to [data-if](#data-if), and will display the
element only if the property evaluates to false. Note that an empty
Array in Magery is considered false.
    
##### Example use
    
Template:

``` html
<span data-unless="article.published">
  Draft
</span>
```

Data:

``` javascript
{
  article: {
    published: false,
    pubDate: null
  }
}
```
        
Result:

``` html
<span>Draft</span>
```

#### data-managed

This attribute is for use with HTML form elements, and will force the
state of the element to match the template data.
    
By default, the value of text inputs, checkboxes, and other form
elements can be modified and stored by the browser (and so may not
match the rendered `value` attribute on the HTML element). By setting
`data-managed="true"` you can ensure the state of the form element
always matches your template data.
    
This is particularly useful for 'live' validation of inputs, or
clearing text boxes by setting the `value` attribute to empty.
    
**NOTE:** If you use `data-managed` and want the user's input to be
displayed, you *must* update the associated `value` attribute on an
input using the `oninput` event handler.
    
##### Example
    
This input will only allow the user to enter digits (0-9).
        
Template:

``` html
<form data-template="number-form">
  <input type="text" value="{{number}}" oninput="updateNumber(event)">
</form>
```
        
JavaScript:

``` javascript
templates['number-form'].bindAll({
  updateNumber: function (event) {
    if (/^[0-9]*$/.test(event.target.value) {
      this.data.number = event.target.value;
    }
  }
});
```

For a complete example, see [examples/managed-text-input.html](examples/managed-text-input.html) ([view in
browser](https://caolan.github.io/magery/examples/managed-text-input.html)).

#### data-embed

This is only used for server-side rendering. Adding a `data-embed`
property to an element will include the current context data in the
final output. A `data-context` attribute will be added to the rendered
element which contains the current JSON context data. For more information
see [Server-side rendering](#server-side-rendering).

#### Processing order

It is possible to add multiple template attributes to a single
element, though not all combinations make sense. The attributes will
be processed in the following order:
    
- `data-each`
- `data-if`
- `data-unless`
- `data-key`

That means you can use the _current_ item in a `data-each` loop inside
the value of a `data-if`, `data-unless` or `data-key` attribute.

You can also use these attributes when calling another template:

``` html
<div data-template="top-articles">
  <my-article data-each="article in articles"></my-article>
</div>
```

And you can use these attributes on the template definition itself:

``` html
<div data-template="my-article" data-if="article.published">
  <h1>{{ article.title }}</h1>
</div>
```

### Tags

#### template-children

Expands child nodes from the calling template, if any were provided.
Note: any child nodes or attributes on this tag will be ignored.
    
##### Example use
    
Template:

``` html
<template class="magery-templates">
            
  <div data-template="article">
    <h1>{{ title }}</h1>
    <div class="main-content">
      <template-children />
    </div>
  </div>
            
  <div data-template="page">
    <article title="article.title">
      <p>{{ article.text }}</p>
    </article>
  </div>
            
</template>
```

Data:

``` javascript
{
  article: {
    title: 'Guinea Pig Names',
    text: 'Popchop, Fuzzable, Deathmop'
  }
}
```
        
Result:

``` html
<div data-bind="page">
  <div data-bind="article">
    <h1>Guinea Pig Names</h1>
    <div class="main-content">
      <p>Popchop, Fuzzable, Deathmop</p>
    </div>
  </div>
</div>
```

#### Components

Templates can be rendered by other templates as components. To do
this, simply use the template name as a custom tag. For example, the
following template:

``` html
<h1 data-template="hello">
  Hello, {{name}}!
</h1>
```

Could be rendered elsewhere using the tag \`<hello>\`:

``` html
<hello name="{{ user.name }}"></hello>
```

By adding attributes to your custom tag, you can pass data to the
sub-template. In the above example the context property `user.name` is
bound to `name` inside the `hello` template.
    
It is also possible to provide literal string values as context data:

``` html
<hello name="world"></hello>
```

    
These literals can also be useful for configuring generic event
handlers (e.g. by providing a target URL to POST data to).

### Events

Listeners can be attached to elements using the `on*` attributes (e.g.
`onclick`). Although the templates use the attribute syntax, the event
handlers will in reality be attached using `addEventListener()`:

``` html
<div data-template="example">
  <p>{{ counter.name }}: {{ counter.value }}</p>
  <button onclick="incrementCounter(counter)">
    Increment
  </button>
</div>
```

You can pass values in the current template context to the event
handler as arguments. You can also pass the event object itself by
using the special `event` argument:

``` html
<input type="text" oninput="updateField(name, event)">
```

The handler name (e.g. `updateField` above) is matched against the
current template's bound event handlers. These functions can be bound
to a template using [Template.bind()](#templatebindhandlers).

##### Example

``` html
<!DOCTYPE html>
<html>
  <head>
    <title>Events</title>
    <meta charset="utf-8">
  </head>
  <body>
    <template class="magery-templates">

      <div data-template="hello">
        <button onclick="sayHello(name)">click me</button>
      </div>
        
    </template>
        
    <div id="example"></div>

    <script src="../build/magery.min.js"></script>
    <script>

      var templates = Magery.compileTemplates('.magery-templates');
      var element = document.getElementById('example');

      var data = {
        name: 'testing'
      };

      // add handlers to template
      templates['hello'].bind({
        sayHello: function (name) {
          alert('Hello, ' + name + '!');
        }
      });

      // events are bound on first patch
      templates['hello'].patch(element, data);

    </script>
  </body>
</html>
```

[View this in your browser](https://caolan.github.io/magery/examples/events.html),
or see the [examples](examples) directory for other ways to use
events.

## API

### Magery.compileTemplates(selector)

Find and compile Magery templates in the current HTML document.

#### Arguments

- **selector** - the CSS selector for a parent element which contains
  zero or more templates

#### Return value

Returns an object containing `Template` objects, keyed by template
name (taken from their `data-template` attributes).

#### Example

``` javascript
var templates = Magery.compileTemplates('.magery-templates');
var templates = Magery.compileTemplates('#myTemplates');
var templates = Magery.compileTemplates('template');
        
// access the returned Template() objects using template[name]
```

### Template.bind(handlers)

Attach event handlers to a template. The event handlers will not be
bound to existing DOM elements until `Template.patch()` is called.

#### Arguments

- **handlers** - an object containing event handler functions keyed by
  name

#### Return value

Undefined.

#### Example

``` javascript
    var data = {items: []};
        
    templates[name].bind({
      updateCounter: function () {
        data.counter++;
      },
      removeItem: function (event, id) {
        data.items = items.filter(function (item) {
          return item.id !== id;
        });
      }
    });
```

The arguments passed to event handler functions are dictated by the
`on*` attribute which triggers it. See the [Events](#events) section
for more details.

### Template.patch(target, data, [prev\_data, compare])

Updates `element` to match the output of running the template with
`next_data` as it's context.

#### Arguments

- **element** - The DOM element to be patched
- **next\_data** - The data to render the template with
- **prev\_data** - *(optional)* - The data used for the last render,
  which can be used to optimise the patching process by skipping
  unchanged properties. Useful in conjunction with immutable data
  structures.
- **compare** - *(optional)* - The function to use for comparing
  properties from `next_data` and `prev_data`. Must take two
  arguments and return `true` if they are considered identical and
  `false` otherwise.

#### Return value

Undefined.

#### Example

``` javascript
var element = document.querySelector('#target');
var data = {name: 'test'};
        
templates['example'].patch(element, data);
```

## State management

TODO example with Redux.

## Server-side rendering

Magery has been designed to work with server-side rendering in any
language. If you'd like to create a new server-side library then you
can use the cross-platform [Magery test suite](https://github.com/caolan/magery-tests) to get you started. If
your library passes the tests, you can send a pull request to include
it here.

- [python-magery](https://github.com/caolan/python-magery)

