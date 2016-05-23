precision highp float;
precision highp int;

const vec3 lightDirection = vec3( 1, -1, -1 );

/*
 * DEFAULT

uniform mat4 viewMatrix;

 */

varying vec3 norm;


void main()
{

 //  vec3 w_i = normalize( -lightDirection );

	// vec3 diffuse = vec3( max( 0.0, dot( w_i, norm ) ) );
	// vec3 shadingColor = diffuse + vec3( 0.3 ); // plus ambient

 //  gl_FragColor = vec4( shadingColor * vec3( 0.2, 0.2, .9 ), 1 );
	gl_FragColor = vec4( 0.1, 0.1, 0.7, 1.0 );

}
