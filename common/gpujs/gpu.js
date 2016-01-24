
/**
 *  Finds the next biggest power of 2 greater than or equal to x
 */
function next_pow2(x) {
	return Math.pow(2, Math.ceil(Math.log(x)/Math.log(2)));
}

var libLocation = "../common/gpujs/"

/**
 * Texture input types.
 */
var InputType = Object.freeze({

	TEXTURE: 			0,
	IMG_VID: 			1,
	ARRAY: 				2,
	DATA: 				3,
	NUM_INPUT_TYPES: 	4

});


/**
 *  GPU Solver class
 */
var GPU = function(width, height, canvasId) {

	// shader program; primitive shape; cubemap/skybox setup
	this.SolverPass = makeStruct("scene mesh textures dataRTs dataDims resultRT resultDim loaded nextPass");

	// stores solver 'passes'
	this.passes = {};

	// THREEjs requires a camera. Not actually used in solving
	this.camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );

	// use canvas if one is specified
	var renderParams = {};
	if (canvasId !== undefined) {
		var canvas = jQuery( canvasId ).attr( { width: width, height: height} );
		if ( canvas[0] !== undefined )
			renderParams.canvas = canvas[0];
		else
			console.error("no element '" + canvasId + "'");
	}

	// the renderer used to for each solving pass
	this.renderer = new THREE.WebGLRenderer( renderParams );
	this.renderer.setSize( width, height );
	this.renderer.setClearColor( 0x000000, 1 );

	this.canvas = this.renderer.domElement;

	this.deltaTime;
	this.oldDeltaTime;
};


/**
 * Return the current canvas element
 */
GPU.prototype.getCanvas = function() {
	return this.canvas;
};


/**
 * Return the current THREEjs WebGLRenderer
 */
GPU.prototype.getRenderer = function() {
	return this.renderer;
};


// /**
//  * 
//  *  passData = {
//  *  	initialArray (data, required),
//  *  	prevArray (alt data)
//  *  	shader (filepath),
//  * 		swapX (webcam textures)
//  *  }
//  */
// GPU.prototype.addInitialData = function(passName, passData) {

// 	if (passData.initialArray === undefined) {
// 		console.error("'initialArray' must be defined")
// 	}

// 	// should set these dynamically bassed on number of elements
// 	var arrayLength = passData.initialArray.length;
// 	var numElements = arrayLength / 4;
// 	var TEXTURE_WIDTH = next_pow2(Math.sqrt(numElements));
// 	var TEXTURE_HEIGHT = TEXTURE_WIDTH;
// 	var TEXTURE_SIZE = TEXTURE_WIDTH * TEXTURE_HEIGHT;
// 	var TEXTURE_ARRAY_SIZE = TEXTURE_SIZE * 4;

// 	var shader = "res/shaders/default.frag";
// 	if (passData.shader !== undefined)
// 		shader = passData.shader;
// 	else
// 		passData.prevArray = null; // default doesn't use prevData, user shader must be defined

// 	console.log("elements: " + numElements);
// 	console.log("width: " + TEXTURE_WIDTH);
// 	console.log("height: " + TEXTURE_HEIGHT);
// 	console.log("size: " + TEXTURE_SIZE);
// 	console.log("shader: " + shader);
	

// 	var prevRT = null;
// 	if ( passData.prevArray ) { // prevArray exists

// 		if ( passData.prevArray.length !== arrayLength ) {
// 			console.error( "'prevArray' must be same size as 'initialArray'" );
// 			return;
// 		}

// 		// create texture array to fill entire texture
// 		var prevArray = new Float32Array(TEXTURE_SIZE * 4);

// 		// copy over the original data
// 		for ( var i = 0; i < arrayLength; ++i) {
// 			prevArray[i] = passData.prevArray[i];
// 		}
// 		// pad the rest of the array with zeros
// 		for ( var i = arrayLength; i < TEXTURE_ARRAY_SIZE; ++i ) {
// 			prevArray[i] = 0.0;
// 		}

