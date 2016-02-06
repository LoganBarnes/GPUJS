// FPS Tracker
javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();stats.domElement.style.cssText='position:fixed;left:0;top:0;z-index:10000';document.body.appendChild(stats.domElement);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()



var Filterer = function (canvasId) {

 	this.canvas = document.getElementById("filters-canvas");
	var width = this.canvas.width;
	var height = this.canvas.height;

	this.canvasId = canvasId;

	/*
	 * Webcam
	 */
	var vid = document.getElementById("video");

 	if (vid) {
		this.video = vid;
		this.video.width = width;
		this.video.height = height;
		this.video.autoplay = true;

		var mediaOptions = { audio: false, video: true };

		if (!navigator.getUserMedia) {
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		}

		if (!navigator.getUserMedia){
			return alert('getUserMedia not supported in this browser.');
		}

		var webcam = this.video;
		navigator.getUserMedia(mediaOptions, 
			function(stream){
				webcam.src = window.URL.createObjectURL(stream);
			}, function(e) {
				console.log(e);
			}
		);

 	} else {
 		this.video = null;
 		console.error("No video element provided");
 		return;
 	}

	
	/*
 	 * GPU SOLVER CODE
 	 */
	this.gpuSolver = new GPU(width, height, canvasId);

}


Filterer.prototype.init = function() {

	this.gpuSolver.addInitialPass("filter", {
		texData: [ {
			texInput: this.video,
			inputType: InputType.IMG_VID,
			linear: true,
			flipY: true
		} ],
		swapX: true
	});

	this.gpuSolver.connectPass("filter", {
		texData: []
	});

	/*
	 * GPU SOLVER METHODS TO INTEGRATE WITH RENDERING
	 */

	// get the canvas element and append it if necessary 
	this.canvas = this.gpuSolver.getCanvas();

	if ( this.canvasId === undefined )
		document.body.appendChild( this.canvas );

	// get the WebGLRenderer object
	this.renderer = this.gpuSolver.getRenderer();

	// get the solver texture and texture sizes
	var resultTex = this.gpuSolver.getSolverResultTexture("filter");


	/*
	 * ADDITIONAL THREEjs RENDER CODE
	 */

	// create a camera and a new scene
	this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 1, 1000 );
	this.camera.position.z = 5;
	this.renderScene = new THREE.Scene();
	this.rendererLoaded = false;

	// get the solver texture
	var resultTex = this.gpuSolver.getSolverResultTexture("filter");

	var geometry = new THREE.PlaneGeometry(2, 2);

	// create render mesh
	var renderMesh = new THREE.Mesh (
		new THREE.PlaneGeometry(2, 2),
		new THREE.MeshBasicMaterial({ map: resultTex })
	);

	this.renderScene.add( renderMesh );
	this.renderScene.add( new THREE.AmbientLight( 0xffffff ) );

	this.rendererLoaded = true;

}


Filterer.prototype.reset = function() {
	// nothing needs to happen for this class
}


Filterer.prototype.setShader = function(text) {
	this.gpuSolver.compileShaderText("filter", 0,
		"\ndata = texture2D(textures[0], (vec2(_x, _y) + vec2(0.5)) / vec2(outputDim));\n");
	this.gpuSolver.compileShaderText("filter", 1, text);
}



Filterer.prototype.tick = function() {
	requestAnimationFrame(this.tick.bind(this));

	if (this.video && this.gpuSolver.isPassLoaded("filter") && this.rendererLoaded) {

		if (this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
			this.gpuSolver.setUpdateTexture( "filter", 0, 0 );
		}

		this.gpuSolver.runPass( "filter" );

		this.renderer.render( this.renderScene, this.camera );
	}
}

var filterer = null;


























