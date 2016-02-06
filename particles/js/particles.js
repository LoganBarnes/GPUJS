
/*
                                                                                                                                      
8 888888888o      .8.          8 888888888o. 8888888 8888888888  8 8888     ,o888888o.    8 8888         8 8888888888     d888888o.   
8 8888    `88.   .888.         8 8888    `88.      8 8888        8 8888    8888     `88.  8 8888         8 8888         .`8888:' `88. 
8 8888     `88  :88888.        8 8888     `88      8 8888        8 8888 ,8 8888       `8. 8 8888         8 8888         8.`8888.   Y8 
8 8888     ,88 . `88888.       8 8888     ,88      8 8888        8 8888 88 8888           8 8888         8 8888         `8.`8888.     
8 8888.   ,88'.8. `88888.      8 8888.   ,88'      8 8888        8 8888 88 8888           8 8888         8 888888888888  `8.`8888.    
8 888888888P'.8`8. `88888.     8 888888888P'       8 8888        8 8888 88 8888           8 8888         8 8888           `8.`8888.   
8 8888      .8' `8. `88888.    8 8888`8b           8 8888        8 8888 88 8888           8 8888         8 8888            `8.`8888.  
8 8888     .8'   `8. `88888.   8 8888 `8b.         8 8888        8 8888 `8 8888       .8' 8 8888         8 8888        8b   `8.`8888. 
8 8888    .888888888. `88888.  8 8888   `8b.       8 8888        8 8888    8888     ,88'  8 8888         8 8888        `8b.  ;8.`8888 
8 8888   .8'       `8. `88888. 8 8888     `88.     8 8888        8 8888     `8888888P'    8 888888888888 8 888888888888 `Y8888P ,88P' 
*/


var ParticlesClass = function (canvasId) {

	/*
 	 * GPU SOLVER CODE
 	 */

 	// create the GPU solver
 	this.canvas = document.getElementById("particles-canvas");
	this.gpuSolver = new GPU(this.canvas.width, this.canvas.height, canvasId);

	this.canvasId = canvasId;
	this.oldDeltaTime = 0.02;

	// camera and mouse functionality
	this.anglePhi = 90;
	this.angleTheta = 0;
	this.zoomZ = 10;

	this.lastMouseX;
	this.lastMouseY;

	this.spaceDown;
	this.moveCamera;
	this.mouseDown;
	
	// mouse event listeners
	this.canvas.onmousedown = this.handleMouseDown.bind(this);
	document.onmouseup = this.handleMouseUp.bind(this);
	document.onmousemove = this.handleMouseMove.bind(this);
	this.canvas.onwheel = this.handleMouseWheel.bind(this);

	// key event listeners
	document.onkeydown = this.handleKeyDown.bind(this);
	document.onkeyup = this.handleKeyUp.bind(this);

	this.paused = false;
	this.lastTime = new Date().getTime() - 20;
}


/*
                                                    
 8 8888   b.             8  8 8888 8888888 8888888888 
 8 8888   888o.          8  8 8888       8 8888       
 8 8888   Y88888o.       8  8 8888       8 8888       
 8 8888   .`Y888888o.    8  8 8888       8 8888       
 8 8888   8o. `Y888888o. 8  8 8888       8 8888       
 8 8888   8`Y8o. `Y88888o8  8 8888       8 8888       
 8 8888   8   `Y8o. `Y8888  8 8888       8 8888       
 8 8888   8      `Y8o. `Y8  8 8888       8 8888       
 8 8888   8         `Y8o.`  8 8888       8 8888       
 8 8888   8            `Yo  8 8888       8 8888       
*/