// 		prevRT = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT );
// 		prevRT.texture.dispose();
// 		prevRT.texture = new THREE.DataTexture(prevArray, TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType );
// 		prevRT.texture.wrapS = THREE.ClampToEdgeWrapping;
// 		prevRT.texture.wrapT = THREE.ClampToEdgeWrapping;
// 		prevRT.texture.needsUpdate = true;
// 	}

// 	// create texture array to fill entire texture
// 	var initialArray = new Float32Array(TEXTURE_SIZE * 4);

// 	// copy over the original data
// 	for ( var i = 0; i < arrayLength; ++i) {
// 		initialArray[i] = passData.initialArray[i];
// 	}
// 	// pad the rest of the array with zeros
// 	for ( var i = arrayLength; i < TEXTURE_ARRAY_SIZE; ++i ) {
// 		initialArray[i] = 0.0;
// 	}

// 	// for use in async methods
// 	var gpuLib = this;

// 	// sets update function if necessary
// 	// var usePrev = passData.prevArray !== undefined;

	
// 	var currRT = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT );
// 	currRT.texture.dispose();
// 	currRT.texture = new THREE.DataTexture(initialArray, TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType );
// 	currRT.texture.wrapS = THREE.ClampToEdgeWrapping;
// 	currRT.texture.wrapT = THREE.ClampToEdgeWrapping;
// 	currRT.texture.needsUpdate = true;
	
// 	var resultRT = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT );
// 	resultRT.texture.dispose();
// 	resultRT.texture = new THREE.DataTexture(initialArray, TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType );
// 	resultRT.texture.wrapS = THREE.ClampToEdgeWrapping;
// 	resultRT.texture.wrapT = THREE.ClampToEdgeWrapping;

// 	var solverPass = new this.SolverPass(
// 		new THREE.Scene(),
// 		null,
// 		prevRT,
// 		currRT,
// 		resultRT,
// 		numElements,
// 		false);

// 	this.passes[passName] = solverPass;

// 	var swapX = false;
// 	if (passData.swapX !== undefined)
// 		swapX = passData.swapX;

// 	loadFiles(["res/shaders/solver.vert", shader], function (shaderText) {
		
// 		var uniforms = {
// 				currTex: { type: "t", value: solverPass.currRT.texture },
// 				texWidth: { type: "i", value: TEXTURE_WIDTH },
// 				texHeight: { type: "i", value: TEXTURE_HEIGHT },
// 				outputWidth: { type: "i", value: TEXTURE_WIDTH },
// 				outputHeight: { type: "i", value: TEXTURE_HEIGHT },
// 				numElements: { type: "i", value: solverPass.numElements },
// 				prevDeltaTime: { type: "f", value: 0.001 }, // gets reset
// 				deltaTime: { type: "f", value: 0.001 },  // gets reset
// 				swapX: { type: "i", value: swapX }
// 			}
// 		if ( solverPass.prevRT )
// 				uniforms.prevTex = { type: "t", value: solverPass.prevRT.texture };

// 		// create sovler program
// 		solverPass.mesh = new THREE.Mesh(

// 			new THREE.PlaneGeometry( 2.01, 2.01, 1 ),

// 			new THREE.ShaderMaterial( {

// 				uniforms: uniforms,
// 				vertexShader: shaderText[0],
// 				fragmentShader: shaderText[1]
// 			} )
// 			// new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
// 		);

// 		solverPass.scene.add( solverPass.mesh );

// 		solverPass.loaded = true;
// 	});
// };


/**
 *  
 *  passData = {
 *  	texInput (image, required),
 * 		prevImgVid (image data),
 *  	shader (filepath),
 * 		swapX (webcam textures)
 *  }
 *   ^ not correct. will update later.
 */
