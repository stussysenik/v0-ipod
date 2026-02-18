"use client";

import React, {
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Html,
  RoundedBox,
  Environment,
  ContactShadows,
  Float,
  PerspectiveCamera,
  Lightformer,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import { PostProcessing } from "./post-processing";

// Export handle for capturing high-res renders
export interface ThreeDIpodHandle {
  captureHighRes: (width?: number, height?: number) => Promise<Blob | null>;
}

interface ThreeDIpodProps {
  screen: React.ReactNode;
  wheel: React.ReactNode;
  skinColor: string;
  onReady?: () => void;
}

interface IpodModelProps extends Omit<ThreeDIpodProps, "onReady"> {
  onRegisterReset?: (fn: () => void) => void;
}

function IpodModel({ screen, wheel, skinColor, onRegisterReset }: IpodModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const screenGroupRef = useRef<THREE.Group>(null);

  // Register reset function for export capture
  useEffect(() => {
    if (onRegisterReset) {
      onRegisterReset(() => {
        if (meshRef.current) {
          meshRef.current.rotation.set(0, 0, 0);
        }
      });
    }
  }, [onRegisterReset]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Keep product mostly front-facing, with subtle interactive tilt
    const { x, y } = state.mouse;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      y * 0.16,
      0.06,
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      x * 0.18,
      0.06,
    );

    // Subtle floating animation for screen glow
    if (screenGroupRef.current) {
      const time = state.clock.elapsedTime;
      screenGroupRef.current.children.forEach((child, i) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshPhysicalMaterial
        ) {
          // Subtle pulsing backlight effect
          const baseIntensity = 0.3;
          const pulse = Math.sin(time * 0.5) * 0.1;
          child.material.emissiveIntensity = baseIntensity + pulse;
        }
      });
    }
  });

  // Dimensions
  const args = {
    width: 3.75,
    height: 6.25,
    depth: 0.35,
    radius: 0.36,
  };

  // Z-Stacking Layers (Calculated from center 0)
  const z = {
    back: 0,
    frontFaceCenter: 0.175 + 0.015, // Starts at 0.175, Thickness 0.03
    screenBezel: 0.175 + 0.03 + 0.001, // Just on top of front face
    screenHtml: 0.175 + 0.03 + 0.005, // Slightly above bezel
    screenGlass: 0.175 + 0.03 + 0.02, // Floating slightly above to contain volume
    wheelBase: 0.175 + 0.03 + 0.002,
    wheelHtml: 0.175 + 0.03 + 0.006,
  };

  // Procedural scratch texture for brushed steel back (per PDF spec)
  const scratchTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // Base roughness (0.02 min per PDF)
    ctx.fillStyle = "#404040";
    ctx.fillRect(0, 0, 1024, 1024);

    // Add random scratches for realistic imperfections
    ctx.strokeStyle = "#606060";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
      ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
      ctx.stroke();
    }

    // Add brushed metal directional lines
    ctx.strokeStyle = "#505050";
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);

  // LCD Screen backlight glow shader
  const lcdShaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xc7d0c0) },
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
    });
  }, []);

  useFrame((state) => {
    lcdShaderMaterial.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <group ref={meshRef}>
      <Float
        speed={1.4}
        rotationIntensity={0.05}
        floatIntensity={0.12}
        floatingRange={[-0.03, 0.03]}
      >
        <group>
          {/* 1. BACK CASE (Brushed Steel with Scratch Imperfections - per PDF Section 3) */}
          <RoundedBox
            args={[args.width, args.height, args.depth]}
            radius={args.radius}
            smoothness={10}
          >
            <meshPhysicalMaterial
              color="#e8e8e8"
              roughness={0.22}
              metalness={1.0}
              roughnessMap={scratchTexture}
              anisotropy={0.7}
              anisotropyRotation={Math.PI / 2}
              clearcoat={0.2}
              clearcoatRoughness={0.12}
              envMapIntensity={1.55}
              reflectivity={0.95}
            />
          </RoundedBox>

          {/* 2. FRONT FACE (Polycarbonate with SSS Effect - per PDF Section 3) */}
          <group position={[0, 0, z.frontFaceCenter]}>
            <RoundedBox
              args={[args.width, args.height, 0.03]}
              radius={args.radius}
              smoothness={10}
            >
              <meshPhysicalMaterial
                color={skinColor}
                roughness={0.25}
                metalness={0.0}
                clearcoat={0.9}
                clearcoatRoughness={0.09}
                transmission={0.03}
                thickness={0.18}
                envMapIntensity={0.85}
                sheen={0.16}
                sheenRoughness={0.58}
                sheenColor={new THREE.Color(skinColor).multiplyScalar(1.06)}
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
                width: "322px",
                height: "240px",
              }}
              className="select-none pointer-events-none"
              occlude={false}
              zIndexRange={[100, 0]}
            >
              {screen}
            </Html>

            {/* 3c. Screen glass tuned for subtle realism and minimal artifacts */}
            <group position={[0, 0, z.screenGlass]}>
              <RoundedBox args={[3.25, 2.45, 0.02]} radius={0.05} smoothness={4}>
                <MeshTransmissionMaterial
                  transmission={0.97}
                  thickness={0.025}
                  roughness={0.02}
                  chromaticAberration={0.0015}
                  anisotropicBlur={0.01}
                  ior={1.49}
                  distortion={0.008}
                  temporalDistortion={0}
                  color="#ffffff"
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
                roughness={0.18}
                metalness={0.0}
                clearcoat={0.8}
                clearcoatRoughness={0.1}
                envMapIntensity={0.85}
                sheen={0.24}
                sheenRoughness={0.42}
                sheenColor="#ffffff"
              />
            </mesh>

            {/* Center Button (Chrome/Metal) */}
            <mesh position={[0, 0, z.wheelBase + 0.001]}>
              <circleGeometry args={[0.73, 50]} />
              <meshPhysicalMaterial
                color="#d0d0d0"
                roughness={0.24}
                metalness={0.55}
                clearcoat={0.35}
                envMapIntensity={1.05}
              />
            </mesh>

            {/* Wheel Interface */}
            <Html
              transform
              scale={0.01}
              position={[0, 0, z.wheelHtml]}
              style={{
                width: "240px",
                height: "240px",
              }}
              className="select-none"
              occlude={false}
              zIndexRange={[100, 0]}
            >
              <div style={{ pointerEvents: "auto" }}>{wheel}</div>
            </Html>
          </group>
        </group>
      </Float>
    </group>
  );
}