ParticlesClass.prototype.init = function(renderShader) {
	
	var numParticles = 1000;
	this.oldDeltaTime = 0.02;
	var radius = 2.5;
	var velocity = 3;

	var dist = velocity * this.oldDeltaTime;

	var gpuSolver = this.gpuSolver;
	var oldDeltaTime = this.oldDeltaTime;
	var deltaTime = this.deltaTime;

	this.gpuSolver.setInitialFunction("solver", function() {		

		var prevInitialArray = new Float32Array(numParticles * 4);
		for (var i = 0; i < numParticles; ++i) {
			var index = i * 4;
			prevInitialArray[index  ] = Math.random() * radius * 2.0 - radius;
			prevInitialArray[index+1] = Math.random() * radius * 2.0 - radius;
			prevInitialArray[index+2] = Math.random() * radius * 2.0 - radius;
			prevInitialArray[index+3] = 1.0;
		}

		var currInitialArray = new Float32Array(numParticles * 4);
		for (var i = 0; i < numParticles; ++i) {
			var index = i * 4;
			currInitialArray[index  ] = prevInitialArray[index  ] + Math.random() * dist * 2 - dist;
			currInitialArray[index+1] = prevInitialArray[index+1] + Math.random() * dist * 2 - dist;
			currInitialArray[index+2] = prevInitialArray[index+2] + Math.random() * dist * 2 - dist;
			currInitialArray[index+3] = 1.0;
		}
		
		var passData = {
			texData: [ {
				texInput: currInitialArray,
				inputType: InputType.ROTATING
			},
			{
				texInput: prevInitialArray,
				inputType: InputType.ROTATING
			} ],
			fvars: [oldDeltaTime, oldDeltaTime]
		};
 
		return passData;

	}); // end setInitialFunction



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
	var resultTex = this.gpuSolver.getSolverResultTexture("solver");
	var passWidth = this.gpuSolver.getSolverResultWidth("solver");
	var passHeight = this.gpuSolver.getSolverResultHeight("solver");
	var passSize = this.gpuSolver.getSolverResultSize("solver");





	/*
	 * ADDITIONAL RENDER AND MANIPULATION CODE
	 */

	// create a camera and a new scene
	this.camera = new THREE.PerspectiveCamera( 75, this.canvas.width / this.canvas.height, 0.1, 1000 );
	this.renderScene = new THREE.Scene();
	this.rendererLoaded = false;

	// for use in async method
	var particlesClass = this;

	loadFiles(["res/shaders/render.vert", renderShader], function (shaderText) {

		var geometry = new THREE.BufferGeometry();
		var vertices = new Float32Array( passSize * 3 ); // three components per vertex
		for ( var i = 0; i < vertices.length; i++ )
		{
			vertices[i*3  ] = i;
			vertices[i*3+1] = i;
			vertices[i*3+2] = i;
		}

		// itemSize = 3 because there are 3 values (components) per vertex
		// geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
		geometry.addGroup( 0, numParticles );
		geometry.drawRange.count = numParticles;

		// create sovler program
		particlesClass.renderPoints = new THREE.Points(

			geometry,

			new THREE.ShaderMaterial( {

				uniforms: {
					texture: { type: "t", value: resultTex },
					texWidth: { type: "i", value: passWidth },
					texHeight: { type: "i", value: passHeight },
					screenHeight: { type: "i", value: particlesClass.canvas.height }
				},
				vertexShader: shaderText[0],
				fragmentShader: shaderText[1]
			} )

		);

		particlesClass.renderScene.add( particlesClass.renderPoints );

		particlesClass.updateCamera();

		particlesClass.rendererLoaded = true;

		// var container = document.getElementById("canvas-container");
		// // particlesClass.resize(container.width, container.height);
		// console.log(container.width;
		// particlesClass.resize();
		particlesClass.resize(550, 550);
	});
}

ParticlesClass.prototype.reset = function() {
	this.gpuSolver.reinitialize("solver");
}


ParticlesClass.prototype.setShader = function(text) {
	this.gpuSolver.compileShaderText("solver", 0, text);
}


/*
                                                                          
 8 8888 b.             8 8 888888888o   8 8888      88 8888888 8888888888 
 8 8888 888o.          8 8 8888    `88. 8 8888      88       8 8888       
 8 8888 Y88888o.       8 8 8888     `88 8 8888      88       8 8888       
 8 8888 .`Y888888o.    8 8 8888     ,88 8 8888      88       8 8888       
 8 8888 8o. `Y888888o. 8 8 8888.   ,88' 8 8888      88       8 8888       
 8 8888 8`Y8o. `Y88888o8 8 888888888P'  8 8888      88       8 8888       
 8 8888 8   `Y8o. `Y8888 8 8888         8 8888      88       8 8888       
 8 8888 8      `Y8o. `Y8 8 8888         ` 8888     ,8P       8 8888       
 8 8888 8         `Y8o.` 8 8888           8888   ,d8P        8 8888       
 8 8888 8            `Yo 8 8888            `Y88888P'         8 8888       
*/

