// On page load
$(function() {
    // Load text editor
    editor = ace.edit("filters-editor");
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/glsl");

    resetEditor();
});


// Start-Stop toggle functionality
$('#start-stop-button').click(function(){
    $button = $(this);
    $button.toggleClass('paused');

    if ($button.is(".paused")) {
        $button.html("Start");
        filterer.paused = true;
        console.log("Render Paused");
    } else {
        $button.html("Pause");
        filterer.paused = false;
        filterer.lastTime = new Date().getTime() - 20;
        filterer.tick();
        console.log("Render Resumed");
    }
});


// Submit editor text
$('#submit-button').click(function(){
    var result = editor.getValue();

    // filterer.reset();
    filterer.setShader(result);
});


// Reset editor text
$('#reset-button').click(resetEditor);
function resetEditor() {

    $.get("res/user_sample_blur.txt", function(data) {
        editor.setValue(data);

        editor.focus();

        if (filterer == null) {
          filterer = new Filterer("#filters-canvas");
          filterer.init();
          filterer.setShader(data);

          filterer.tick();
        } else {
          filterer.reset();
          filterer.setShader(data);
        }
    });
}


// Editor Config

