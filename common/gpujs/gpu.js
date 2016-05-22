
var vertString = " \
precision highp float; \
precision highp int; \
 \
void main(void) { \
	gl_Position = vec4(position.xy, 0.0, 1.0); \
} \
";

var fragTopString = " \
/* input data and dimensions */\n\
uniform sampler2D textures[ numTex ];\n\
uniform ivec3 texDims[ numTex ];\n\
\n\
/* output dimensions */\n\
uniform ivec3 outputDim;\n\
\n\
/* constant input variables (like time, scale, etc.) */\n\
uniform float fvars[ numVars ];\n\
\n\
/* used to flip images over the vertical axis */\n\
uniform bool swapX;\n\
\n\
\n\
float randv(vec2 co)\n\
{\n\
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\
}\
\n\
\n\
float rand(float x, float y)\n\
{\n\
    return randv(vec2(x, y));\
}\
\n\
\n\
float randi(int x, int y)\n\
{\n\
    return randv(vec2(x, y));\
}\
\n\
\n\
vec4 user_FunctionMain(in int _x, in int _y, in int _index)\n\
{\n\
vec4 data = vec4(0.0);\n\
/* start user code */;\n\
";

var fragBottomString = " \
/* end user code */\n\
return vec4(data);\n\
}\n\
\n\
\n\
void main(void)\n\
{\n\
	/* 2D indices of current thread */\n\
	int threadX = int(floor(gl_FragCoord.x));\n\
	int threadY = int(floor(gl_FragCoord.y));\n\
\n\
	/* 1D index of current thread */\n\
	int threadId = threadY * outputDim.x + threadX;\n\
\n\
	/* initialize output to zero */\n\
	gl_FragColor = vec4(0.0);\n\
\n\
	/* mostly for video input */\n\
	if (swapX)\n\
		threadX = (outputDim.x - threadX) - 1;\n\
\n\
	/* bound check then execute user code */\n\
	if (threadX < outputDim.x && threadY < outputDim.y && threadId < outputDim.z)\n\
		gl_FragColor = user_FunctionMain(threadX, threadY, threadId);\n\
}\n\
";


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
	ROTATING: 			4,
	NUM_INPUT_TYPES: 	5

});


/*
                                                                                
    ,o888888o.    8 888888888o   8 8888      88            8 8888   d888888o.   
   8888     `88.  8 8888    `88. 8 8888      88            8 8888 .`8888:' `88. 
,8 8888       `8. 8 8888     `88 8 8888      88            8 8888 8.`8888.   Y8 
88 8888           8 8888     ,88 8 8888      88            8 8888 `8.`8888.     
88 8888           8 8888.   ,88' 8 8888      88            8 8888  `8.`8888.    
88 8888           8 888888888P'  8 8888      88            8 8888   `8.`8888.   
88 8888   8888888 8 8888         8 8888      88 88.        8 8888    `8.`8888.  
`8 8888       .8' 8 8888         ` 8888     ,8P `88.       8 888'8b   `8.`8888. 
   8888     ,88'  8 8888           8888   ,d8P    `88o.    8 88' `8b.  ;8.`8888 
    `8888888P'    8 8888            `Y88888P'       `Y888888 '    `Y8888P ,88P' 
*/


/**
 *  GPU Solver class
 */
