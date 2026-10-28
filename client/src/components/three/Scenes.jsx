import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { BackSide, DataTexture, DoubleSide, IcosahedronGeometry, NearestFilter, Quaternion, RedFormat, Vector2, Vector3, BufferAttribute, Color } from 'three'

// Flat toon shading + inverted-hull outlines so every object reads like a printed sticker.
const INK = '#121110'
const PAPER = '#EFE7DA'
const RED = '#DC143C'
const BLUE = '#003893'
const GOLD = '#F2A900'
const ORANGE = '#FF5A1F'
const GREEN = '#2BB673'
const FCBLUE = '#3D7BFF'

// 3-step ramp: shadow / mid / lit. Nearest filtering keeps the bands hard.
const RAMP = (() => {
  const t = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat)
  t.minFilter = t.magFilter = NearestFilter
  t.needsUpdate = true
  return t
})()

// A toon mesh plus an inverted hull: the same geometry, scaled up, black, back faces only.
// Reads like a printed sticker outline and costs one extra draw call.
function Solid({ children, geometry, color, outline = 0.06, side, vertexColors = false, flatShading = false, ...props }) {
  return (
    <group {...props}>
      <mesh geometry={geometry}>
        {children}
        <meshToonMaterial color={color} gradientMap={RAMP} side={side} vertexColors={vertexColors} flatShading={flatShading} />
      </mesh>
      {outline > 0 && (
        <mesh geometry={geometry} scale={1 + outline}>
          {children}
          <meshBasicMaterial color={INK} side={BackSide} />
        </mesh>
      )}
    </group>
  )
}

// shared pointer + device-tilt target, eased in useFrame
function useTilt() {
  const tilt = useRef(new Vector2())
  useEffect(() => {
    const onTilt = (e) => {
      if (e.gamma == null) return
      tilt.current.set(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 40) / 30)))
    }
    window.addEventListener('deviceorientation', onTilt)
    return () => window.removeEventListener('deviceorientation', onTilt)
  }, [])
  return tilt
}

function Leaning({ children, strength = 0.35 }) {
  const g = useRef()
  const tilt = useTilt()
  useFrame((state, dt) => {
    const px = state.pointer.x || tilt.current.x
    const py = state.pointer.y || -tilt.current.y
    const k = Math.min(1, dt * 3)
    g.current.rotation.y += (px * strength - g.current.rotation.y) * k
    g.current.rotation.x += (-py * strength * 0.6 - g.current.rotation.x) * k
  })
  return <group ref={g}>{children}</group>
}

function Rope({ from, to, thickness = 0.018 }) {
  const { pos, len, quat } = useMemo(() => {
    const a = new Vector3(...from)
    const b = new Vector3(...to)
    const dir = b.clone().sub(a)
    return {
      pos: a.clone().add(b).multiplyScalar(0.5),
      len: dir.length(),
      quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()),
    }
  }, [from, to])
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[thickness, thickness, len, 4]} />
      <meshBasicMaterial color={INK} />
    </mesh>
  )
}

// ---------------------------------------------------------------- props

function Crate() {
  return (
    <group>
      <Solid color={RED} outline={0.07}>
        <boxGeometry args={[1.2, 1, 1.2]} />
      </Solid>
      <Solid color={GOLD} outline={0}>
        <boxGeometry args={[1.24, 0.14, 1.24]} />
      </Solid>
      <Solid color={GOLD} outline={0}>
        <boxGeometry args={[0.16, 1.04, 1.24]} />
      </Solid>
      <mesh position={[0.36, 0.26, 0.605]}>
        <boxGeometry args={[0.3, 0.26, 0.02]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>
    </group>
  )
}

const CANOPY_R = 1.55
const CANOPY_THETA = Math.PI / 2.3
const CANOPY_SQUASH = 0.62
const CANOPY_Y = 2.3

function Parachute() {
  const panels = 8
  return (
    <group position={[0, CANOPY_Y, 0]} scale={[1, CANOPY_SQUASH, 1]}>
      {Array.from({ length: panels }, (_, i) => (
        <Solid key={i} color={i % 2 ? BLUE : PAPER} side={DoubleSide} outline={0.04}>
          <sphereGeometry args={[CANOPY_R, 6, 8, (i * Math.PI * 2) / panels, (Math.PI * 2) / panels, 0, CANOPY_THETA]} />
        </Solid>
      ))}
    </group>
  )
}

function Airdrop() {
  const g = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    g.current.rotation.z = Math.sin(t * 0.9) * 0.14
    g.current.rotation.x = Math.sin(t * 0.6) * 0.06
    g.current.position.y = -1.1 + Math.sin(t * 1.3) * 0.08
  })
  // ropes run from the canopy rim down to the crate's top corners
  const rim = CANOPY_R * Math.sin(CANOPY_THETA) * 0.8
  const rimY = CANOPY_Y + CANOPY_R * Math.cos(CANOPY_THETA) * CANOPY_SQUASH
  return (
    <group ref={g} scale={1.05}>
      <Parachute />
      {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([x, z]) => (
        <Rope key={`${x}${z}`} from={[x * rim * 0.72, rimY, z * rim * 0.72]} to={[x * 0.55, 0.5, z * 0.55]} />
      ))}
      <Crate />
    </group>
  )
}

