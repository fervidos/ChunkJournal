'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Tunables — every "magic number" in the controls lives here so behavior can
// be tuned in one place instead of hunting through event handlers.
// ---------------------------------------------------------------------------
const MAX_FOV = 120 // fully zoomed out — also the default starting view
const MIN_FOV = 10
const LAT_CLAMP = 85 // stop just short of the poles to avoid a gimbal flip

const DRAG_INERTIA_DAMPING = 0.95 // per-frame velocity decay once released
const INERTIA_STOP_THRESHOLD = 0.001 // deg/frame below which momentum snaps to 0

const PINCH_ZOOM_SENSITIVITY = 0.2
const WHEEL_ZOOM_SENSITIVITY = 0.1
const KEY_PAN_STEP_DEG = 3
const KEY_ZOOM_STEP = 5

const IDLE_AUTOROTATE_DELAY_MS = 6000
const AUTOROTATE_DEG_PER_FRAME = 0.03

const SPHERE_RADIUS = 500
const SPHERE_WIDTH_SEGMENTS = 60
const SPHERE_HEIGHT_SEGMENTS = 40

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

// ---------------------------------------------------------------------------
// Sphere + manual texture loading. We load the texture ourselves (instead of
// useLoader + Suspense) so we can report real download progress, surface
// load failures instead of a silent blank canvas, and explicitly dispose the
// GPU texture when the image changes or the component unmounts.
// ---------------------------------------------------------------------------
function SphereScene({
  imageUrl,
  reloadToken,
  onProgress,
  onLoaded,
  onError,
}: {
  imageUrl: string
  reloadToken: number
  onProgress: (fraction: number) => void
  onLoaded: () => void
  onError: (message: string) => void
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    setTexture(null)

    const loader = new THREE.TextureLoader()
    loader.load(
      imageUrl,
      (loadedTexture) => {
        if (cancelled) {
          loadedTexture.dispose()
          return
        }
        loadedTexture.colorSpace = THREE.SRGBColorSpace
        setTexture(loadedTexture)
        onLoaded()
      },
      (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total)
      },
      () => {
        if (!cancelled) onError('This panorama could not be loaded.')
      },
    )

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, reloadToken])

  // Dispose the previous GPU texture whenever it's replaced or on unmount —
  // plain (non-JSX) three.js objects aren't auto-disposed by R3F.
  useEffect(() => {
    return () => texture?.dispose()
  }, [texture])

  if (!texture) return null

  return (
    <mesh>
      <sphereGeometry args={[SPHERE_RADIUS, SPHERE_WIDTH_SEGMENTS, SPHERE_HEIGHT_SEGMENTS]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Camera rig: pointer drag + inertia, pinch/wheel zoom, keyboard panning,
// idle auto-rotate, and optional device-orientation ("gyroscope") control.
// ---------------------------------------------------------------------------
function PanoramaControls({ gyroEnabled }: { gyroEnabled: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)

  const drag = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 })
  const lon = useRef(0)
  const lat = useRef(0)
  const fov = useRef(MAX_FOV)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDist = useRef(0)
  const lastInteraction = useRef(Date.now())
  const reducedMotion = useRef(prefersReducedMotion())

  // Scratch objects reused every frame instead of allocated fresh each time.
  const dirVec = useRef(new THREE.Vector3()).current
  const gyroQuaternion = useRef(new THREE.Quaternion()).current
  const gyroEuler = useRef(new THREE.Euler()).current
  const gyroScreenAdjust = useRef(new THREE.Quaternion()).current
  const gyroBaseAdjust = useRef(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5))).current
  const zAxis = useRef(new THREE.Vector3(0, 0, 1)).current

  const deviceOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null)
  const screenAngle = useRef(0)

  // --- Device orientation listeners (only active while gyro mode is on) ---
  useEffect(() => {
    if (!gyroEnabled) return

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha == null) return
      deviceOrientation.current = { alpha: e.alpha, beta: e.beta ?? 0, gamma: e.gamma ?? 0 }
      lastInteraction.current = Date.now()
    }
    const handleScreenOrientation = () => {
      const angle =
        (screen.orientation && 'angle' in screen.orientation ? screen.orientation.angle : 0) ?? 0
      screenAngle.current = THREE.MathUtils.degToRad(angle)
    }

    handleScreenOrientation()
    window.addEventListener('deviceorientation', handleOrientation)
    window.addEventListener('orientationchange', handleScreenOrientation)

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      window.removeEventListener('orientationchange', handleScreenOrientation)
      deviceOrientation.current = null
    }
  }, [gyroEnabled])

  useFrame(() => {
    camera.position.set(0, 0, 0)

    if (gyroEnabled && deviceOrientation.current) {
      const { alpha, beta, gamma } = deviceOrientation.current
      gyroEuler.set(
        THREE.MathUtils.degToRad(beta),
        THREE.MathUtils.degToRad(alpha),
        THREE.MathUtils.degToRad(-gamma),
        'YXZ',
      )
      gyroQuaternion.setFromEuler(gyroEuler)
      gyroQuaternion.multiply(gyroBaseAdjust)
      gyroQuaternion.multiply(gyroScreenAdjust.setFromAxisAngle(zAxis, -screenAngle.current))
      camera.quaternion.copy(gyroQuaternion)
      return
    }

    const idleFor = Date.now() - lastInteraction.current
    if (!drag.current.active && !reducedMotion.current && idleFor > IDLE_AUTOROTATE_DELAY_MS) {
      lon.current += AUTOROTATE_DEG_PER_FRAME
    }

    if (!drag.current.active) {
      drag.current.vx *= DRAG_INERTIA_DAMPING
      drag.current.vy *= DRAG_INERTIA_DAMPING
      if (
        Math.abs(drag.current.vx) > INERTIA_STOP_THRESHOLD ||
        Math.abs(drag.current.vy) > INERTIA_STOP_THRESHOLD
      ) {
        lon.current += drag.current.vx
        lat.current = THREE.MathUtils.clamp(lat.current + drag.current.vy, -LAT_CLAMP, LAT_CLAMP)
      } else {
        drag.current.vx = 0
        drag.current.vy = 0
      }
    }

    camera.fov += (fov.current - camera.fov) * 0.1
    camera.updateProjectionMatrix()

    const phi = THREE.MathUtils.degToRad(90 - lat.current)
    const theta = THREE.MathUtils.degToRad(lon.current)
    dirVec.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))

    camera.up.set(0, 1, 0)
    camera.lookAt(dirVec)
  })

  useEffect(() => {
    // Pointer/wheel/keyboard controls are disabled while gyro drives the camera.
    if (gyroEnabled) return

    const el = gl.domElement
    el.style.cursor = 'grab'
    el.tabIndex = 0
    el.style.outline = 'none'

    const markInteraction = () => {
      lastInteraction.current = Date.now()
    }

    const onFocus = () => {
      el.style.boxShadow = 'inset 0 0 0 2px var(--color-accent, #fff)'
    }
    const onBlur = () => {
      el.style.boxShadow = 'none'
    }

    const onDown = (e: PointerEvent) => {
      markInteraction()
      el.focus()
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)

      if (pointers.current.size === 2) {
        drag.current.active = false
        drag.current.vx = 0
        drag.current.vy = 0
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
        markInteraction()
        const p = Array.from(pointers.current.values())
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
        fov.current = THREE.MathUtils.clamp(
          fov.current + (lastPinchDist.current - dist) * PINCH_ZOOM_SENSITIVITY,
          MIN_FOV,
          MAX_FOV,
        )
        lastPinchDist.current = dist
        return
      }

      if (!drag.current.active) return
      markInteraction()

      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current.x = e.clientX
      drag.current.y = e.clientY

      // Degrees-per-pixel scales with the current FOV, so the point under
      // the cursor tracks 1:1 with the drag at any zoom level — the same
      // feel as Google Earth / Street View.
      const degPerPx = fov.current / el.clientHeight
      const dLon = -dx * degPerPx
      const dLat = dy * degPerPx

      drag.current.vx = dLon
      drag.current.vy = dLat
      lon.current += dLon
      lat.current = THREE.MathUtils.clamp(lat.current + dLat, -LAT_CLAMP, LAT_CLAMP)
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
      if (reducedMotion.current) {
        drag.current.vx = 0
        drag.current.vy = 0
      }
    }

    const onLeave = () => {
      pointers.current.clear()
      el.style.cursor = 'grab'
      drag.current.active = false
    }

    const onReset = () => {
      markInteraction()
      lon.current = 0
      lat.current = 0
      fov.current = MAX_FOV
      drag.current.vx = 0
      drag.current.vy = 0
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      markInteraction()
      fov.current = THREE.MathUtils.clamp(
        fov.current + e.deltaY * WHEEL_ZOOM_SENSITIVITY,
        MIN_FOV,
        MAX_FOV,
      )
    }

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          lon.current -= KEY_PAN_STEP_DEG
          break
        case 'ArrowRight':
          lon.current += KEY_PAN_STEP_DEG
          break
        case 'ArrowUp':
          lat.current = THREE.MathUtils.clamp(lat.current + KEY_PAN_STEP_DEG, -LAT_CLAMP, LAT_CLAMP)
          break
        case 'ArrowDown':
          lat.current = THREE.MathUtils.clamp(lat.current - KEY_PAN_STEP_DEG, -LAT_CLAMP, LAT_CLAMP)
          break
        case '+':
        case '=':
          fov.current = THREE.MathUtils.clamp(fov.current - KEY_ZOOM_STEP, MIN_FOV, MAX_FOV)
          break
        case '-':
        case '_':
          fov.current = THREE.MathUtils.clamp(fov.current + KEY_ZOOM_STEP, MIN_FOV, MAX_FOV)
          break
        default:
          return
      }
      markInteraction()
      e.preventDefault()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('dblclick', onReset)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('dblclick', onReset)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
    }
  }, [gl, gyroEnabled])

  return null
}

