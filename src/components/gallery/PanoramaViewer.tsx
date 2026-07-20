'use client'

import { useRef, Suspense, useState, useEffect } from 'react'
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

function PanoramaControls() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const drag = useRef({ active: false, x: 0, y: 0 })
  const lon = useRef(0)
  const lat = useRef(0)

  useFrame(() => {
    const phi = THREE.MathUtils.degToRad(90 - lat.current)
    const theta = THREE.MathUtils.degToRad(lon.current)
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    )
    camera.position.set(0, 0, 0)
    camera.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir)
  })

  useEffect(() => {
    const el = gl.domElement
    el.style.cursor = 'grab'

    const onDown = (e: PointerEvent) => {
      el.style.cursor = 'grabbing'
      drag.current = { active: true, x: e.clientX, y: e.clientY }
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current = { active: true, x: e.clientX, y: e.clientY }
      lon.current -= dx * 0.3
      lat.current = Math.max(-90, Math.min(90, lat.current + dy * 0.3))
    }
    const onUp = () => {
      drag.current.active = false
      el.style.cursor = 'grab'
    }
    const onReset = () => {
      lon.current = 0
      lat.current = 0
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointerleave', onUp)
    el.addEventListener('dblclick', onReset)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointerleave', onUp)
      el.removeEventListener('dblclick', onReset)
    }
  }, [gl])

  return null
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]">
      <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="w-full h-full min-h-[60vh] relative" style={{ touchAction: 'none' }}>
      {!loaded && <LoadingSpinner />}
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1100 }}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
        gl={{ antialias: true }}
        onCreated={() => setLoaded(true)}
      >
        <Suspense fallback={null}>
          <SphereScene imageUrl={imageUrl} />
          <PanoramaControls />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/70 pointer-events-none flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM15.375 12a1.125 1.125 0 1 0 2.25 0 1.125 1.125 0 0 0-2.25 0ZM7.5 12a1.125 1.125 0 1 0 2.25 0A1.125 1.125 0 0 0 7.5 12Z" />
        </svg>
        Drag to look around &middot; Double-click to reset
      </div>
    </div>
  )
}