// Scene capture component for high-res exports
function SceneCapture({
  onCapture,
  onReady,
  modelResetRef,
}: {
  onCapture: (fn: (w?: number, h?: number) => Promise<Blob | null>) => void;
  onReady?: () => void;
  modelResetRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const captureHighRes = async (width = 4096, height = 4096): Promise<Blob | null> => {
      // Store original size
      const originalSize = new THREE.Vector2();
      gl.getSize(originalSize);

      // Reset model rotation to front-facing before capture
      if (modelResetRef?.current) {
        modelResetRef.current();
      }

      // Create high-resolution render target with MSAA
      const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        samples: 4,
        type: THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      });

      try {
        // Render to the high-res target
        gl.setRenderTarget(renderTarget);
        gl.render(scene, camera);

        // Read pixels from the render target
        const buffer = new Uint8Array(width * height * 4);
        gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

        // Restore original render target
        gl.setRenderTarget(null);

        // Convert to PNG blob via canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to get canvas 2D context");
        }

        const imageData = ctx.createImageData(width, height);

        // Flip Y axis (WebGL renders upside down)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const srcIndex = ((height - y - 1) * width + x) * 4;
            const dstIndex = (y * width + x) * 4;
            imageData.data[dstIndex] = buffer[srcIndex];
            imageData.data[dstIndex + 1] = buffer[srcIndex + 1];
            imageData.data[dstIndex + 2] = buffer[srcIndex + 2];
            imageData.data[dstIndex + 3] = buffer[srcIndex + 3];
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert to blob with timeout
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Canvas toBlob timed out after 10 seconds"));
          }, 10000);

          canvas.toBlob(
            (blob) => {
              clearTimeout(timeoutId);
              resolve(blob);
            },
            "image/png",
            1.0,
          );
        });
      } finally {
        renderTarget.dispose();
      }
    };

    onCapture(captureHighRes);
    // Signal that the scene is ready for capture
    onReady?.();
  }, [gl, scene, camera, onCapture, onReady]);

  return null;
}