function Helmet({ color = GOLD }) {
  return (
    <group>
      <Solid color={color}>
        <sphereGeometry args={[0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </Solid>
      <Solid color={color} outline={0.05} position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.07, 16]} />
      </Solid>
      {/* visor strip + side rails: the level-3 look */}
      <Solid color={INK} outline={0} position={[0, 0.22, 0.4]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.56, 0.12, 0.08]} />
      </Solid>
      {[-1, 1].map((s) => (
        <Solid key={s} color="#3a3733" outline={0.08} position={[s * 0.46, 0.14, 0]} rotation={[0, 0, s * 0.45]}>
          <boxGeometry args={[0.06, 0.16, 0.42]} />
        </Solid>
      ))}
    </group>
  )
}

function Pan() {
  return (
    <group rotation={[0.5, 0.3, -0.6]}>
      <Solid color="#5a554e" outline={0.05}>
        <cylinderGeometry args={[0.5, 0.44, 0.08, 18]} />
      </Solid>
      <Solid color={INK} outline={0} position={[0.75, 0, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.11]} />
      </Solid>
    </group>
  )
}

function Flame({ position, scale = 1, phase = 0, color = GOLD }) {
  const g = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 6 + phase
    g.current.scale.set(scale, scale * (1 + Math.sin(t) * 0.18), scale)
    g.current.rotation.z = Math.sin(t * 0.7) * 0.15
  })
  return (
    <group ref={g} position={position}>
      <Solid color={color} outline={0.1}>
        <coneGeometry args={[0.16, 0.5, 5]} />
      </Solid>
    </group>
  )
}

function FlameDiamond({ color = ORANGE }) {
  return (
    <group>
      <Solid color={color} outline={0.08} scale={[1, 1.35, 1]}>
        <octahedronGeometry args={[0.45, 0]} />
      </Solid>
      <Flame position={[0, 0.8, 0]} scale={1} />
      <Flame position={[0.22, 0.64, 0.05]} scale={0.7} phase={1.3} color={RED} />
      <Flame position={[-0.22, 0.64, -0.05]} scale={0.7} phase={2.6} color={RED} />
    </group>
  )
}

// Soccer ball: subdivided icosahedron, faces touching the 12 original vertices painted black (pentagons).
function useBallGeometry() {
  return useMemo(() => {
    const geo = new IcosahedronGeometry(1, 1) // polyhedron geometry is already non-indexed
    const phi = (1 + Math.sqrt(5)) / 2
    const dirs = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ].map((d) => new Vector3(...d).normalize())
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const black = new Color(INK)
    const white = new Color(PAPER)
    const v = new Vector3()
    for (let f = 0; f < pos.count; f += 3) {
      let dark = false
      for (let k = 0; k < 3 && !dark; k++) {
        v.fromBufferAttribute(pos, f + k).normalize()
        dark = dirs.some((d) => d.dot(v) > 0.999)
      }
      const c = dark ? black : white
      for (let k = 0; k < 3; k++) c.toArray(colors, (f + k) * 3)
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])
}

function Ball({ radius = 0.42, spin = 1 }) {
  const geo = useBallGeometry()
  const g = useRef()
  useFrame((_, dt) => {
    g.current.rotation.y += dt * spin
    g.current.rotation.x += dt * spin * 0.4
  })
  return (
    <group ref={g} scale={radius}>
      <Solid geometry={geo} color="#ffffff" vertexColors flatShading outline={0.09} />
    </group>
  )
}

