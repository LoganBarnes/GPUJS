precision highp float;
precision highp int;

const int numTex = 2;
const int numVars = 2;

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

	vec3 bounds = vec3(5,3,5);
	float damper = 0.5;
	vec3 gravity = vec3(0, -9.8, 0);

	vec4 currData = texture2D(textures[0], (vec2(_x, _y) + vec2(0.5)) / vec2(texDims[0]));
	vec4 prevData = texture2D(textures[1], (vec2(_x, _y) + vec2(0.5)) / vec2(texDims[1]));

	vec3 velocity = (currData.xyz - prevData.xyz) / fvars[1];
	velocity += gravity * fvars[0];
	vec3 deltaVel = velocity * fvars[0];
	vec3 newPos = currData.xyz + deltaVel;

	/* bounds check */
	if (newPos.x < -bounds.x)
		newPos.x = currData.x - deltaVel.x * damper;
	if (newPos.y < -bounds.y)
		newPos.y = currData.y - deltaVel.y * damper;
	if (newPos.z < -bounds.z)
		newPos.z = currData.z - deltaVel.z * damper;
	if (newPos.x > bounds.x)
		newPos.x = currData.x - deltaVel.x * damper;
	if (newPos.y > bounds.y)
		newPos.y = currData.y - deltaVel.y * damper;
	if (newPos.z > bounds.z)
		newPos.z = currData.z - deltaVel.z * damper;

	data = vec4(newPos, currData.w);

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