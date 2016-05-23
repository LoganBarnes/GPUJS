precision highp float;
precision highp int;
 
/*
 * DEFAULT
 
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
 
 */

uniform sampler2D texture;
uniform float     divDist;

varying vec3 norm;


void main( void ) {

  vec4 pos    = texture2D( texture, position.xy );

  // vec4 adjPosR = texture2D( texture, position.xy + vec2( divDist, 0.0 ) ); // x+1
  // vec4 adjPosL = texture2D( texture, position.xy - vec2( divDist, 0.0 ) ); // x-1
  // vec4 adjPosU = texture2D( texture, position.xy + vec2( 0.0, divDist ) ); // y+1
  // vec4 adjPosD = texture2D( texture, position.xy - vec2( 0.0, divDist ) ); // y-1

  // vec3 tang;
  // norm = vec3( 0.0 );
  // int totalNorms = 0;

  // //
  // // no checking for edges because this is faster
  // // and edge errors will barely be noticable
  // //
  // tang = adjPosR.xyz - pos.xyz;
  // norm += normalize( vec3( -tang.y, tang.x, 0.0 ) );
  // totalNorms += 1;

  // tang = adjPosL.xyz - pos.xyz;
  // norm += normalize( vec3( tang.y, -tang.x, 0.0 ) );
  // totalNorms += 1;

  // tang = adjPosU.xyz - pos.xyz;
  // norm += normalize( vec3( 0.0, tang.z, -tang.y ) );
  // totalNorms += 1;

  // tang = adjPosD.xyz - pos.xyz;
  // norm += normalize( vec3( 0.0, -tang.z, tang.y ) );
  // totalNorms += 1;

  // norm /= float( totalNorms );

  // norm = position;

  gl_Position = projectionMatrix * modelViewMatrix * pos;

}