precision highp float;
precision highp int;

const int numVars = /* must be set at runtime */

uniform sampler2D textures[ numVars ];
uniform ivec3 texDims[ numVars ];

uniform ivec3 outputDim;

uniform bool swapX;


vec4 user_FunctionMain(in int _x, in int _y, in int _index)
{
	vec4 data = vec4(0.0);
	/* start user code */
