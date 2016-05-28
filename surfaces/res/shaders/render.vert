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

varying vec3 pos;
varying vec3 norm;


void main( void ) {

  pos = texture2D( texture, position.xy ).xyz;

  vec4 adjPosR = texture2D( texture, position.xy + vec2( divDist, 0.0 ) ); // x+1
  vec4 adjPosL = texture2D( texture, position.xy - vec2( divDist, 0.0 ) ); // x-1
  vec4 adjPosU = texture2D( texture, position.xy + vec2( 0.0, divDist ) ); // y+1
  vec4 adjPosD = texture2D( texture, position.xy - vec2( 0.0, divDist ) ); // y-1


  //
  // no checking for edges because this is faster
  // and edge errors will barely be noticable
  //
  norm.x = adjPosL.y - adjPosR.y;
  norm.z = adjPosD.y - adjPosU.y;
  norm.y = ( adjPosR.x - adjPosL.x ) + ( adjPosU.z - adjPosD.z );

  norm = normalize( norm );
  

  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

}