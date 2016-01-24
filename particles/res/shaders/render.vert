precision highp float;
precision highp int;

// void main(void) {
// 	gl_Position = vec4(position.xy, 0.0, 1.0);
// }


const float PI = 3.14159265359;
const float density = 100.0;

/*
 * DEFAULT

attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

 */

uniform sampler2D uTexture;
uniform int texWidth;
uniform int texHeight;

uniform int screenHeight;

varying float vUseParticle;

void main(void) {

	vec2 texRes = vec2(texWidth, texHeight);

	vec2 tCoord = vec2(mod(position.x, texRes.x), floor(position.x / texRes.y));
	tCoord += vec2(0.5);
	tCoord *= 1.0 / texRes;

	vec4 pos = texture2D(uTexture, tCoord);

	if (pos.w == 0.0)
	{
		vUseParticle = 0.0;
		gl_Position = vec4(0.0);
		return;
	}
	vUseParticle = 1.0;

	 // function of mass and density
	float radius = pow((3.0 * pos.w) / (density * 4.0 * PI), 1.0 / 3.0);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
	gl_PointSize = float(screenHeight) * projectionMatrix[1][1] * radius / gl_Position.w;

	// gl_Position = vec4(position, 1.0);

	// gl_Position = projectionMatrix * modelViewMatrix * vec4(0, 0, 0, 1);
	// gl_PointSize = 100.0;
	// vUseParticle = 1.0;
}
