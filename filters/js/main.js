// On page load
$(function() {
        
    $('ul.tabs li').click(function(){
        var tab_id = $(this).attr('data-tab');

        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $(this).addClass('current');
        $("#"+tab_id).addClass('current');
    });

    selector = document.getElementById('sample-selection');

    // Load text editor
    editor = ace.edit("filters-editor");
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/glsl");
    editor.$blockScrolling = Infinity;

    resetFilterer();
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
    filterer.setShader(result, 1);
});


// attempt to compile shader when a change is made to the editor
// (if the realtime checkbox is checked)
editor.getSession().on('change', function () {

    if (filterer != null && document.getElementById('realtime-checkbox').checked) {
        var result = editor.getValue();
        filterer.setShader(result, 1);
    }
});


// attempt to compile the editor text when the user initially clicks the realtime checkbox
$('#realtime-checkbox').change(function() {
    if(filterer != null && this.checked) {
        var result = editor.getValue();
        filterer.setShader(result, 1);
    }
});


$('#sample-selection').on("change", loadShader);

function loadShader(update) {
    var sampleType = selector.options[selector.selectedIndex].value

    $.get("res/samples/user_glsl_" + sampleType, function(data) {
        editor.setValue(data);

        editor.focus();

        if (update !== undefined) {
            filterer.setShader(data, 1);
        }
    });
}


// Reset editor text
$('#reset-button').click(resetFilterer);

function resetFilterer() {

    if (filterer == null) {
        filterer = new Filterer("#filters-canvas");
        filterer.init();
        filterer.setShader("\ndata = texture2D(textures[0], (vec2(_x, _y) + vec2(0.5)) / vec2(outputDim));\n", 0);
        loadShader(true);

        filterer.tick();
    } else {
        filterer.reset();
        filterer.setShader(editor.getValue(), 1);
    }
}


// Editor Config

