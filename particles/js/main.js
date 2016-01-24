$('#submit-button').click(function(){
    var result = editor.getValue();
    console.log(result);
});

$('#reset-button').click(function(){
    editor.setValue("Reset!");
});