GPU.prototype.addInitialPass = function(passName, passData) {

	if (passData.texData === undefined) {
		console.error("'texData' must be defined");
		return;
	}
	if (passData.texData[0].texInput === undefined || passData.texData[0].texInput === null) {
		console.error("the first texInput of 'texData' must be defined");
		return;
	}

	// set these dynamically based on input image
	var outputWidth = 0;
	var  outputHeight = 0;
	if (passData.outputWidth)
		outputWidth = passData.outputWidth;
	else if (passData.texData[0].texInput.width !== undefined)
		outputWidth = passData.texData[0].texInput.width;

	if (passData.outputHeight)
		outputHeight = passData.outputHeight;
	else if (passData.texData[0].texInput.height !== undefined)
		outputHeight = passData.texData[0].texInput.height;

	var outputSize = outputWidth * outputHeight;
	if (passData.texData[0].elements !== undefined)
		outputSize = passData.texData[0].elements;

	var shader = libLocation + "shaders/default.frag";
	if (passData.shader !== undefined)
		shader = passData.shader;
	else
		passData.prevtexInput = null; // default doesn't use prevData, user shader must be defined

	var dataRTs = new Array(passData.texData.length);
	var textures = new Array(passData.texData.length);
	var dataDims = new Array(passData.texData.length * 3);

	for (var i = 0; i < passData.texData.length; i++) {
		var texData = passData.texData[i];
		var texInput = texData.texInput;

		var flipY = false;
		if (texData.flipY !== undefined)
			flipY = texData.flipY;

		var w = 0;
		var h = 0;

		if (texData.width !== undefined)
			w = texData.width;
		else if (texInput.width !== undefined)
			w = texInput.width;

		if (texData.height !== undefined)
			h = texData.height;
		else if (texInput.height !== undefined)
			h = texInput.width;

		var size = w * h;
		if (texData.elements !== undefined)
			size = elements;
		
		if (texInput) {

			var texture;
			switch (texData.inputType) {

			case InputType.TEXTURE:
				texture = texInput;
				break;
			case InputType.IMG_VID:
				texture = new THREE.Texture( texInput );
				break;
			case InputType.ARRAY:
				if (!w || !h) {
					w = next_pow2(Math.sqrt(texInput.length / 4));
					h = w;
					size = texInput.length / 4;

					if (!outputWidth || !outputHeight) {
						outputWidth = w;
						outputHeight = h;
						outputSize = size;
					}
				}

				var dataSize = w * h * 4;
				if (dataSize > texInput.length) {
					var padArray = new Float32Array(w * h * 4);
					padArray.set(texInput);
					texture = new THREE.DataTexture(padArray, w, h, THREE.RGBAFormat, THREE.FloatType );
				} else {
					texture = new THREE.DataTexture(texInput, w, h, THREE.RGBAFormat, THREE.FloatType );
				}

				break;
			default:
				console.error("inputType: '" + texData.inputType + "' is not valid");
				return;
			}

			
			if (texData.linear !== undefined && texData.linear === true) {
				texture.magFilter = THREE.LinearFilter;
				texture.minFilter = THREE.LinearFilter;
			} else {
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.NearestFilter;
			}
			texture.wrapT = THREE.ClampToEdgeWrapping;
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.generateMipmaps = false;

			texture.flipY = flipY;
			texture.needsUpdate = true;

			textures[i] = texture;
		}

		dataDims[i*3  ] = w;
		dataDims[i*3+1] = h;
		dataDims[i*3+2] = size;

	}
	
	var resultRT = new THREE.WebGLRenderTarget(outputWidth, outputHeight );
	resultRT.texture.dispose();
	resultRT.texture = new THREE.DataTexture(null, outputWidth, outputHeight, THREE.RGBAFormat, THREE.FloatType );
	resultRT.texture.magFilter = THREE.NearestFilter;
	resultRT.texture.minFilter = THREE.NearestFilter;

	var resultDim = [ outputWidth, outputHeight, outputSize ];

	// "scene mesh textures dataRTs dataDims resultRT resultDim loaded nextPass"
	var solverPass = new this.SolverPass(
		new THREE.Scene(),
		null,		// mesh (set in async method)
		textures,
		dataRTs,
		dataDims,
		resultRT,
		resultDim,
		false,		// loaded
		null);      // next pass


	this.passes[passName] = solverPass;

	var swapX = false;
	if (passData.swapX !== undefined)
		swapX = passData.swapX;

	// for use in async method
	var gpuLib = this;

	loadFiles([libLocation + "shaders/solver.vert", shader], function (shaderText) {
	
		var uniforms = {
				textures: { type: "tv", value: solverPass.textures },
				texDims: { type: "iv", value: solverPass.dataDims },
				outputDim: { type: "iv", value: solverPass.resultDim },
				prevDeltaTime: { type: "f", value: 0.001 }, // gets reset
				deltaTime: { type: "f", value: 0.001 },  // gets reset
				swapX: { type: "i", value: swapX }
			}

		// create sovler program
		solverPass.mesh = new THREE.Mesh(

			new THREE.PlaneGeometry( 2.01, 2.01, 1 ), 

			new THREE.ShaderMaterial( {

				uniforms: uniforms,
				vertexShader: shaderText[0],
				fragmentShader: shaderText[1]
			} )
			// new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
		);

		solverPass.scene.add( solverPass.mesh );

		solverPass.loaded = true;
		console.log("added pass '" + passName + "'");
	});
};