/*
 * Mouse Events
 */

ParticlesClass.prototype.handleMouseDown = function(mouseEvent) {
	this.mouseDown = true;
	var pos = this.getMousePos(mouseEvent);
	this.lastMouseX = pos.x;
	this.lastMouseY = pos.y;
}

ParticlesClass.prototype.handleMouseUp = function(mouseEvent) {
	this.mouseDown = false;
}

ParticlesClass.prototype.handleMouseWheel = function(mouseEvent) {
	mouseEvent.preventDefault(); // no page scrolling when using the canvas

	if (this.moveCamera) {
		if (mouseEvent.deltaMode == 1) {
			this.zoomZ += mouseEvent.deltaX * 0.3;
		} else {
			this.zoomZ += mouseEvent.deltaY * 0.03;
		}
		this.zoomZ = Math.max(0.001, this.zoomZ);
	}

	this.updateCamera();

	if (this.paused && this.rendererLoaded)
		this.renderer.render( this.renderScene, this.camera );
}

ParticlesClass.prototype.handleMouseMove = function(mouseEvent) {
	
	if (!this.mouseDown)
		return;

	var pos = this.getMousePos(mouseEvent);

	// var translation
	var deltaX = pos.x - this.lastMouseX;
	var deltaY = pos.y - this.lastMouseY;

	if (this.moveCamera) {
		this.anglePhi -= deltaY * 0.25;
		this.angleTheta -= deltaX * 0.25;
		this.anglePhi = Math.max(0.001, this.anglePhi);
		this.anglePhi = Math.min(179.999, this.anglePhi);
	}

	this.lastMouseX = pos.x
	this.lastMouseY = pos.y;

	this.updateCamera();

	if (this.paused && this.rendererLoaded)
		this.renderer.render( this.renderScene, this.camera );
}

/*
 * Key Events
 */

ParticlesClass.prototype.handleKeyDown = function(keyEvent) {
	// this.currentlyPressedKeys[keyEvent.keyCode] = true;
	switch(keyEvent.keyCode) {
		// CMD key (MAC)
		case 224: // Firefox
		case 17:  // Opera
		case 91:  // Chrome/Safari (left)
		case 93:  // Chrome/Safari (right)
			break;
		case 16: // shift
			this.moveCamera = true;
			break;
		case 32: // space
			this.spaceDown = true;
			// keyEvent.preventDefault();
			break;
		default:
			// console.log(keyEvent.keyCode);
			break;
	}
}

ParticlesClass.prototype.handleKeyUp = function(keyEvent) {
	// this.currentlyPressedKeys[keyEvent.keyCode] = false;
	switch(keyEvent.keyCode) {
		// CMD key (MAC)
		case 224: // Firefox
		case 17:  // Opera
		case 91:  // Chrome/Safari (left)
		case 93:  // Chrome/Safari (right)
			break;
		case 16: // shift
			this.moveCamera = false;
			break;
		case 32: // space
			this.spaceDown = false;
			break;
		default:
			// console.log(keyEvent.keyCode);
			break;
	}
}


