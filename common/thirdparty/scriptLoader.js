/*
 *  Handles calling loadScript() on multiple files.
 *  Uses the callback function after all files are loaded.
 */
function loadScripts(urls, callback) {
    var numUrls = urls.length;
    var numComplete = 0;

    // Callback for a single file
    function partialCallback() {
        numComplete++;

        // When all files have downloaded
        if (numComplete == numUrls) {
            callback();
        } else {
            loadScript(urls[numComplete], partialCallback);
        }
    }

    loadScript(urls[0], partialCallback);
}

/*
 *  Loads a single script.
 */
function loadScript(url, callback){

    var script = document.createElement("script");
    script.type = "text/javascript";

    if (script.readyState) {  //IE
        script.onreadystatechange = function() {
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        }
    } else {  //Others
        script.onload = function() {
            callback();
        }
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}