var GPU = function(width, height, canvasId) {

	// shader program; primitive shape; cubemap/skybox setup
	this.SolverPass = makeStruct("scene mesh textures dataRTs dataDims resultRT resultDim fvars loaded swapX nextPass numPrevPasses usesPrevTextures");

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
	this.initialFunction = null;
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


/**
 *
 */
GPU.prototype.setInitialFunction = function(passName, fun) {
	this.initialFunction = fun;
	this.addInitialPass(passName, this.initialFunction());
};


/*
                                                                                         
8 888888888o      .8.            d888888o.      d888888o.   8 8888888888     d888888o.   
8 8888    `88.   .888.         .`8888:' `88.  .`8888:' `88. 8 8888         .`8888:' `88. 
8 8888     `88  :88888.        8.`8888.   Y8  8.`8888.   Y8 8 8888         8.`8888.   Y8 
8 8888     ,88 . `88888.       `8.`8888.      `8.`8888.     8 8888         `8.`8888.     
8 8888.   ,88'.8. `88888.       `8.`8888.      `8.`8888.    8 888888888888  `8.`8888.    
8 888888888P'.8`8. `88888.       `8.`8888.      `8.`8888.   8 8888           `8.`8888.   
8 8888      .8' `8. `88888.       `8.`8888.      `8.`8888.  8 8888            `8.`8888.  
8 8888     .8'   `8. `88888.  8b   `8.`8888. 8b   `8.`8888. 8 8888        8b   `8.`8888. 
8 8888    .888888888. `88888. `8b.  ;8.`8888 `8b.  ;8.`8888 8 8888        `8b.  ;8.`8888 
8 8888   .8'       `8. `88888. `Y8888P ,88P'  `Y8888P ,88P' 8 888888888888 `Y8888P ,88P' 
*/

/**
 *  
 *  passData = {
 *  	texInput (image, required),
 * 		prevImgVid (image data),
 *      fvars (float array),
 *  	shader (filepath),
 * 		swapX (webcam textures)
 *  }
 *   ^ not correct. will update later.
 */
GPU.prototype.addInitialPass = function(passName, passData) {

	// "scene mesh textures dataRTs dataDims resultRT resultDim fvars loaded swapX nextPass numPrevPasses usesPrevTextures"
	var solverPass = new this.SolverPass(
		new THREE.Scene(),
		null,		// mesh (set in async method)
		[],			// textures
		[],			// dataRTs
		[0, 0, 0],  // dataDims
		[],			// resultRT
		[0, 0, 0],  // resultDim
		(passData.fvars !== undefined ? passData.fvars : []),
		false,		// loaded
		false,      // swap X
		null,       // next pass
		0,          // # previous passes needed for this pass (always 0 for initial pass)
		false 		// uses previous textures
		);


	this.passes[passName] = solverPass;

	this.resetInitialPass(passName, passData);
};


GPU.prototype.disconnectPass = function(passName, passNum) {
	// TODO: connect pass after with pass before
	// prevPass.next = pass.next;
	if (this.checkPassExists(passName)) {
		if (passNum === undefined || passNum < 1)
			delete this.passes[passName];
		else
			this.getPass(passName, passNum - 1).nextPass = null;
	}
};


/**
 * 
 */
GPU.prototype.connectPass = function(passName, passData, numPrevPasses) {

	if (!this.checkPassExists(passName))
		return;

	if (passData.texData === undefined) {
		console.error("'texData' must be defined");
		return;
	}

	numPrevPasses = (numPrevPasses === undefined ? 1 : numPrevPasses);
	var usesPrevTextures = (passData.usePrevTextures === undefined ? false : passData.usePrevTextures);

	var numPasses = this.getNumPasses(passName);
	var prevPass = this.getPass(passName, numPasses - numPrevPasses);

	// set these dynamically based on input image
	var outputWidth = prevPass.resultDim[0];
	var outputHeight = prevPass.resultDim[1];
	var outputSize = prevPass.resultDim[2];

	if (passData.outputWidth)
		outputWidth = passData.outputWidth;
	if (passData.outputHeight)
		outputHeight = passData.outputHeight;
	if (passData.outputSize)
		outputSize = passData.outputSize;

	var prevTexLen = prevPass.textures.length;
	if (!usesPrevTextures)
		prevTexLen = 0;

	var len = passData.texData.length + prevTexLen + numPrevPasses;

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

	for (var i = 0; i < prevTexLen; ++i) {
		var index = i + numPrevPasses;
		textures[index] = prevPass.textures[i];

		dataDims[index*3  ] = prevPass.dataDims[i*3  ];
		dataDims[index*3+1] = prevPass.dataDims[i*3+1];
		dataDims[index*3+2] = prevPass.dataDims[i*3+2];
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

		var index = i + prevTexLen + numPrevPasses;

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

	var resultDim = [ outputWidth, outputHeight, outputSize ];

	var swapX = false;
	if (passData.swapX !== undefined)
		swapX = passData.swapX;

	// "scene mesh textures dataRTs dataDims resultRT resultDim fvars loaded swapX nextPass numPrevPasses usesPrevTextures"
	var solverPass = new this.SolverPass(
		new THREE.Scene(),
		null,          // mesh (set in async method)
		textures,
		dataRTs,
		dataDims,
		resultRT,
		resultDim,
		(passData.fvars !== undefined ? passData.fvars : []),
		false,         // loaded
		swapX,
		null,          // next pass
		numPrevPasses, // results from previous passes
		usesPrevTextures
	);

	prevPass.nextPass = solverPass;

}




/**
 *  
 *  passData = {
 *  	texInput (image, required),
 * 		prevImgVid (image data),
 *      fvars (float array),
 *  	shader (filepath),
 * 		swapX (webcam textures)
 *  }
 *   ^ not correct. will update later.
 */
GPU.prototype.resetInitialPass = function(passName, passData) {

	if (passData.texData === undefined) {
		console.error("'texData' must be defined");
		return;
	}
	if (passData.texData[0].texInput === undefined || passData.texData[0].texInput === null) {
		console.error("the first texInput of 'texData' must be defined");
		return;
	}

	if (!this.checkPassExists(passName)) {
		console.error("Pass: '" + passName + "' does not exist");
		return;
	}

	var solverPass = this.getPass(passName, 0);

	// set these dynamically based on input image
	solverPass.resultDim[0] = 0;
	solverPass.resultDim[1] = 0;
	if (passData.outputWidth)
		solverPass.resultDim[0] = passData.outputWidth;
	else if (passData.texData[0].texInput.width !== undefined)
		solverPass.resultDim[0] = passData.texData[0].texInput.width;

	if (passData.outputHeight)
		solverPass.resultDim[1] = passData.outputHeight;
	else if (passData.texData[0].texInput.height !== undefined)
		solverPass.resultDim[1] = passData.texData[0].texInput.height;

	solverPass.resultDim[2] = solverPass.resultDim[0] * solverPass.resultDim[1];
	if (passData.texData[0].elements !== undefined)
		solverPass.resultDim[2] = passData.texData[0].elements;

	solverPass.dataRTs = new Array(passData.texData.length);
	solverPass.textures = new Array(passData.texData.length);
	solverPass.dataDims = new Array(passData.texData.length * 3);

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

					if (!solverPass.resultDim[0] || !solverPass.resultDim[1]) {
						solverPass.resultDim[0] = w;
						solverPass.resultDim[1] = h;
						solverPass.resultDim[2] = size;
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
			case InputType.ROTATING:
				if (!w || !h) {
					w = next_pow2(Math.sqrt(texInput.length / 4));
					h = w;
					size = texInput.length / 4;

					if (!solverPass.resultDim[0] || !solverPass.resultDim[1]) {
						solverPass.resultDim[0] = w;
						solverPass.resultDim[1] = h;
						solverPass.resultDim[2] = size;
					}
				}

				var dataRT = new THREE.WebGLRenderTarget( solverPass.resultDim[0], solverPass.resultDim[1] );
				dataRT.texture.dispose();

				var dataSize = w * h * 4;
				if (dataSize > texInput.length) {
					var padArray = new Float32Array(w * h * 4);
					padArray.set(texInput);
					dataRT.texture = new THREE.DataTexture(padArray, w, h, THREE.RGBAFormat, THREE.FloatType );
				} else {
					dataRT.texture = new THREE.DataTexture(texInput, w, h, THREE.RGBAFormat, THREE.FloatType );
				}
				texture = dataRT.texture;
				solverPass.dataRTs[i] = dataRT;

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

			solverPass.textures[i] = texture;
		}

		solverPass.dataDims[i*3  ] = w;
		solverPass.dataDims[i*3+1] = h;
		solverPass.dataDims[i*3+2] = size;

	}
	
	solverPass.resultRT = new THREE.WebGLRenderTarget(solverPass.resultDim[0], solverPass.resultDim[1] );
	solverPass.resultRT.texture.dispose();
	solverPass.resultRT.texture = new THREE.DataTexture(null, solverPass.resultDim[0], solverPass.resultDim[1], THREE.RGBAFormat, THREE.FloatType );
	solverPass.resultRT.texture.magFilter = THREE.NearestFilter;
	solverPass.resultRT.texture.minFilter = THREE.NearestFilter;

	var outputSize = solverPass.resultDim[0] * solverPass.resultDim[1];

	if (passData.outputSize)
		outputSize = passData.outputSize;

	solverPass.resultDim[2] = outputSize;

	solverPass.swapX = false;
	if (passData.swapX !== undefined)
		solverPass.swapX = passData.swapX;
};


/*
                                                                            
8 888888888o      .8.          8 888888888o.     d888888o.   8 8888888888   
8 8888    `88.   .888.         8 8888    `88.  .`8888:' `88. 8 8888         
8 8888     `88  :88888.        8 8888     `88  8.`8888.   Y8 8 8888         
8 8888     ,88 . `88888.       8 8888     ,88  `8.`8888.     8 8888         
8 8888.   ,88'.8. `88888.      8 8888.   ,88'   `8.`8888.    8 888888888888 
8 888888888P'.8`8. `88888.     8 888888888P'     `8.`8888.   8 8888         
8 8888      .8' `8. `88888.    8 8888`8b          `8.`8888.  8 8888         
8 8888     .8'   `8. `88888.   8 8888 `8b.    8b   `8.`8888. 8 8888         
8 8888    .888888888. `88888.  8 8888   `8b.  `8b.  ;8.`8888 8 8888         
8 8888   .8'       `8. `88888. 8 8888     `88. `Y8888P ,88P' 8 888888888888 
*/

GPU.prototype.parseShaderText = function() {
	// TODO: make this
}


/*
                                            .         .                                                                
    ,o888888o.        ,o888888o.           ,8.       ,8.          8 888888888o    8 8888 8 8888         8 8888888888   
   8888     `88.   . 8888     `88.        ,888.     ,888.         8 8888    `88.  8 8888 8 8888         8 8888         
,8 8888       `8. ,8 8888       `8b      .`8888.   .`8888.        8 8888     `88  8 8888 8 8888         8 8888         
88 8888           88 8888        `8b    ,8.`8888. ,8.`8888.       8 8888     ,88  8 8888 8 8888         8 8888         
88 8888           88 8888         88   ,8'8.`8888,8^8.`8888.      8 8888.   ,88'  8 8888 8 8888         8 888888888888 
88 8888           88 8888         88  ,8' `8.`8888' `8.`8888.     8 888888888P'   8 8888 8 8888         8 8888         
88 8888           88 8888        ,8P ,8'   `8.`88'   `8.`8888.    8 8888          8 8888 8 8888         8 8888         
`8 8888       .8' `8 8888       ,8P ,8'     `8.`'     `8.`8888.   8 8888          8 8888 8 8888         8 8888         
   8888     ,88'   ` 8888     ,88' ,8'       `8        `8.`8888.  8 8888          8 8888 8 8888         8 8888         
    `8888888P'        `8888888P'  ,8'         `         `8.`8888. 8 8888          8 8888 8 888888888888 8 888888888888 
*/

GPU.prototype.compileShaderText = function(passName, passNum, text) {

	if (this.checkPassExists(passName)) {

		var solverPass = this.getPass(passName, passNum);

		if (solverPass == null)
			console.error(passName + " " + passNum + " is null");

		var shaderText = "precision highp float;\nprecision highp int;\n\n"
						+ "const int numTex = " + Math.max(1, solverPass.textures.length) + ";\n"
						+ "const int numVars = " + Math.max(1, solverPass.fvars.length) + ";\n"
						+ fragTopString;

		var topStringLines = shaderText.split("\n").length - 1;

		shaderText += text + fragBottomString;

		var errors = this.checkForShaderErrors(shaderText, topStringLines);

		if (errors != null) {
			return errors;
		}

		var scene = solverPass.scene;
		
		// clear scene
		for(var i = scene.children.length-1; i >= 0; i--){
			scene.remove(scene.children[i]);
		}

		var uniforms = {
				textures: { type: "tv", value: solverPass.textures },
				texDims: { type: "iv", value: solverPass.dataDims },
				outputDim: { type: "iv", value: solverPass.resultDim },
				fvars: { type: "1fv", value: solverPass.fvars }, // gets reset
				swapX: { type: "i", value: solverPass.swapX }
			}

		// create sovler program
		solverPass.mesh = new THREE.Mesh(

			new THREE.PlaneGeometry( 2.01, 2.01, 1 ), 

			new THREE.ShaderMaterial( {

				uniforms: uniforms,
				vertexShader: vertString,
				fragmentShader: shaderText
			} )
		);

		solverPass.scene.add( solverPass.mesh );

		solverPass.loaded = true;
		// console.log("added shader to pass " + passNum + " of '" + passName + "'");
	}

	return null;
};


/**
 *
 */
GPU.prototype.checkForShaderErrors = function(shaderText, linesToSub) {
	var gl = this.renderer.getContext();

	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	// store and compile the shaders
	gl.shaderSource(fragmentShader, shaderText);
	gl.compileShader(fragmentShader);


	// make sure the shader compiled successfully
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		var errorString = gl.getShaderInfoLog(fragmentShader);
		var lines = errorString.split('\n');

		var errors = new Array(lines.length-1);

		for (var i = 0; i < errors.length; ++i) {
			var text  = lines[i].substring(9);
			var num = parseInt(text, 10);
			var numString = "" + num;
			
			text = text.substring(numString.length);
			
			num -= linesToSub;
			
			errors[i] = { lineNum: num, lineText: text };				
		}

		return errors;
	}

	return null;
};


