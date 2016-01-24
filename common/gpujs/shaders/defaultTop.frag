precision highp float;
precision highp int;

const int numTex = /*** set at runtime ***/;
const int numVars = /*** set at runtime ***/;

/* input data and dimensions */
uniform sampler2D textures[ numTex ];
uniform ivec3 texDims[ numTex ];

/* output dimensions */
uniform ivec3 outputDim;

/* constant input variables (like time, scale, etc.) */
uniform float fvars[ numVars ];

/* used to flip images over the vertical axis */
uniform bool swapX;


vec4 user_FunctionMain(in int _x, in int _y, in int _index)
{
	vec4 data = vec4(0.0);
	/* start user code */