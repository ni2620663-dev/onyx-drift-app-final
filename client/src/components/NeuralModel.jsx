import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

const HumanoidCore = () => {
  const meshRef = useRef();

  // মাউসের মুভমেন্ট অনুযায়ী মডেলটি হালকা নড়াচড়া করবে
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.cos(t / 4) / 8;
    meshRef.current.rotation.y = Math.sin(t / 4) / 8;
    meshRef.current.position.y = (1 + Math.sin(t / 1.5)) / 10;
  });

  return (
    <mesh ref={meshRef}>
      {/* একটি অর্গানিক নিউরাল শেপ যা মুড অনুযায়ী ডিস্টর্ট হবে */}
      <Sphere args={[1, 100, 200]} scale={2.4}>
        <MeshDistortMaterial
          color="#a855f7" // Purple color for Neural effect
          attach="material"
          distort={0.4} // মুড খারাপ হলে এটি বাড়ানো যাবে
          speed={2} 
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </mesh>
  );
};

const NeuralModel = () => {
  return (
    <div className="w-full h-[300px] cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} color="cyan" />
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
          <HumanoidCore />
        </Float>
      </Canvas>
    </div>
  );
};

export default NeuralModel;