/*
                                               
8 888888888o.  8 8888      88 b.             8 
8 8888    `88. 8 8888      88 888o.          8 
8 8888     `88 8 8888      88 Y88888o.       8 
8 8888     ,88 8 8888      88 .`Y888888o.    8 
8 8888.   ,88' 8 8888      88 8o. `Y888888o. 8 
8 888888888P'  8 8888      88 8`Y8o. `Y88888o8 
8 8888`8b      8 8888      88 8   `Y8o. `Y8888 
8 8888 `8b.    ` 8888     ,8P 8      `Y8o. `Y8 
8 8888   `8b.    8888   ,d8P  8         `Y8o.` 
8 8888     `88.   `Y88888P'   8            `Yo 
*/


/**
 *
 */
GPU.prototype.reinitialize = function(passName) {
	if (this.initialFunction != null)
		this.resetInitialPass(passName, this.initialFunction());
	else
		console.error("reinitialize() can't be used until addInitialPass() is used.");
};

/**
 * return true if passName exists, false otherwise
 */
GPU.prototype.runPass = function(passName) {
	
	if (this.checkPassExists(passName))
	{
		var solverPass = this.passes[passName];

		while (solverPass) {
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
 * return texture object if passName exists, null otherwize
 */
GPU.prototype.getSolverTexture = function(passName, passNum, texNum) {
	if (passNum === undefined || texNum === undefined) {
		console.error("getSolverTexture() requires a passNum and texNum");
	}

	if (this.checkPassExists(passName))
	{
		if (this.getNumPasses(passName) <= passNum) {
			console.error("getSolverTexture(): passNum is out of range");
		}
		var solverPass = this.getPass(passName, passNum);

		if (solverPass.textures.length <= texNum) {
			console.error("getSolverTexture(): texNum is out of range");
		}

		return solverPass.textures[texNum];
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
GPU.prototype.rotateFVars = function(passName, firstVar) {

	if (this.checkPassExists(passName))
	{
		var solverPass = this.getPass(passName, 0);

		var numFVars;
		var var1;
		while (solverPass) {
			numFVars = solverPass.fvars.length;
			if (numFVars > 0) {
				var1 = (firstVar !== undefined ? firstVar : solverPass.fvars[numFVars-1]);

				for (var i = numFVars-1; i > 0; i--) {
					solverPass.fvars[i] = solverPass.fvars[i-1];
				}
				solverPass.fvars[0] = var1;
			}
			solverPass = solverPass.next;
		}
		
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
		var solverPass = this.getPass(passName, 0);
		var lastPass = this.getFinalPass(passName);
		
		var numRTs = solverPass.dataRTs.length;
		var oldRT = solverPass.dataRTs[numRTs-1];

		for (var i = numRTs-1; i > 0; i--) {
			solverPass.dataRTs[i] = solverPass.dataRTs[i-1];
			solverPass.textures[i] = solverPass.dataRTs[i].texture;
		}
		solverPass.dataRTs[0] = lastPass.resultRT;
		solverPass.textures[0] = solverPass.dataRTs[0].texture;
		lastPass.resultRT = oldRT;

		var prevPass;
		var index;
		while (solverPass.nextPass) {
			prevPass = solverPass;
			solverPass = solverPass.nextPass;

			if (solverPass.usesPrevTextures) {
				for (var i = 0; i < numRTs; ++i) {
					index = i + solverPass.numPrevPasses;
					solverPass.textures[index] = prevPass.textures[i];

					solverPass.dataDims[index*3  ] = prevPass.dataDims[i*3  ];
					solverPass.dataDims[index*3+1] = prevPass.dataDims[i*3+1];
					solverPass.dataDims[index*3+2] = prevPass.dataDims[i*3+2];
				}
			}
		}
		
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































