// On page load
$(function() {
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

    particlesClass.reset();
    particlesClass.setShader(result);
});


// Reset editor text
$('#reset-button').click(resetEditor);
function resetEditor() {

    $.get("res/user_sample_bouncers.txt", function(data) {
        editor.setValue(data);
        editor.focus();

        if (particlesClass == null) {
          var userRenderer = "res/shaders/render.frag";
          particlesClass = new ParticlesClass("#particles-canvas");
          particlesClass.init(userRenderer);
          particlesClass.setShader(data);

          particlesClass.tick();
        } else {
          particlesClass.reset();
          particlesClass.setShader(data);
        }
    });
}