/**
 * 
 */
GPU.prototype.connectPass = function(passName, passData, numPrevPasses) {

	if (!this.checkPassExists(passName))
		return;

	numPrevPasses = numPrevPasses === undefined ? 1 : numPrevPasses;

	var numPasses = this.getNumPasses(passName);
	var prevPass = this.getPass(passName, numPasses - numPrevPasses);

	// set these dynamically based on input image
	var outputWidth = prevPass.resultDim[0];
	var  outputHeight = prevPass.resultDim[1];
	if (passData.outputWidth)
		outputWidth = passData.outputWidth;
	if (passData.outputHeight)
		outputHeight = passData.outputHeight;

	var shader = libLocation + "shaders/default.frag";
	if (passData.shader !== undefined)
		shader = passData.shader;

	var len = passData.texData.length + 1;

	var dataRTs = new Array(len);
	var textures = new Array(len);
	var dataDims = new Array(len * 3);

	for (var i = 0; i < numPrevPasses; i++) {

		textures[i] = prevPass.resultRT.texture;
		dataDims[i*3  ] = prevPass.resultDim[0];
		dataDims[i*3+1] = prevPass.resultDim[1];
		dataDims[i*3+2] = prevPass.resultDim[2];

		if (prevPass.nextPass)
			prevPass = prevPass.nextPass;
	}

	for (var i = 0; i < passData.texData.length; i++) {
		var texData = passData.texData[i];
		var texInput = texData.texInput;

		var flipY = false;
		if (texData.flipY !== undefined)
			flipY = texData.flipY;

		var w = 0;
		var h = 0;
		if (texInput) {
			w = texInput.width;
			h = texInput.height;
		}
		if (texData.width !== undefined)
			w = texData.width;
		if (texData.height !== undefined)
			h = texData.height;

		var size = w * h;
		if (texData.elements !== undefined)
			size = elements;

		var index = i + numPrevPasses;

		if (texInput) {

			var texture;
			switch (texData.inputType) {

			case InputType.TEXTURE:
				texture = texInput;
				break;
			case InputType.IMG_VID:
				texture = new THREE.Texture( texInput );
				break;
			case InputType.ARRAY:
				texture = new THREE.DataTexture(texInput, w, h, THREE.RGBAFormat, THREE.FloatType );
				break;
			default:
				console.error("inputType: '" + texData.inputType + "' is not valid");

			}

			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;
			texture.wrapT = THREE.ClampToEdgeWrapping;
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.generateMipmaps = false;
			
			texture.flipY = flipY;
			texture.needsUpdate = true;

			textures[index] = texture;
		}

		dataDims[index*3  ] = w;
		dataDims[index*3+1] = h;
		dataDims[index*3+2] = size;

	}
	
	var resultRT = new THREE.WebGLRenderTarget(outputWidth, outputHeight );
	resultRT.texture.dispose();
	resultRT.texture = new THREE.DataTexture(null, outputWidth, outputHeight, THREE.RGBAFormat, THREE.FloatType );
	resultRT.texture.magFilter = THREE.NearestFilter;
	resultRT.texture.minFilter = THREE.NearestFilter;

	var resultDim = [ outputWidth, outputHeight, outputWidth * outputHeight ];


	// "scene mesh textures dataRTs dataDims resultRT resultDim loaded nextPass"
	var solverPass = new this.SolverPass(
		new THREE.Scene(),
		null,		// mesh (set in async method)
		textures,
		dataRTs,
		dataDims,
		resultRT,
		resultDim,
		false,		// loaded
		null);      // next pass


	prevPass.nextPass = solverPass;

	var swapX = false;
	if (passData.swapX !== undefined)
		swapX = passData.swapX;

	// for use in async method
	var gpuLib = this;

	loadFiles([libLocation + "shaders/solver.vert", shader], function (shaderText) {
	
		var uniforms = {
				textures: { type: "tv", value: solverPass.textures },
				texDims: { type: "iv", value: solverPass.dataDims },
				outputDim: { type: "iv", value: solverPass.resultDim },
				prevDeltaTime: { type: "f", value: 0.001 }, // gets reset
				deltaTime: { type: "f", value: 0.001 },  // gets reset
				swapX: { type: "i", value: swapX }
			}

		// create sovler program
		solverPass.mesh = new THREE.Mesh(

			new THREE.PlaneGeometry( 2.01, 2.01, 1 ), 

			new THREE.ShaderMaterial( {

				uniforms: uniforms,
				vertexShader: shaderText[0],
				fragmentShader: shaderText[1]
			} )
			// new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
		);

		solverPass.scene.add( solverPass.mesh );

		solverPass.loaded = true;
		console.log("added connection to '" + passName + "' (total: " + (numPasses+1) + ")");
	});
}