// Use a mutable ref to store the capture function
interface ThreeDIpodInternalProps extends ThreeDIpodProps {
  captureRef?: React.MutableRefObject<
    ((w?: number, h?: number) => Promise<Blob | null>) | null
  >;
}

export const ThreeDIpod = forwardRef<ThreeDIpodHandle, ThreeDIpodProps>((props, ref) => {
  const { onReady, ...modelProps } = props;
  const captureRef = useRef<((w?: number, h?: number) => Promise<Blob | null>) | null>(
    null,
  );
  const modelResetRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    captureHighRes: async (width?: number, height?: number) => {
      if (captureRef.current) {
        return captureRef.current(width, height);
      }
      return null;
    },
  }));

  const handleCapture = useCallback(
    (fn: (w?: number, h?: number) => Promise<Blob | null>) => {
      captureRef.current = fn;
    },
    [],
  );

  const handleRegisterReset = useCallback((fn: () => void) => {
    modelResetRef.current = fn;
  }, []);

  return (
    <div className="w-full h-full min-h-screen absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          preserveDrawingBuffer: true, // Required for capture
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 11]} fov={30} />

        {/* Ambient base light */}
        <ambientLight intensity={0.3} color="#eef1f5" />

        {/* Key Light - 800 lumens equivalent per PDF Table 4 */}
        <spotLight
          position={[8, 12, 10]}
          angle={0.3}
          penumbra={1}
          intensity={560}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color="#FFF5E0"
        />

        {/* Fill Light - Softer from left */}
        <spotLight
          position={[-10, 5, 8]}
          angle={0.5}
          penumbra={1}
          intensity={150}
          color="#e0f0ff"
        />

        {/* Rim Light - 1200 lumens per PDF Table 4 */}
        <spotLight
          position={[0, 2, -8]}
          angle={0.6}
          penumbra={1}
          intensity={430}
          color="#E0F0FF"
        />

        {/* Kicker light for edge highlights per PDF */}
        <rectAreaLight
          position={[5, 0, 0]}
          intensity={180}
          width={2}
          height={10}
          color="#FFE0C0"
        />

        {/* Subtle area light for screen illumination */}
        <rectAreaLight
          intensity={2.8}
          position={[0, 1, 6]}
          width={4}
          height={3}
          color="#c7d0c0"
        />

        {/* HDRI Environment with Lightformers for studio look per PDF Section 4.3 */}
        <Environment
          preset="studio"
          blur={0.5}
          background={false}
          environmentIntensity={0.72}
        >
          {/* Top strip light for zebra effect on metal */}
          <Lightformer
            intensity={1.2}
            position={[0, 10, 0]}
            scale={[20, 0.5, 1]}
            color="white"
          />
          {/* Side softboxes */}
          <Lightformer
            intensity={0.9}
            position={[5, 5, -5]}
            scale={[10, 3, 1]}
            color="white"
          />
          <Lightformer
            intensity={0.7}
            position={[-5, 3, -5]}
            scale={[10, 3, 1]}
            color="#e0f0ff"
          />
          {/* Bottom fill for subtle reflection */}
          <Lightformer
            intensity={0.3}
            position={[0, -5, 0]}
            scale={[15, 2, 1]}
            color="#f0f0f0"
          />
        </Environment>

        <IpodModel {...modelProps} onRegisterReset={handleRegisterReset} />

        {/* Enhanced contact shadows */}
        <ContactShadows
          resolution={2048}
          scale={20}
          blur={1.65}
          opacity={0.42}
          far={10}
          color="#000000"
          position={[0, -3.5, 0]}
        />

        {/* Post-processing effects per PDF Section 4.4 */}
        <PostProcessing />

        {/* Scene capture for high-res exports */}
        <SceneCapture
          onCapture={handleCapture}
          onReady={onReady}
          modelResetRef={modelResetRef}
        />
      </Canvas>
    </div>
  );
});

// Display name for debugging
ThreeDIpod.displayName = "ThreeDIpod";
