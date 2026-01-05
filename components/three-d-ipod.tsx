"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Html, RoundedBox, Environment, ContactShadows, Float, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"

interface ThreeDIpodProps {
        screen: React.ReactNode
        wheel: React.ReactNode
        skinColor: string
}

function IpodModel({ screen, wheel, skinColor }: ThreeDIpodProps) {
        const meshRef = useRef<THREE.Group>(null)

        useFrame((state) => {
                if (!meshRef.current) return

                // Smooth mouse look - reduced range to keep focus on front
                const { x, y } = state.mouse
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, y * 0.25, 0.05)
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.25, 0.05)
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

        return (
                <group ref={meshRef}>
                        <Float speed={2.0} rotationIntensity={0.15} floatIntensity={0.4} floatingRange={[-0.1, 0.1]}>
                                <group>
                                        {/* 1. BACK CASE (Anodized Aluminum) */}
                                        <RoundedBox args={[args.width, args.height, args.depth]} radius={args.radius} smoothness={10}>
                                                <meshPhysicalMaterial
                                                        color="#e0e0e0"
                                                        roughness={0.4}
                                                        metalness={1.0}
                                                        anisotropy={0.5}
                                                        anisotropyRotation={Math.PI / 2}
                                                        clearcoat={0.1}
                                                        envMapIntensity={1.5}
                                                />
                                        </RoundedBox>

                                        {/* 2. FRONT FACE (The colored shell) */}
                                        {/* Sits ON TOP of the back case. Back case ends at Z=0.175. */}
                                        <group position={[0, 0, z.frontFaceCenter]}>
                                                <RoundedBox args={[args.width, args.height, 0.03]} radius={args.radius} smoothness={10}>
                                                        <meshPhysicalMaterial
                                                                color={skinColor}
                                                                roughness={0.25}
                                                                metalness={0.1}
                                                                clearcoat={0.2}
                                                                envMapIntensity={1.0}
                                                        />
                                                </RoundedBox>
                                        </group>

                                        {/* 3. SCREEN ASSEMBLY */}
                                        <group position={[0, 1.25, 0]}>

                                                {/* 3a. Screen Bezel (Black Background) */}
                                                <mesh position={[0, 0, z.screenBezel]}>
                                                        <planeGeometry args={[3.25, 2.45]} />
                                                        <meshBasicMaterial color="#050505" />
                                                </mesh>

                                                {/* 3b. LCD Content */}
                                                <Html
                                                        transform
                                                        scale={0.01}
                                                        position={[0, 0, z.screenHtml]}
                                                        style={{
                                                                width: '322px',
                                                                height: '240px',
                                                        }}
                                                        className="select-none pointer-events-none"
                                                >
                                                        {screen}
                                                </Html>

                                                {/* 3c. Screen Glass (Physical Volume) */}
                                                {/* Placed visibly above the HTML to get real refractions/reflections */}
                                                {/* Thickness 0.02. Center Z needs to be such that bottom surface is above HTML */}
                                                <group position={[0, 0, z.screenGlass]}>
                                                        <RoundedBox args={[3.25, 2.45, 0.02]} radius={0.05} smoothness={4}>
                                                                <meshPhysicalMaterial
                                                                        color="#ffffff"
                                                                        transmission={1.0}
                                                                        thickness={0.05}
                                                                        roughness={0.0}
                                                                        metalness={0.0}
                                                                        ior={1.5}
                                                                        envMapIntensity={2.0}
                                                                        clearcoat={1.0}
                                                                        transparent
                                                                        opacity={1.0}
                                                                />
                                                        </RoundedBox>
                                                </group>
                                        </group>

                                        {/* 4. CLICK WHEEL ASSEMBLY */}
                                        <group position={[0, -1.5, 0]}>
                                                {/* Wheel Physical Disc */}
                                                <mesh position={[0, 0, z.wheelBase]}>
                                                        <circleGeometry args={[1.2, 50]} />
                                                        <meshStandardMaterial
                                                                color="#F8F8F8"
                                                                roughness={0.5}
                                                                metalness={0.05}
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
                        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
                                <PerspectiveCamera makeDefault position={[0, 0, 11]} fov={30} />

                                <ambientLight intensity={0.6} />

                                <spotLight
                                        position={[10, 10, 10]}
                                        angle={0.3}
                                        penumbra={1}
                                        intensity={200}
                                        castShadow
                                />

                                <spotLight
                                        position={[-10, 5, -10]}
                                        angle={0.5}
                                        intensity={100}
                                        color="#bfdbfe"
                                />

                                <rectAreaLight intensity={2} position={[-5, 5, 5]} width={10} height={10} color="#fff" />

                                <Environment preset="city" blur={0.8} background={false} />

                                <IpodModel {...props} />

                                <ContactShadows resolution={1024} scale={20} blur={2.5} opacity={0.5} far={10} color="#000000" />
                        </Canvas>
                </div>
        )
}
