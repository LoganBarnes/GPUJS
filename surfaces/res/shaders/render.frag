precision highp float;
precision highp int;

// uniform sampler2D tex;
// uniform vec2 texResolution;

// void main(void)
// {
// 	int threadX = int(floor(gl_FragCoord.x));
// 	int threadY = int(floor(gl_FragCoord.y));

// 	gl_FragColor = texture2D(tex, (vec2(threadX, threadY) + vec2(0.5)) / texResolution);
// 	gl_FragColor.w = 1.0;
// }

const vec3 lightDirection = vec3(1, -1, -1);

/*
 * DEFAULT

uniform mat4 viewMatrix;

 */

varying float vUseParticle;


void main()
{
	if (vUseParticle < 0.5)
		discard;

	vec3 lightDir = normalize(mat3(viewMatrix) * -lightDirection);
	
	// calculate normal from texture coordinates
	vec3 N;
	N.xy = gl_PointCoord * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
	float mag = dot(N.xy, N.xy);

	if (mag > 1.0) discard; // kill pixels outside circle

	N.z = sqrt(1.0 - mag);

	// calculate lighting
	vec3 diffuse = vec3(max(0.0, dot(lightDir, N)));
	vec3 shadingColor = diffuse + vec3(.3); // plus ambient

	gl_FragColor = vec4(shadingColor, 1.0);
	// gl_FragColor = vec4(1);
}