/*
                                                                                                  
8 888888888o.   8 8888888888   b.             8 8 888888888o.      8 8888888888   8 888888888o.   
8 8888    `88.  8 8888         888o.          8 8 8888    `^888.   8 8888         8 8888    `88.  
8 8888     `88  8 8888         Y88888o.       8 8 8888        `88. 8 8888         8 8888     `88  
8 8888     ,88  8 8888         .`Y888888o.    8 8 8888         `88 8 8888         8 8888     ,88  
8 8888.   ,88'  8 888888888888 8o. `Y888888o. 8 8 8888          88 8 888888888888 8 8888.   ,88'  
8 888888888P'   8 8888         8`Y8o. `Y88888o8 8 8888          88 8 8888         8 888888888P'   
8 8888`8b       8 8888         8   `Y8o. `Y8888 8 8888         ,88 8 8888         8 8888`8b       
8 8888 `8b.     8 8888         8      `Y8o. `Y8 8 8888        ,88' 8 8888         8 8888 `8b.     
8 8888   `8b.   8 8888         8         `Y8o.` 8 8888    ,o88P'   8 8888         8 8888   `8b.   
8 8888     `88. 8 888888888888 8            `Yo 8 888888888P'      8 888888888888 8 8888     `88. 
*/


ParticlesClass.prototype.tick = function() {
	// this.paused = true;
	if (!this.paused) {
		requestAnimationFrame(this.tick.bind(this));
	}
	
	if (this.gpuSolver.isPassLoaded("solver") && this.rendererLoaded) {

		// update time
		var timeNow = new Date().getTime(); // milliseconds
		var deltaTime = (timeNow - this.lastTime) / 1000.0; // seconds
		deltaTime = Math.min(deltaTime, 0.05);
		this.lastTime = timeNow;

		this.gpuSolver.rotateFVars("solver", deltaTime);
		this.gpuSolver.runPass( "solver" );
		this.renderer.render( this.renderScene, this.camera );

		this.gpuSolver.rotateSolverTargets("solver");
		this.renderPoints.material.uniforms.texture.value = this.gpuSolver.getSolverResultTexture( "solver" );

	} else {
		this.lastTime = new Date().getTime() - 20;
	}
}


ParticlesClass.prototype.updateCamera = function() {
	var phi = degToRad(this.anglePhi);
	var theta = degToRad(this.angleTheta);

	this.camera.position.x = Math.sin(phi) * Math.sin(theta) * this.zoomZ;
	this.camera.position.y = Math.cos(phi) * this.zoomZ;
	this.camera.position.z = Math.sin(phi) * Math.cos(theta) * this.zoomZ;
	this.camera.lookAt( this.renderScene.position );
}


/*
 * Updates the canvas, viewport, and camera based on the new dimensions.
 */
ParticlesClass.prototype.resize = function(canvasContainerWidth, canvasContainerHeight) {
	this.canvas.width = canvasContainerWidth * 0.9;
	this.canvas.height = canvasContainerHeight * 0.8;

	this.renderer.setSize( this.canvas.width, this.canvas.height );

	// set this the right way
	this.camera.aspect = this.canvas.width / this.canvas.height;
}


/*
                                                         
8 8888      88 8888888 8888888888  8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
8 8888      88       8 8888        8 8888 8 8888         
` 8888     ,8P       8 8888        8 8888 8 8888         
  8888   ,d8P        8 8888        8 8888 8 8888         
   `Y88888P'         8 8888        8 8888 8 888888888888 
*/

/*
 * Returns the mouse position relative to the canvas
 */
ParticlesClass.prototype.getMousePos = function(evt) {
	var rect = this.canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}


/*
          .         .                                                          
         ,8.       ,8.                   .8.           8 8888     b.             8 
        ,888.     ,888.                 .888.          8 8888     888o.          8 
       .`8888.   .`8888.               :88888.         8 8888     Y88888o.       8 
      ,8.`8888. ,8.`8888.             . `88888.        8 8888     .`Y888888o.    8 
     ,8'8.`8888,8^8.`8888.           .8. `88888.       8 8888     8o. `Y888888o. 8 
    ,8' `8.`8888' `8.`8888.         .8`8. `88888.      8 8888     8`Y8o. `Y88888o8 
   ,8'   `8.`88'   `8.`8888.       .8' `8. `88888.     8 8888     8   `Y8o. `Y8888 
  ,8'     `8.`'     `8.`8888.     .8'   `8. `88888.    8 8888     8      `Y8o. `Y8 
 ,8'       `8        `8.`8888.   .888888888. `88888.   8 8888     8         `Y8o.` 
,8'         `         `8.`8888. .8'       `8. `88888.  8 8888     8            `Yo 
*/

var particlesClass = null;










