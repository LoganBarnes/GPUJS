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
    
    // // Load text editors
    // resetEditor = ace.edit("particles-editor-reset");
    // resetEditor.setTheme("ace/theme/twilight");
    // resetEditor.session.setMode("ace/mode/javascript");

    pass1Editor = ace.edit("particles-editor-pass1");
    pass1Editor.setTheme("ace/theme/twilight");
    pass1Editor.session.setMode("ace/mode/glsl");
    pass1Editor.$blockScrolling = Infinity;

    resetSimulation();
});


// Start-Stop toggle functionality
$('#start-stop-button').click(function(){
    $button = $(this);
    $button.toggleClass('paused');

    if ($button.is(".paused")) {
        $button.html("Start");
        particlesClass.paused = true;
        console.log("Render Paused");
    } else {
        $button.html("Pause");
        particlesClass.paused = false;
        particlesClass.lastTime = new Date().getTime() - 20;
        particlesClass.tick();
        console.log("Render Resumed");
    }
});


// Submit editor text
$('#submit-button').click(function(){
    var result = pass1Editor.getValue();

    particlesClass.setShader(result);
});


// attempt to compile shader when a change is made to the editor
// (if the realtime checkbox is checked)
pass1Editor.getSession().on('change', function () {

    if (particlesClass != null && document.getElementById('realtime-checkbox').checked) {
        var result = pass1Editor.getValue();
        particlesClass.setShader(result);
    }
});


// attempt to compile the editor text when the user initially clicks the realtime checkbox
$('#realtime-checkbox').change(function() {
    if(particlesClass != null && this.checked) {
        var result = pass1Editor.getValue();
        particlesClass.setShader(result);
    }
});


$('#sample-selection').on("change", loadShader);

function loadShader() {
    var sampleType = selector.options[selector.selectedIndex].value

    $.get("res/samples/user_glsl_" + sampleType, function(data) {
        pass1Editor.setValue(data);

        pass1Editor.focus();

        if (particlesClass != null) {
            particlesClass.setShader(data);
            if (particlesClass.paused)
                particlesClass.tick();
        }
    });
}


// Reset editor text
$('#reset-button').click(resetSimulation);

function resetSimulation() {

    if (particlesClass == null) {
        var userRenderer = "res/shaders/render.frag";
        particlesClass = new ParticlesClass("#particles-canvas");
        particlesClass.init(userRenderer);
        loadShader();

        particlesClass.tick();
    } else {

        particlesClass.reset();
        particlesClass.setShader(pass1Editor.getValue());
        if (particlesClass.paused)
            particlesClass.tick();
    }
}


// Editor Config

