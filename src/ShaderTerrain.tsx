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
    // 1. Terrain & Topology (Elevation)
    // We simulate elevation (DEM) based on the noise map.
    float elevation = random(floor(vUv * 20.0)) + (vUv.y * 0.5); 
    
    // 2. Geospatial Sensing (Multispectral Bands)
    // Simulating what the satellite "sees"
    float visibleReflectance = random(floor(vUv * 50.0));
    float swirReflectance = random(floor(vUv * 50.0 + vec2(100.0))); // Shortwave Infrared
    
    // Simulate cloud movement (The Anatomy of the Sky)
    float cloudMask = smoothstep(0.4, 0.6, random(floor(vUv * 5.0 + vec2(uTime * 0.1))));

    // 3. Earth Physics & Spectral Unmixing
    // Both Snow and Clouds have HIGH visible reflectance.
    // However, Snow absorbs SWIR (low SWIR), while Clouds reflect SWIR (high SWIR).
    // NDSI = (Visible - SWIR) / (Visible + SWIR)
    float ndsi = (visibleReflectance - swirReflectance) / (visibleReflectance + swirReflectance + 0.001);

    vec3 rockColor = vec3(0.3, 0.3, 0.35);      // Dark grey/brown lithosphere
    vec3 snowColor = vec3(0.0, 0.95, 1.0);      // Neon teal (Cryosphere)
    vec3 vegColor = vec3(0.1, 0.8, 0.3);        // Neon green (Biosphere)
    vec3 cloudColor = vec3(1.0, 1.0, 1.0);      // Pure white (Atmosphere)
    
    vec3 finalColor;
    float alpha = 0.9;
    
    // MIXED PIXEL THRESHOLDING (The Core Solution)
    // Resolving the ambiguity between Sky Pixels and Snow Pixels
    
    if (cloudMask > 0.5 && swirReflectance > 0.5) {
        // High Visible + High SWIR = Cloud/Sky Pixel
        finalColor = cloudColor;
        alpha = 0.5; // Clouds are semi-transparent
    } else if (ndsi > 0.3 && elevation > 0.4) {
        // High NDSI + High Elevation Topology = Confirmed Snow Pixel
        // Earth physics dictates snow cannot exist below certain topological elevations in summer
        finalColor = snowColor;
    } else if (elevation < 0.3) {
        // Low elevation = Vegetation / Forest canopy
        finalColor = vegColor;
    } else {
        // Default exposed terrain
        finalColor = rockColor;
    }
    
    // Add grid lines for "scanner" aesthetic
    float gridX = step(0.95, fract(vUv.x * 50.0));
    float gridY = step(0.95, fract(vUv.y * 50.0));
    finalColor += vec3(gridX + gridY) * 0.2;

    gl_FragColor = vec4(finalColor, alpha);
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
