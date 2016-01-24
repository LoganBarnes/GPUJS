// On page load
$(function() {
    // Load text editor
    editor = ace.edit("particles-editor");
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
    var result = editor.getValue();

    //TODO: Do something with result
    console.log(result);

    var userSolver = "res/shaders/bouncers.frag";
    var userRenderer = "res/shaders/render.frag";
    particlesClass = new ParticlesClass(userSolver, userRenderer, "#particles-canvas");

    particlesClass.tick();
});


// Reset editor text
$('#reset-button').click(resetEditor);
function resetEditor() {
  
    $.get("res/user_sample_bouncers.txt", function(data) {
        editor.setValue(data);

        // var session = editor.getSession();
        // var Range = ace.require("ace/range").Range;

        // var header = new Range(0, 0, 3, 0);
        // var marker_header = session.addMarker(header, "static-text");
        // console.log(header);

        // var footer = new Range(5, 0, 5, 12);
        // var marker_footer = session.addMarker(footer, "static-text");
        // console.log(footer);
        
        // editor.keyBinding.addKeyboardHandler({
        //     handleKeyboard : function(data, hash, keyString, keyCode, event) {
        //         if (hash === -1 || (keyCode <= 40 && keyCode >= 37)) return false;
        //         if (intersects(header) || intersects(footer)) {
        //             return {command:"null", passEvent:false};
        //         }
        //     }
        // });
        
        // before(editor, 'onPaste', preventReadonly);
        // before(editor, 'onCut', preventReadonly);
        
        // header.start = session.doc.createAnchor(header.start);
        // header.end = session.doc.createAnchor(header.end);
        // header.end.$insertRight = true;
        
        // footer.start = session.doc.createAnchor(footer.start);
        // footer.end = session.doc.createAnchor(footer.end);
        // footer.end.$insertRight = true;
        
        // function before(obj, method, wrapper) {
        //     var orig = obj[method];
        //     obj[method] = function() {
        //         var args = Array.prototype.slice.call(arguments);
        //         return wrapper.apply(this, function(){
        //             return orig.apply(obj, origArgs);
        //         }, args);
        //     }
        //     return obj[method];
        // }
        
        // function intersects(range) {
        //     return editor.getSelectionRange().intersects(range);
        // }
        
        // function preventReadonly(next) {
        //     if (intersects(range)) return;
        //     next();
        // }

        editor.focus();

        var userSolver = "res/shaders/bouncers.frag";
        var userRenderer = "res/shaders/render.frag";
        particlesClass = new ParticlesClass(userSolver, userRenderer, "#particles-canvas");

        particlesClass.tick();
    });
}


// Editor Config

