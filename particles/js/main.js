var editors = [];

// On page load
$(function() {

    selector = document.getElementById('sample-selection');

    currSampleType = selector.options[selector.selectedIndex].value;

    // Load text editors
    editors[0] = ace.edit("particles-editor-pass1");
    editors[0].setTheme("ace/theme/twilight");
    editors[0].session.setMode("ace/mode/glsl");
    editors[0].$blockScrolling = Infinity;

    editors[0].getSession().on('change', function () {
        if (particlesClass != null && document.getElementById('realtime-checkbox').checked) {
            var result = editors[0].getValue();
            var annotations = particlesClass.setShader(result, 0);
            editors[0].getSession().setAnnotations(annotations);
        }
    });

    // editors[1] = ace.edit("particles-editor-pass2");
    // editors[1].setTheme("ace/theme/twilight");
    // editors[1].session.setMode("ace/mode/glsl");
    // editors[1].$blockScrolling = Infinity;

    if (currSampleType == "fluid") {
        setNumEditors(2);
    }
    // else
        // setNumEditors(1);

    $('ul.tabs').on("click", ".tab-link", clickFunction);

    resetSimulation();
});


function clickFunction() {
    var tab_id = $(this).attr('data-tab');

    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');

    $(this).addClass('current');
    $("#"+tab_id).addClass('current');

    for (var i = 0; i < editors.length; ++i) {
        editors[i].resize();
    }
}


function setNumEditors(length) {
    var len = editors.length;
    var size = length - len;

    if (size < 0) {
        editors = editors.splice(0, length);
        
        for (var i = length + 1; i <= len; ++i) {
            $('#tab-' + i).remove();
            $('#tab-div' + i).remove();
        }

        return;
    }

    var index, id;
    for (var i = 0; i < size; ++i) {
        index = size + i;
        id = index + 1;

        var html = "<div id='tab-div" + id;
        html += "' class='tab-content'>";
        html += "<pre id='particles-editor-pass" + id;
        html += "' class='editor'></pre></div>";

        $('#tab-div').append(html);

        html = "<li id='tab-" + id + "' class='tab-link tabs' data-tab='tab-div" + id;
        html += "'>Pass " + id + "</li>";

        $('#tab-add').before(html);

        editors[index] = ace.edit("particles-editor-pass" + id);
        editors[index].setTheme("ace/theme/twilight");
        editors[index].session.setMode("ace/mode/glsl");
        editors[index].$blockScrolling = Infinity;

        editors[index].getSession().on('change', function () {
            if (particlesClass != null && document.getElementById('realtime-checkbox').checked) {
                var result = editors[index].getValue();
                var annotations = particlesClass.setShader(result, index);
                editors[index].getSession().setAnnotations(annotations);
            }
        });
    }

    // $('ul.tabs').off("click", ".tab-link", clickFunction);
    // $('ul.tabs').on("click", ".tab-link", clickFunction);
}


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

function updateShader(i) {
    var result = editors[i].getValue();
    var annotations = particlesClass.setShader(result, i);
    editors[i].getSession().setAnnotations(annotations);
}

function realtimeUpdateShader(i) {
    if (document.getElementById('realtime-checkbox').checked) {
        updateShader(i);
    }
}

// attempt to compile shader when a change is made to the editor
function updateShaders() {
    if (particlesClass != null) {
        for (var i = 0; i < editors.length; ++i) { 
            updateShader(i);
        }
    }
}

// attempt to compile shader when a change is made to the editor
function realtimeUpdateShaders() {
    if (particlesClass != null) {
        for (var i = 0; i < editors.length; ++i) { 
            realtimeUpdateShader(i);
        }
    }
}

// Submit editor text
$('#submit-button').click(updateShaders);

// attempt to compile the editor text when the user initially clicks the realtime checkbox
$('#realtime-checkbox').change(realtimeUpdateShaders);


$('#sample-selection').on("change", loadShader);

function loadShader() {
    var sampleType = selector.options[selector.selectedIndex].value;
    var pass = 0; // incase there are multiple passes

    $.get("res/samples/user_glsl_" + sampleType + "_" + pass, function(data) {
        editors[0].setValue(data);
        editors[0].focus();
    });

    if (sampleType == "fluid") {
        if (currSampleType != "fluid") {
            particlesClass.addFluidPass();
            setNumEditors(2);
        }
        pass = 1;

        $.get("res/samples/user_glsl_" + sampleType + "_" + pass, function(data) {
            editors[1].setValue(data);
            editors[1].focus();
        });
    } else if (sampleType != "fluid") {
        if (currSampleType == "fluid") {
            particlesClass.removeFluidPass();
            setNumEditors(1);
        }
    }

    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');

    $("#tab-1").addClass('current');
    $("#tab-div1").addClass('current');

    currSampleType = sampleType;
}


// Reset editor text
$('#reset-button').click(resetSimulation);

function resetSimulation() {

    if (particlesClass == null) {
        var userRenderer = "res/shaders/render.frag";
        particlesClass = new ParticlesClass("#particles-canvas");
        particlesClass.init(userRenderer);

        if (currSampleType == "fluid") {
            setNumEditors(2);
            particlesClass.addFluidPass();
        }

        loadShader();

        particlesClass.tick();
    } else {

        particlesClass.reset();

        if (currSampleType == "fluid") {
            setNumEditors(2);
            particlesClass.addFluidPass();
        }

        updateShaders();
        
        if (particlesClass.paused)
            particlesClass.tick();
    }
}


// Editor Config

