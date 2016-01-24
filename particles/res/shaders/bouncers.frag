precision highp float;
precision highp int;

const int numVars = 2;

uniform sampler2D textures[ numVars ];
uniform ivec3 texDims[ numVars ];

uniform ivec3 outputDim;

uniform bool swapX;


vec4 user_FunctionMain(in int _x, in int _y, in int _index)
{
	vec4 data = vec4(0.0);
	/* start user code */

	vec4 currData = texture2D(textures[0], (vec2(_x, _y) + vec2(0.5)) / vec2(texDims[0]));
	vec4 prevData = texture2D(textures[1], (vec2(_x, _y) + vec2(0.5)) / vec2(texDims[1]));

	/* end user code */
	return vec4(data);
}


void main(void)
{
	/* 2D indices of current thread */
	int threadX = int(floor(gl_FragCoord.x));
	int threadY = int(floor(gl_FragCoord.y));

	/* 1D index of current thread */
	int threadId = threadY * outputDim.x + threadX;

	/* initialize output to zero */
	gl_FragColor = vec4(0.0);

	/* mostly for video input */
	if (swapX)
		threadX = (outputDim.x - threadX) - 1;

	/* bound check then execute user code */
	if (threadX < outputDim.x && threadY < outputDim.y && threadId < outputDim.z)
		gl_FragColor = user_FunctionMain(threadX, threadY, threadId);
}