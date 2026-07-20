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
  const drag = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 })
  const lon = useRef(0)
  const lat = useRef(0)
  const fov = useRef(75)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDist = useRef(0)

  useFrame(() => {
    if (!drag.current.active) {
      drag.current.vx *= 0.95
      drag.current.vy *= 0.95
      if (Math.abs(drag.current.vx) > 0.001 || Math.abs(drag.current.vy) > 0.001) {
        lon.current += drag.current.vx
        lat.current = Math.max(-85, Math.min(85, lat.current + drag.current.vy))
      }
    }

    camera.fov += (fov.current - camera.fov) * 0.1
    camera.updateProjectionMatrix()

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
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)

      if (pointers.current.size === 2) {
        drag.current.active = false
        const p = Array.from(pointers.current.values())
        lastPinchDist.current = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
        return
      }

      el.style.cursor = 'grabbing'
      drag.current = { active: true, x: e.clientX, y: e.clientY, vx: 0, vy: 0 }
    }

    const onMove = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointers.current.size === 2) {
        const p = Array.from(pointers.current.values())
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
        fov.current = Math.max(10, Math.min(120, fov.current + (lastPinchDist.current - dist) * 0.2))
        lastPinchDist.current = dist
        return
      }

      if (!drag.current.active) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current.x = e.clientX
      drag.current.y = e.clientY
      drag.current.vx = dx * 0.1
      drag.current.vy = dy * 0.1
      lon.current -= dx * 0.1
      lat.current = Math.max(-85, Math.min(85, lat.current + dy * 0.1))
    }

    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)

      if (pointers.current.size === 1) {
        const p = pointers.current.values().next().value
        if (p) {
          drag.current = { active: true, x: p.x, y: p.y, vx: 0, vy: 0 }
          el.style.cursor = 'grabbing'
        }
        return
      }

      if (pointers.current.size > 0) return

      el.style.cursor = 'grab'
      drag.current.active = false
    }

    const onLeave = () => {
      pointers.current.clear()
      el.style.cursor = 'grab'
      drag.current.active = false
    }

    const onReset = () => {
      lon.current = 0
      lat.current = 0
      fov.current = 75
      drag.current.vx = 0
      drag.current.vy = 0
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      fov.current = Math.max(10, Math.min(120, fov.current + e.deltaY * 0.1))
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('dblclick', onReset)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('dblclick', onReset)
      el.removeEventListener('wheel', onWheel)
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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const handler = (e: WheelEvent) => { e.preventDefault() }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full min-h-[60vh] relative overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute inset-0">
        <Canvas
          camera={{ fov: 75, near: 0.1, far: 1100 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true }}
          onCreated={() => setLoaded(true)}
        >
          <Suspense fallback={null}>
            <SphereScene imageUrl={imageUrl} />
            <PanoramaControls />
          </Suspense>
        </Canvas>
      </div>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d] z-10">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/70 pointer-events-none flex items-center gap-2 z-10">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM15.375 12a1.125 1.125 0 1 0 2.25 0 1.125 1.125 0 0 0-2.25 0ZM7.5 12a1.125 1.125 0 1 0 2.25 0A1.125 1.125 0 0 0 7.5 12Z" />
        </svg>
        Drag to look around &middot; Scroll to zoom &middot; Double-click to reset
      </div>
    </div>
  )
}