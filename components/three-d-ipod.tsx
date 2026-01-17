"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Html, RoundedBox, Environment, ContactShadows, Float, PerspectiveCamera, useTexture } from "@react-three/drei"
import * as THREE from "three"

interface ThreeDIpodProps {
        screen: React.ReactNode
        wheel: React.ReactNode
        skinColor: string
}

function IpodModel({ screen, wheel, skinColor }: ThreeDIpodProps) {
        const meshRef = useRef<THREE.Group>(null)
        const screenGroupRef = useRef<THREE.Group>(null)

        useFrame((state) => {
                if (!meshRef.current) return

                // Smooth mouse look - reduced range to keep focus on front
                const { x, y } = state.mouse
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, y * 0.25, 0.05)
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.25, 0.05)

                // Subtle floating animation for screen glow
                if (screenGroupRef.current) {
                        const time = state.clock.elapsedTime
                        screenGroupRef.current.children.forEach((child, i) => {
                                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
                                        // Subtle pulsing backlight effect
                                        const baseIntensity = 0.3
                                        const pulse = Math.sin(time * 0.5) * 0.1
                                        child.material.emissiveIntensity = baseIntensity + pulse
                                }
                        })
                }
        })

        // Dimensions
        const args = {
                width: 3.75,
                height: 6.25,
                depth: 0.35,
                radius: 0.36,
        }

        // Z-Stacking Layers (Calculated from center 0)
        const z = {
                back: 0,
                frontFaceCenter: 0.175 + 0.015, // Starts at 0.175, Thickness 0.03
                screenBezel: 0.175 + 0.03 + 0.001, // Just on top of front face
                screenHtml: 0.175 + 0.03 + 0.005, // Slightly above bezel
                screenGlass: 0.175 + 0.03 + 0.02, // Floating slightly above to contain volume
                wheelBase: 0.175 + 0.03 + 0.002,
                wheelHtml: 0.175 + 0.03 + 0.006,
        }

        // Custom gradient texture for brushed aluminum effect
        const brushedAluminumTexture = useMemo(() => {
                const canvas = document.createElement('canvas')
                canvas.width = 512
                canvas.height = 512
                const ctx = canvas.getContext('2d')!

                // Create vertical brushed metal pattern
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
                for (let i = 0; i < 100; i++) {
                        const pos = i / 100
                        const brightness = 0.8 + Math.random() * 0.2
                        gradient.addColorStop(pos, `rgba(${brightness * 255}, ${brightness * 255}, ${brightness * 255}, 1)`)
                }
                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                const texture = new THREE.CanvasTexture(canvas)
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping
                texture.repeat.set(4, 1)
                return texture
        }, [])

        // LCD Screen backlight glow shader
        const lcdShaderMaterial = useMemo(() => {
                return new THREE.ShaderMaterial({
                        uniforms: {
                                time: { value: 0 },
                                color: { value: new THREE.Color(0xc7d0c0) }
                        },
                        vertexShader: `
                                varying vec2 vUv;
                                void main() {
                                        vUv = uv;
                                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                        `,
                        fragmentShader: `
                                uniform float time;
                                uniform vec3 color;
                                varying vec2 vUv;
                                
                                void main() {
                                        // Subtle vignette effect
                                        vec2 center = vUv - 0.5;
                                        float dist = length(center);
                                        float vignette = 1.0 - smoothstep(0.3, 0.7, dist);
                                        
                                        // Subtle scanline effect
                                        float scanline = sin(vUv.y * 100.0 + time) * 0.02 + 0.98;
                                        
                                        // LCD backlight glow
                                        vec3 finalColor = color * vignette * scanline;
                                        gl_FragColor = vec4(finalColor, 1.0);
                                }
                        `,
                        transparent: false,
                })
        }, [])

        useFrame((state) => {
                lcdShaderMaterial.uniforms.time.value = state.clock.elapsedTime
        })

        return (
                <group ref={meshRef}>
                        <Float speed={2.0} rotationIntensity={0.15} floatIntensity={0.4} floatingRange={[-0.1, 0.1]}>
                                <group>
                                        {/* 1. BACK CASE (Anodized Aluminum with Brushed Finish) */}
                                        <RoundedBox args={[args.width, args.height, args.depth]} radius={args.radius} smoothness={10}>
                                                <meshPhysicalMaterial
                                                        color="#e8e8e8"
                                                        roughness={0.35}
                                                        metalness={1.0}
                                                        roughnessMap={brushedAluminumTexture}
                                                        // Anisotropic reflection (brushed aluminum)
                                                        anisotropy={16}
                                                        anisotropyRotation={Math.PI / 2}
                                                        clearcoat={0.15}
                                                        clearcoatRoughness={0.3}
                                                        envMapIntensity={2.0}
                                                        reflectivity={0.8}
                                                />
                                        </RoundedBox>

                                        {/* 2. FRONT FACE (Polycarbonate/Plastic Shell) */}
                                        <group position={[0, 0, z.frontFaceCenter]}>
                                                <RoundedBox args={[args.width, args.height, 0.03]} radius={args.radius} smoothness={10}>
                                                        <meshPhysicalMaterial
                                                                color={skinColor}
                                                                roughness={0.2}
                                                                metalness={0.0}
                                                                clearcoat={0.5}
                                                                clearcoatRoughness={0.15}
                                                                envMapIntensity={1.2}
                                                                sheen={0.3}
                                                                sheenRoughness={0.5}
                                                                sheenColor={new THREE.Color(skinColor).multiplyScalar(1.2)}
                                                        />
                                                </RoundedBox>
                                        </group>

                                        {/* 3. SCREEN ASSEMBLY */}
                                        <group position={[0, 1.25, 0]} ref={screenGroupRef}>

                                                {/* 3a. Screen Bezel with LCD Shader Background */}
                                                <mesh position={[0, 0, z.screenBezel]}>
                                                        <planeGeometry args={[3.25, 2.45]} />
                                                        <primitive object={lcdShaderMaterial} attach="material" />
                                                </mesh>

                                                {/* 3b. LCD Content - The actual interface */}
                                                <Html
                                                        transform
                                                        scale={0.01}
                                                        position={[0, 0, z.screenHtml]}
                                                        style={{
                                                                width: '322px',
                                                                height: '240px',
                                                        }}
                                                        className="select-none pointer-events-none"
                                                        occlude={false}
                                                        zIndexRange={[100, 0]}
                                                >
                                                        {screen}
                                                </Html>

                                                {/* 3c. Screen Glass (Anti-Reflective Coating) */}
                                                <group position={[0, 0, z.screenGlass]}>
                                                        <RoundedBox args={[3.25, 2.45, 0.02]} radius={0.05} smoothness={4}>
                                                                <meshPhysicalMaterial
                                                                        color="#ffffff"
                                                                        transmission={0.95}
                                                                        thickness={0.05}
                                                                        roughness={0.05}
                                                                        metalness={0.0}
                                                                        ior={1.52}
                                                                        envMapIntensity={1.5}
                                                                        clearcoat={1.0}
                                                                        clearcoatRoughness={0.1}
                                                                        transparent
                                                                        opacity={1.0}
                                                                        // Subtle tint for realism
                                                                        attenuationColor={new THREE.Color(0xf0f5f0)}
                                                                        attenuationDistance={0.5}
                                                                />
                                                        </RoundedBox>
                                                </group>
                                        </group>

                                        {/* 4. CLICK WHEEL ASSEMBLY */}
                                        <group position={[0, -1.5, 0]}>
                                                {/* Wheel Ring (Polycarbonate Touch Surface) */}
                                                <mesh position={[0, 0, z.wheelBase]}>
                                                        <ringGeometry args={[0.75, 1.2, 64]} />
                                                        <meshPhysicalMaterial
                                                                color="#F5F5F5"
                                                                roughness={0.15}
                                                                metalness={0.0}
                                                                clearcoat={0.8}
                                                                clearcoatRoughness={0.1}
                                                                envMapIntensity={1.0}
                                                                sheen={0.5}
                                                                sheenRoughness={0.3}
                                                                sheenColor="#ffffff"
                                                        />
                                                </mesh>

                                                {/* Center Button (Chrome/Metal) */}
                                                <mesh position={[0, 0, z.wheelBase + 0.001]}>
                                                        <circleGeometry args={[0.73, 50]} />
                                                        <meshPhysicalMaterial
                                                                color="#d0d0d0"
                                                                roughness={0.2}
                                                                metalness={0.95}
                                                                clearcoat={0.5}
                                                                envMapIntensity={1.8}
                                                        />
                                                </mesh>

                                                {/* Wheel Interface */}
                                                <Html
                                                        transform
                                                        scale={0.01}
                                                        position={[0, 0, z.wheelHtml]}
                                                        style={{
                                                                width: '240px',
                                                                height: '240px',
                                                        }}
                                                        className="select-none"
                                                        occlude={false}
                                                        zIndexRange={[100, 0]}
                                                >
                                                        <div style={{ pointerEvents: 'auto' }}>
                                                                {wheel}
                                                        </div>
                                                </Html>
                                        </group>

                                </group>
                        </Float>
                </group>
        )
}

