import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Basic displacement for terrain feel
    vec3 pos = position;
    // Simulate some elevation based on sin waves
    pos.z += sin(pos.x * 0.5) * cos(pos.y * 0.5) * 2.0;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  
  // Pseudo-random noise for generating synthetic "satellite" data
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    // Generate a synthetic NDSI (Normalized Difference Snow Index) value
    // In production, this would be a texture sampled from the backend tile server
    float noise = random(floor(vUv * 50.0)); // Pixelated look to simulate satellite resolution
    
    // Smooth out the noise slightly over time
    float ndsi = noise + sin(uTime * 0.5 + vUv.x * 10.0) * 0.1;

    vec3 rockColor = vec3(0.3, 0.3, 0.35);      // Dark grey/brown
    vec3 snowColor = vec3(0.0, 0.95, 1.0);      // Neon teal (Sheryians aesthetic for snow)
    vec3 vegColor = vec3(0.1, 0.8, 0.3);        // Neon green
    
    vec3 finalColor;
    
    // MIXED PIXEL THRESHOLDING (The Core Solution)
    // Instead of linear interpolation (blurring), we use hard step functions
    if (ndsi > 0.6) {
        finalColor = snowColor;
    } else if (ndsi > 0.3) {
        finalColor = rockColor;
    } else {
        finalColor = vegColor;
    }
    
    // Add grid lines for "scanner" aesthetic
    float gridX = step(0.95, fract(vUv.x * 50.0));
    float gridY = step(0.95, fract(vUv.y * 50.0));
    finalColor += vec3(gridX + gridY) * 0.2;

    gl_FragColor = vec4(finalColor, 0.9);
  }
`

export default function ShaderTerrain() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  )

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[50, 50, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false}
        transparent={true}
      />
    </mesh>
  )
}
