


var ParticlesClass = function (solverShader, renderShader, canvasId) {

	/*
 	 * GPU SOLVER CODE
 	 */

 	// create the GPU solver
 	var canvas = document.getElementById("particles-canvas");
	this.gpuSolver = new GPU(canvas.width, canvas.height, canvasId); 

	var numParticles = 1000;
	this.oldDeltaTime = 0.01;
	var radius = 25.0;
	var velocity = 5.0;
	// var velocity = 25.0;

	var dist = velocity * this.oldDeltaTime;

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
		currInitialArray[index  ] = prevInitialArray[index  ] + Math.random() * dist - dist * 0.5;
		currInitialArray[index+1] = prevInitialArray[index+1] + Math.random() * dist - dist * 0.5;
		currInitialArray[index+2] = prevInitialArray[index+2] + Math.random() * dist - dist * 0.5;
		currInitialArray[index+3] = 1.0;
	}

	
	this.gpuSolver.addInitialPass("solver", {
		texData: [ {
			texInput: currInitialArray,
			inputType: InputType.ARRAY
		// },
		// {
		// 	texInput: prevInitialArray,
		// 	inputType: InputType.ARRAY
		// } ],
		} ],
		shader: solverShader
	});

	/*
	 * GPU SOLVER METHODS TO INTEGRATE WITH RENDERING
	 */

	// get the canvas element and append it if necessary 
	this.canvas = this.gpuSolver.getCanvas();

	if ( canvasId === undefined )
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

		// particlesClass.updateCamera();

		particlesClass.rendererLoaded = true;

		// particlesClass.resize();
	});
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

// var counter = 0;
// var counterMax = 60;
// var iter = 1;
// console.log(iter);

ParticlesClass.prototype.render = function() {
	
	if (this.gpuSolver.isPassLoaded("solver") && this.rendererLoaded) {

		this.gpuSolver.runPass( "solver", 0, 0 );
		this.renderer.render( this.renderScene, this.camera );
	} else {
		requestAnimationFrame(this.render.bind(this));
	}
}


/*
 * Updates the canvas, viewport, and camera based on the new dimensions.
 */
ParticlesClass.prototype.resize = function() {
	this.canvas.width = window.innerWidth / 2;
	this.canvas.height = window.innerWidth / 2;

	this.renderer.setSize( this.canvas.width, this.canvas.height );

	// set this the right way
	this.camera.aspect = this.canvas.width / this.canvas.height;
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



var main = function() {
	var userSolver = "res/shaders/static.frag";
	var userRenderer = "res/shaders/render.frag";
	var particlesClass = new ParticlesClass(userSolver, userRenderer, "#particles-canvas");

	particlesClass.render();
}