export function ThreeDIpod(props: ThreeDIpodProps) {
        return (
                <div className="w-full h-full min-h-screen absolute inset-0">
                        <Canvas shadows dpr={[1, 2]} gl={{
                                antialias: true,
                                toneMapping: THREE.ACESFilmicToneMapping,
                                toneMappingExposure: 1.0
                        }}>
                                <PerspectiveCamera makeDefault position={[0, 0, 11]} fov={30} />

                                {/* Ambient base light */}
                                <ambientLight intensity={0.4} color="#f0f0f5" />

                                {/* Key Light - Main illumination from top-right */}
                                <spotLight
                                        position={[8, 12, 10]}
                                        angle={0.3}
                                        penumbra={1}
                                        intensity={250}
                                        castShadow
                                        shadow-mapSize={[2048, 2048]}
                                        shadow-bias={-0.0001}
                                        color="#ffffff"
                                />

                                {/* Fill Light - Softer from left */}
                                <spotLight
                                        position={[-10, 5, 8]}
                                        angle={0.5}
                                        penumbra={1}
                                        intensity={80}
                                        color="#e0f0ff"
                                />

                                {/* Rim Light - Back highlight for depth */}
                                <spotLight
                                        position={[0, 2, -8]}
                                        angle={0.6}
                                        penumbra={1}
                                        intensity={60}
                                        color="#fff8e0"
                                />

                                {/* Subtle area light for screen illumination */}
                                <rectAreaLight
                                        intensity={3}
                                        position={[0, 1, 6]}
                                        width={4}
                                        height={3}
                                        color="#c7d0c0"
                                />

                                {/* HDRI Environment for realistic reflections */}
                                <Environment
                                        preset="studio"
                                        blur={0.6}
                                        background={false}
                                        environmentIntensity={1.2}
                                />

                                <IpodModel {...props} />

                                {/* Enhanced contact shadows */}
                                <ContactShadows
                                        resolution={2048}
                                        scale={20}
                                        blur={2.0}
                                        opacity={0.6}
                                        far={10}
                                        color="#000000"
                                        position={[0, -3.5, 0]}
                                />
                        </Canvas>
                </div>
        )
}
