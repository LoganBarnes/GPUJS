// On page load
$(function() {
    // resetEditor();
});


$('#start-stop-button').click(function(){
    console.log("barfoo")

    $button = $(this);
    $button.toggleClass('paused');

    if ($button.is(".paused")) {
        $button.html("Start");
        console.log("Start");
    } else {
        $button.html("Pause");
        console.log("Pause");
    }

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


    var str1 = ""
    editor.setValue(str);
    editor.focus();
}
