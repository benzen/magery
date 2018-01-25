var query = {};
var params = window.location.search.substring(1).split('&');
for (var i = 0; i < params.length; i++) {
    var pair = params[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
}

var templates_editor = ace.edit("templates");
templates_editor.getSession().setUseWorker(false);
templates_editor.setTheme("ace/theme/solarized_light");
templates_editor.setHighlightActiveLine(false);
templates_editor.setShowPrintMargin(false);
templates_editor.getSession().setMode("ace/mode/html");
//templates_editor.setBehavioursEnabled(false);

var json_editor = ace.edit("data");
json_editor.getSession().setUseWorker(false);
json_editor.setTheme("ace/theme/solarized_light");
json_editor.setHighlightActiveLine(false);
json_editor.setShowPrintMargin(false);
json_editor.getSession().setMode("ace/mode/json");
json_editor.$blockScrolling = Infinity;
//json_editor.setBehavioursEnabled(false);

if (query.templates) {
    templates_editor.setValue(query.templates);
}
if (query.data) {
    json_editor.setValue(query.data);
}

function eachNode(nodelist, f) {
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

var templates = {};
function loadTemplates() {
    var active = document.getElementById('active-templates');
    active.innerHTML = templates_editor.getValue();
    MageryCompiler.compile(active, templates);
}

var data;
try {
    data = JSON.parse(json_editor.getValue());
}
catch (e) {
    data = {};
    json_editor.setValue('{}');
}

loadTemplates();

var element = document.getElementsByTagName('my-app')[0];
    
function patch() {
    try {
        templates['my-app'](element, data);
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

function updateTemplates() {
    try {
        loadTemplates();
        return true;
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

function updateJSON() {
    try {
        data = JSON.parse(json_editor.getValue());
        return true;
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

templates_editor.getSession().on('change', function () {
    if (updateTemplates()) {
        patch();
        updateUrl();
    }
});

json_editor.getSession().on('change', function () {
    if (updateJSON()) {
        patch();
        updateUrl();
    }
});

function updateUrl(){
  var json = window.escape(json_editor.getValue());
  var template =  window.escape(templates_editor.getValue());
  var url = window.location.href.replace(/\?.*/, "")+"?data="+json+"&templates="+template;
  document.getElementById("url").innerText = "";
  document.getElementById("url").innerText = url;
  
}
// initial render
updateTemplates();
updateJSON();
patch();