function Trophy({ cup = GOLD, base = BLUE }) {
  const profile = useMemo(
    () => [[0.06, 0], [0.12, 0.08], [0.1, 0.3], [0.18, 0.42], [0.36, 0.6], [0.42, 0.95], [0.4, 0.98]].map(([x, y]) => new Vector2(x, y)),
    [],
  )
  return (
    <group position={[0, -0.55, 0]}>
      <Solid color={base} outline={0.08} position={[0, 0.08, 0]}>
        <boxGeometry args={[0.6, 0.16, 0.6]} />
      </Solid>
      <Solid color={cup} side={DoubleSide} outline={0.07} position={[0, 0.12, 0]}>
        <latheGeometry args={[profile, 14]} />
      </Solid>
      {[-1, 1].map((s) => (
        <Solid key={s} color={cup} outline={0.12} position={[s * 0.42, 0.84, 0]} rotation={[0, 0, s * 0.3]}>
          <torusGeometry args={[0.15, 0.04, 6, 12, Math.PI * 1.3]} />
        </Solid>
      ))}
    </group>
  )
}

function Pitch() {
  return (
    <group position={[0, -0.9, 0]}>
      <Solid color={GREEN} outline={0.03}>
        <boxGeometry args={[3.2, 0.18, 2]} />
      </Solid>
      {[
        [0, 0.1, 0, 0.05, 1.9],
        [0, 0.1, 0.9, 3.0, 0.05],
        [0, 0.1, -0.9, 3.0, 0.05],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, 0.02, d]} />
          <meshBasicMaterial color={PAPER} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.41, 24]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>
    </group>
  )
}

function Bob({ children, speed = 1.4, amp = 0.12, phase = 0, spin = 0.5, position = [0, 0, 0] }) {
  const g = useRef()
  useFrame(({ clock }, dt) => {
    g.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed + phase) * amp
    g.current.rotation.y += dt * spin
  })
  return (
    <group ref={g} position={position}>
      {children}
    </group>
  )
}

function Spin({ children, speed = 0.5 }) {
  const g = useRef()
  useFrame((_, dt) => {
    g.current.rotation.y += dt * speed
  })
  return <group ref={g}>{children}</group>
}

// ---------------------------------------------------------------- scenes

function HomeScene() {
  const ring = useRef()
  useFrame((_, dt) => {
    ring.current.rotation.y += dt * 0.25
  })
  const tokens = [
    <Helmet key="h" color={GOLD} />,
    <FlameDiamond key="f" color={ORANGE} />,
    <Ball key="b" radius={0.4} spin={0.6} />,
    <Trophy key="t" cup={GOLD} base={FCBLUE} />,
  ]
  return (
    <Leaning strength={0.3}>
      <Airdrop />
      <group ref={ring} position={[0, -0.6, 0]}>
        {tokens.map((tok, i) => {
          const a = (i / tokens.length) * Math.PI * 2 + 0.4
          return (
            <Bob key={i} position={[Math.cos(a) * 2.3, (i % 2) * 0.6, Math.sin(a) * 2.3]} phase={i * 1.7} spin={0.4}>
              <group scale={0.75}>{tok}</group>
            </Bob>
          )
        })}
      </group>
    </Leaning>
  )
}

const HUB = {
  pubg: () => (
    <Leaning>
      <group position={[1.15, -0.85, -0.4]}>
        <Pan />
      </group>
      <Bob amp={0.08} spin={0.45} position={[-0.15, -0.15, 0]}>
        <group scale={1.3}>
          <Helmet color={GOLD} />
        </group>
      </Bob>
    </Leaning>
  ),
  freefire: () => (
    <Leaning>
      <Bob amp={0.1} spin={0.7} position={[0, -0.25, 0]}>
        <group scale={1.3}>
          <FlameDiamond color={ORANGE} />
        </group>
      </Bob>
    </Leaning>
  ),
  efootball: () => (
    <Leaning strength={0.25}>
      <Pitch />
      <Bob position={[0, 0.05, 0]} amp={0.35} speed={2.4} spin={0}>
        <Ball radius={0.5} spin={2.2} />
      </Bob>
    </Leaning>
  ),
  fcmobile: () => (
    <Leaning>
      <Spin speed={0.35}>
        <group position={[-0.5, -0.1, 0]} scale={1.15}>
          <Trophy cup={GOLD} base={FCBLUE} />
        </group>
        <Bob position={[0.85, -0.55, 0.3]} amp={0.15} spin={0}>
          <Ball radius={0.42} spin={1.4} />
        </Bob>
      </Spin>
    </Leaning>
  ),
}

export default function Scenes({ scene, active = true }) {
  const home = scene === 'home'
  const Hub = HUB[scene]
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: home ? [0, 0.6, 7.6] : [0, 0.4, 5], fov: home ? 40 : 34 }}
      onCreated={({ camera }) => camera.lookAt(0, home ? 0.1 : -0.1, 0)}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      {home ? <HomeScene /> : Hub ? <Hub /> : null}
    </Canvas>
  )
}
