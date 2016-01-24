
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