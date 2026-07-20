'use client'

import { useRef, Suspense } from 'react'
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

function SphereScene({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(TextureLoader, imageUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh>
      <sphereGeometry args={[500, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

function CameraController() {
  const { camera } = useThree()
  const isDragging = useRef(false)
  const prev = useRef({ x: 0, y: 0 })
  const lon = useRef(0)
  const lat = useRef(0)

  useFrame(() => {
    const phi = THREE.MathUtils.degToRad(90 - lat.current)
    const theta = THREE.MathUtils.degToRad(lon.current)
    camera.position.set(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta),
    )
    camera.lookAt(0, 0, 0)
  })

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation()
        const canvas = (e.currentTarget as Element).closest('canvas')
        if (canvas) canvas.style.cursor = 'grabbing'
        isDragging.current = true
        prev.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return
        const dx = e.clientX - prev.current.x
        const dy = e.clientY - prev.current.y
        lon.current -= dx * 0.3
        lat.current = Math.max(-90, Math.min(90, lat.current + dy * 0.3))
        prev.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={() => {
        isDragging.current = false
        const canvas = document.querySelector('canvas')
        if (canvas) canvas.style.cursor = 'grab'
      }}
      onPointerLeave={() => {
        isDragging.current = false
      }}
    />
  )
}

export default function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="w-full h-full relative" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ fov: 75, near: 1, far: 1100 }}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <SphereScene imageUrl={imageUrl} />
          <CameraController />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/70 pointer-events-none flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        Drag to look around &middot; 360&deg; Panorama
      </div>
    </div>
  )
}