function LoadingOverlay({ progress }: { progress: number | null }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d0d] z-10">
      <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      {progress !== null && (
        <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d0d] z-10 text-white/70 text-sm px-6 text-center">
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
      >
        Try again
      </button>
    </div>
  )
}

export default function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [progress, setProgress] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [gyroSupported, setGyroSupported] = useState(false)
  const [gyroEnabled, setGyroEnabled] = useState(false)

  useEffect(() => {
    setStatus('loading')
    setProgress(null)
  }, [imageUrl, retryKey])

  useEffect(() => {
    setGyroSupported(typeof window !== 'undefined' && 'DeviceOrientationEvent' in window)
  }, [])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen?.()
    }
  }, [])

  const enableGyro = useCallback(async () => {
    type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    const DOE = DeviceOrientationEvent as DeviceOrientationEventIOS
    try {
      if (typeof DOE.requestPermission === 'function') {
        const result = await DOE.requestPermission()
        if (result !== 'granted') return
      }
      setGyroEnabled(true)
    } catch {
      setGyroEnabled(false)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full min-h-[60vh] relative overflow-hidden bg-[#0d0d0d]"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute inset-0">
        <Canvas
          camera={{ fov: MAX_FOV, near: 0.1, far: 1100 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <SphereScene
            imageUrl={imageUrl}
            reloadToken={retryKey}
            onProgress={setProgress}
            onLoaded={() => setStatus('loaded')}
            onError={(message) => {
              setErrorMessage(message)
              setStatus('error')
            }}
          />
          <PanoramaControls gyroEnabled={gyroEnabled} />
        </Canvas>
      </div>

      {status === 'loading' && <LoadingOverlay progress={progress} />}
      {status === 'error' && (
        <ErrorOverlay message={errorMessage} onRetry={() => setRetryKey((k) => k + 1)} />
      )}

      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {gyroSupported && (
          <button
            onClick={() => (gyroEnabled ? setGyroEnabled(false) : enableGyro())}
            aria-pressed={gyroEnabled}
            aria-label={gyroEnabled ? 'Disable motion control' : 'Enable motion control'}
            className="p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.25 9.75-1.72 4.53a.6.6 0 0 1-.76.35l-.02-.01a.6.6 0 0 1-.35-.76l1.72-4.53a.6.6 0 0 1 .76-.35l.02.01a.6.6 0 0 1 .35.76Z"
              />
            </svg>
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M15 9V4.5M15 9h4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/70 pointer-events-none flex items-center gap-2 z-10 text-center">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm0 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM15.375 12a1.125 1.125 0 1 0 2.25 0 1.125 1.125 0 0 0-2.25 0ZM7.5 12a1.125 1.125 0 1 0 2.25 0A1.125 1.125 0 0 0 7.5 12Z"
          />
        </svg>
        {gyroEnabled
          ? 'Move your device to look around'
          : 'Drag to look around · Scroll to zoom · Arrow keys to pan · Double-click to reset'}
      </div>
    </div>
  )
}