/**
 * return true if passName exists, false otherwise
 */
GPU.prototype.runPass = function(passName, oldDeltaTime, deltaTime) {
	
	if (this.checkPassExists(passName))
	{

		var solverPass = this.passes[passName];
		// console.log(solverPass);

		while (solverPass) {
			solverPass.mesh.material.uniforms.prevDeltaTime.value = oldDeltaTime;
			solverPass.mesh.material.uniforms.deltaTime.value = deltaTime;

			this.renderer.autoClear = true;
			this.renderer.autoClearColor = true;
			this.renderer.autoClearDepth = true;
			this.renderer.render( solverPass.scene, this.camera, solverPass.resultRT );
			solverPass = solverPass.nextPass;
		}

		return true;
	}
	return false;
};


/**
 * return texture object if passName exists, null otherwize
 */
GPU.prototype.getSolverResultTexture = function(passName, passNum) {
	if (this.checkPassExists(passName))
	{
		if (passNum !== undefined)
			return this.getPass(passName, passNum).resultRT.texture;

		return this.getFinalPass(passName).resultRT.texture;
	}
	return null;
};


/**
 * return data array if passName exists, null otherwize
 */
GPU.prototype.getSolverResultArray = function(passName, offset, length, passNum) {
	if (this.checkPassExists(passName))
	{
		var solverPass
		if (passNum !== undefined)
			solverPass = this.getPass(passName, passNum);
		else
			solverPass = this.getFinalPass(passName);

		var w = solverPass.resultDim[0];
		var h = solverPass.resultDim[1];

		// var startRow = offset / w;
		// var endRow = (offset + length) / w + 1;

		// if (endRow > solverPass.resultDim[1]) {
		// 	console.error("out of bounds (offset, length): "+offset+", "+length);
		// 	return [];
		// }

		// var rowLength = endRow - startRow;
		// var arrayOffset = offset % w;

		// var pixArray = new Float32Array(rowLength * w * 4);
		// var gl = this.renderer.getContext();
		// gl.readPixels(0, startRow, w, rowLength, gl.RGBA, gl.FLOAT, pixArray);		

		// var dataArray = new Float32Array(length * 4);
		// for (var i = 0; i < dataArray.length; i++) {
		// 	dataArray[i] = pixArray[arrayOffset + i];
		// };

		var dataArray = new Float32Array(solverPass.resultDim[2] * 4);
		var gl = this.renderer.getContext();
		gl.readPixels(0,0,w,h, gl.RGBA, gl.FLOAT, dataArray);

		return dataArray;
	}
	return null;
};


