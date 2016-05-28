precision highp float;
precision highp int;

const vec3 lightPos = vec3( -100, 100, 100 );
const vec3 lightRad = vec3( 15000.0 );

/*
 * DEFAULT

uniform mat4 viewMatrix;

 */

varying vec3 pos;
varying vec3 norm;


void main()
{

  vec3  w_i    = lightPos - pos;
  float dist2  = dot ( w_i, w_i );
  w_i         /= sqrt( dist2 );

  vec3 radiance = max( 0.0, dot( w_i, norm ) ) // lambertian brdf
                  * lightRad / dist2;          // irradiance on surface

  gl_FragColor = vec4( radiance, 1.0 );

}
