// On page load
$(function() {
    resetEditor();
});

// Submit editor text
$('#submit-button').click(function(){
    var result = editor.getValue();
    
    //TODO: Do something with result
    console.log(result);
});

// Reset editor text
$('#reset-button').click(resetEditor);
function resetEditor() {
    var str = "function foo(items) {\n" +
          "    var i;\n" +
          "    for (i = 0; i < items.length; i++) {\n" +
          "        alert(\"w00t!\" + items[i]);\n" +
          "    }\n" +
          "}";
    editor.setValue(str);
}