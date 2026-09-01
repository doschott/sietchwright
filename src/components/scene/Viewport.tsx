import { Canvas } from "@react-three/fiber";
import { YardScene } from "./YardScene";

export function Viewport() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      shadows
      dpr={[1, 2]}
      camera={{ position: [11, 8, 14], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false }}
    >
      <YardScene />
    </Canvas>
  );
}