/**
 * return width if passName exists, -1 otherwize
 */
GPU.prototype.getSolverResultWidth = function(passName) {
	if (this.checkPassExists(passName))
	{
		return this.getFinalPass(passName).resultDim[0];
	}
	return -1;
};


/**
 * return height if passName exists, -1 otherwize
 */
GPU.prototype.getSolverResultHeight = function(passName) {
	if (this.checkPassExists(passName))
	{
		return this.getFinalPass(passName).resultDim[1];
	}
	return -1;
};


/**
 * return size if passName exists, -1 otherwize
 */
GPU.prototype.getSolverResultSize = function(passName) {
	if (this.checkPassExists(passName))
	{
		return this.getFinalPass(passName).resultDim[2];
	}
	return -1;
};


/**
 * return true if passName exists and all connected passes are loaded,
 * 	      false otherwize
 */
GPU.prototype.isPassLoaded = function(passName) {
	if (this.checkPassExists(passName))
	{
		var pass = this.passes[passName];
		while (pass.nextPass) {
			if (!pass.loaded)
				return false;
			pass = pass.nextPass;
		}
		return pass.loaded;
	}
	return false;
}


/**
 * return true if passName exists, false otherwise
 */
GPU.prototype.setUpdateTexture = function(passName, passNum, texNum) {
	if (this.checkPassExists(passName))
	{
		var solverPass = this.getPass(passName, passNum);
		solverPass.textures[texNum].needsUpdate = true;
		return true;
	}
	return false;
}


/**
 * return true if passName exists, false otherwise
 * FOR ROTATING PASSES ONLY
 */
GPU.prototype.rotateSolverTargets = function(passName) {

	if (this.checkPassExists(passName))
	{
		var solverPass = this.passes[passName];
		// pass vars:
		// "scene mesh textures dataRTs dataDims resultRT resultDim loaded nextPass"

		var numRTs = solverPass.dataRTs.length;

		var temp = solverPass.dataRTs[0];

		for (var i = 1; i < numRTs; i++) {
			solverPass.dataRTs[i-1] = solverPass.dataRTs[i];
		}

		solverPass.dataRTs[numRTs-1] = temp;

		// if ( solverPass.prevRT ) {
		// 	var temp = solverPass.dataRTs[0];
		// 	solverPass.prevRT = solverPass.currRT;
		// 	solverPass.currRT = solverPass.resultRT;
		// 	solverPass.resultRT = temp;

		// 	solverPass.mesh.material.uniforms.prevTex.value = solverPass.prevRT.texture;
		// 	solverPass.mesh.material.uniforms.currTex.value = solverPass.currRT.texture;
		// } else {
		// 	var temp = solverPass.currRT;
		// 	solverPass.currRT = solverPass.resultRT;
		// 	solverPass.resultRT = temp;

		// 	solverPass.mesh.material.uniforms.currTex.value = solverPass.currRT.texture;
		// }

		
		return true;	
	}
	return false;
};


/**
 * Prints error message if passName does not exist.
 * returns true if passName exists, false otherwise
 */
GPU.prototype.checkPassExists = function(passName) {
	if (this.passes[passName] === undefined) {
		console.error("Solver pass '" + passName + "' does not exist.");
		return false;
	}
	return true;
}


/**
 * Assumes passName exists
 */
GPU.prototype.getFinalPass = function(passName) {
	var pass = this.passes[passName];
	while (pass.nextPass)
		pass = pass.nextPass;
	return pass;
}


/**
 * Assumes passName exists
 */
GPU.prototype.getNumPasses = function(passName) {
	var pass = this.passes[passName];
	var counter = 1;

	while (pass.nextPass) {
		++counter;
		pass = pass.nextPass;
	}
	return counter;
}


/**
 * Assumes passName exists
 * Uses zero based indexing
 */
GPU.prototype.getPass = function(passName, passNum) {
	var pass = this.passes[passName];
	var counter = 0;

	while (pass) {
		if (counter === passNum)
			return pass;
		++counter;
		pass = pass.nextPass;
	}
	return null;
}































