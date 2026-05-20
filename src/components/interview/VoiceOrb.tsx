'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'

interface OrbMeshProps {
  isSpeaking: boolean
  volumeLevel: number
}

function OrbMesh({ isSpeaking, volumeLevel }: OrbMeshProps) {
  const meshRef   = useRef<THREE.Mesh>(null)
  const timeRef   = useRef(0)
  const distRef   = useRef(0)

  const vertexShader = `
    uniform float time;
    uniform float distortion;
    varying vec3 vNormal;
    varying vec3 vPosition;

    vec3 snoiseGrad(vec3 p) {
      return vec3(
        sin(p.x * 2.0 + time) * cos(p.y + time * 0.7),
        sin(p.y * 2.0 + time * 0.8) * cos(p.z + time * 0.5),
        sin(p.z * 2.0 + time * 0.6) * cos(p.x + time * 0.9)
      );
    }

    void main() {
      vNormal   = normal;
      vPosition = position;
      vec3 displaced = position + normal * snoiseGrad(position * 1.5) * distortion * 0.35;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `

  const fragmentShader = `
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      float t = (vPosition.y + 1.0) * 0.5;
      vec3 violet = vec3(0.545, 0.361, 0.965);
      vec3 cyan   = vec3(0.133, 0.827, 0.933);
      vec3 color  = mix(violet, cyan, t + sin(time * 0.5) * 0.15);
      float rim   = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
      color += rim * 0.3;
      gl_FragColor = vec4(color, 0.92);
    }
  `

  const uniforms = useRef({
    time:        { value: 0 },
    distortion:  { value: 0 },
  })

  useFrame((_, delta) => {
    timeRef.current += delta
    const target = volumeLevel * (isSpeaking ? 1.4 : 0.6)
    distRef.current = THREE.MathUtils.lerp(distRef.current, target, 0.12)
    uniforms.current.time.value        = timeRef.current
    uniforms.current.distortion.value  = distRef.current
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15
      meshRef.current.rotation.x += delta * 0.07
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 6]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

interface VoiceOrbProps {
  isSpeaking: boolean
  volumeLevel: number
  size?: number
}

export function VoiceOrb({ isSpeaking, volumeLevel, size = 280 }: VoiceOrbProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return (
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <div className="rounded-full animate-pulse"
          style={{
            width: size * 0.7, height: size * 0.7,
            background: 'var(--accent-gradient)',
            opacity: 0.8,
            boxShadow: '0 0 40px rgba(139,92,246,0.5)',
          }} />
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 2.8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 2, 2]} intensity={1.5} color="#8B5CF6" />
        <pointLight position={[-2, -2, -2]} intensity={1} color="#22D3EE" />
        <OrbMesh isSpeaking={isSpeaking} volumeLevel={volumeLevel} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
