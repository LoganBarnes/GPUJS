// FPS Tracker
javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();stats.domElement.style.cssText='position:fixed;left:0;top:0;z-index:10000';document.body.appendChild(stats.domElement);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()


/*
put big SURFACES text here
*/


var SurfaceClass = function (canvasId) {

  /*
   * GPU SOLVER CODE
   */

  // create the GPU solver
  this.canvas = document.getElementById("surface-canvas");
  this.gpuSolver = new GPU(this.canvas.width, this.canvas.height, "#surface-canvas");

  this.canvasId = canvasId;
  this.oldDeltaTime = 0.02;
  this.deltaTime    = 0.02;

  // camera and mouse functionality
  this.anglePhi = 20;
  this.angleTheta = 0;
  this.zoomZ = 50;

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
  // this.paused = true;
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

SurfaceClass.prototype.init = function(renderShader) {
  
  var meshDivisions =  500;
  var texDivisions  =  200;
  var lowerLeft     = -75.0;
  var upperRight    =  75.0;
  var size          =  upperRight - lowerLeft;
  var divDist       =  size / ( texDivisions + 1 );
  var texDim        =  texDivisions + 2;

  var numParticles  = texDim * texDim;

  this.oldDeltaTime = 0.02;
  var radius = 7;
  var velocity = 3;

  var dist = velocity * this.oldDeltaTime;

  var gpuSolver = this.gpuSolver;
  var oldDeltaTime = this.oldDeltaTime;
  var deltaTime = this.deltaTime;

  this.gpuSolver.setInitialFunction("solver", function() {    

    var currInitialArray = new Float32Array( numParticles * 4 );

    var index = 0;

    for ( var z = 0; z < texDim; ++z ) {

      for ( var x = 0; x < texDim; ++x ) {

        currInitialArray[ index++ ] = lowerLeft + divDist * x;
        currInitialArray[ index++ ] = 0.0;
        currInitialArray[ index++ ] = lowerLeft + divDist * z;
        currInitialArray[ index++ ] = 1.0;

      }

    }

    currInitialArray[ 1 ]                               = 30.0; // top left
    currInitialArray[ texDim * 4 - 3]                   = 50.0; // top right
    currInitialArray[ texDim * texDim * 4 - 3 ]         = 40.0; // bottom right
    currInitialArray[ texDim * ( texDim - 1 ) * 4 + 1 ] = 20.0; // bottom left

    
    var passData = {
      texData: [ {
        texInput:  currInitialArray,
        width:     texDim,
        height:    texDim,
        inputType: InputType.ROTATING
      },
      {
        texInput:  currInitialArray,
        width:     texDim,
        height:    texDim,
        inputType: InputType.ROTATING
      } ],
      fvars:        [oldDeltaTime, oldDeltaTime],
      outputWidth:  texDim,
      outputHeight: texDim,
      outputSize:   numParticles
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
  var currTex = this.gpuSolver.getSolverTexture("solver", 0, 0);
  var passWidth = this.gpuSolver.getSolverResultWidth("solver");
  var passHeight = this.gpuSolver.getSolverResultHeight("solver");
  var passSize = this.gpuSolver.getSolverResultSize("solver");





  /*
   * ADDITIONAL RENDER AND MANIPULATION CODE
   */

  // create a camera and a new scene
  this.camera = new THREE.PerspectiveCamera( 75, this.canvas.width / this.canvas.height, 0.1, 5000 );
  this.renderScene = new THREE.Scene();
  this.rendererLoaded = false;

  // for use in async method
  var surfaceClass = this;

  loadFiles(["res/shaders/render.vert", renderShader], function (shaderText) {

    var geometry = new THREE.PlaneGeometry( 2, 2, meshDivisions + 1, meshDivisions + 1 );
    var divDistUniform = 1.0 / ( meshDivisions + 1 );

    // create sovler program
    surfaceClass.renderMesh = new THREE.Mesh(

      geometry,

      new THREE.ShaderMaterial( {

        uniforms: {
          texture: { type: "t", value: currTex },
          divDist: { type: "f", value: divDistUniform }
        },
        vertexShader:   shaderText[0],
        fragmentShader: shaderText[1],

        wireframe: true
        // side: THREE.BackSide
      } )

    );

    console.log(surfaceClass.renderMesh );

    surfaceClass.renderScene.add( surfaceClass.renderMesh );

    surfaceClass.updateCamera();

    surfaceClass.rendererLoaded = true;

    // var container = document.getElementById("canvas-container");
    // // surfaceClass.resize(container.width, container.height);
    // console.log(container.width);
    // surfaceClass.resize();
    surfaceClass.resize(550, 550);

    if (surfaceClass.paused)
      surfaceClass.render()
  });
}

SurfaceClass.prototype.reset = function() {
  this.gpuSolver.reinitialize("solver");
  this.renderMesh.material.uniforms.texture.value = this.gpuSolver.getSolverTexture( "solver", 0, 0 );
}


SurfaceClass.prototype.setShader = function(text, passNum) {
  var errors = this.gpuSolver.compileShaderText("solver", passNum, text);
  var annotations = [];

  if (errors != null) {
    annotations = new Array(errors.length);

    for (var i = 0; i < annotations.length; ++i) {
      annotations[i] = {
        row: errors[i].lineNum - 1,
        column: 0,
        text: errors[i].lineText,
        type: "error"
      }
    }
  }

  return annotations;
}


SurfaceClass.prototype.addFluidPass = function() {
  this.gpuSolver.connectPass("solver", {
    texData: [],
    usePrevTextures: true
  });
  this.gpuSolver.connectPass("solver", {
    texData: [],
    usePrevTextures: true
  }, 2);
};



SurfaceClass.prototype.removeFluidPass = function() {
  if (this.gpuSolver.getNumPasses("solver") > 0) {
    this.gpuSolver.disconnectPass("solver", 1);
  }
};


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

SurfaceClass.prototype.handleMouseDown = function(mouseEvent) {
  this.mouseDown = true;
  var pos = this.getMousePos(mouseEvent);
  this.lastMouseX = pos.x;
  this.lastMouseY = pos.y;
}

SurfaceClass.prototype.handleMouseUp = function(mouseEvent) {
  this.mouseDown = false;
}

SurfaceClass.prototype.handleMouseWheel = function(mouseEvent) {
  mouseEvent.preventDefault(); // no page scrolling when using the canvas

  // if (this.moveCamera) {
    if (mouseEvent.deltaMode == 1) {
      this.zoomZ += mouseEvent.deltaX * 0.3;
    } else {
      this.zoomZ += mouseEvent.deltaY * 0.03;
    }
    this.zoomZ = Math.max(0.001, this.zoomZ);
  // }

  this.updateCamera();

  if (this.paused && this.rendererLoaded)
    this.render();
}

SurfaceClass.prototype.handleMouseMove = function(mouseEvent) {
  
  if (!this.mouseDown)
    return;

  var pos = this.getMousePos(mouseEvent);

  // var translation
  var deltaX = pos.x - this.lastMouseX;
  var deltaY = pos.y - this.lastMouseY;

  // if (this.moveCamera) {
    this.anglePhi += deltaY * 0.25;
    this.angleTheta -= deltaX * 0.25;
    this.anglePhi = Math.max(-89.99, this.anglePhi);
    this.anglePhi = Math.min( 89.99, this.anglePhi);
  // }

  this.lastMouseX = pos.x
  this.lastMouseY = pos.y;

  this.updateCamera();

  if (this.paused && this.rendererLoaded)
    this.render();
}

/*
 * Key Events
 */

SurfaceClass.prototype.handleKeyDown = function(keyEvent) {
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
    case 192: // `
      if (this.paused) {
        this.tick();
      }
      break;
    default:
      // console.log(keyEvent.keyCode);
      break;
  }
}

SurfaceClass.prototype.handleKeyUp = function(keyEvent) {
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
    case 192: // `
      // if (this.paused) {
      //   this.tick();
      // }
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

SurfaceClass.prototype.render = function() {
  this.renderer.render(this.renderScene, this.camera);
};

SurfaceClass.prototype.tick = function() {
  if (!this.paused) {
    requestAnimationFrame(this.tick.bind(this));
  } else {
    this.lastTime = new Date().getTime() - 20;
  }

  if (this.gpuSolver.isPassLoaded("solver") && this.rendererLoaded) {

    // update time
    var timeNow = new Date().getTime(); // milliseconds
    var deltaTime = (timeNow - this.lastTime) / 1000.0; // seconds
    deltaTime = Math.min(deltaTime, 0.05);
    this.lastTime = timeNow;

    this.gpuSolver.rotateFVars("solver", deltaTime);
    this.gpuSolver.runPass( "solver" );
    
    this.renderMesh.material.uniforms.texture.value = this.gpuSolver.getSolverResultTexture( "solver" );
    this.render();

    this.gpuSolver.rotateSolverTargets("solver");

  } else {
    this.lastTime = new Date().getTime() - 20;
  }
}


SurfaceClass.prototype.updateCamera = function() {
  var phi = degToRad(this.anglePhi);
  var theta = degToRad(this.angleTheta);

  this.camera.position.x = Math.cos(phi) * Math.sin(theta) * this.zoomZ;
  this.camera.position.y = Math.sin(phi) * this.zoomZ;
  this.camera.position.z = Math.cos(phi) * Math.cos(theta) * this.zoomZ;
  this.camera.lookAt( this.renderScene.position );
}


/*
 * Updates the canvas, viewport, and camera based on the new dimensions.
 */
SurfaceClass.prototype.resize = function(canvasContainerWidth, canvasContainerHeight) {
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
SurfaceClass.prototype.getMousePos = function(evt) {
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

var surfaceClass = null;










