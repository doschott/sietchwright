import { useMemo } from "react";
import * as THREE from "three";

export function Sand() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 90, 70, 70);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h =
        Math.sin(x * 0.11) * 0.35 +
        Math.cos(z * 0.09) * 0.28 +
        Math.sin((x + z) * 0.07) * 0.4 +
        Math.sin(x * 0.35) * 0.08;
      const dist = Math.hypot(x - 3, z - 3);
      const flatten = THREE.MathUtils.smoothstep(6, 14, dist);
      pos.setY(i, h * flatten - 0.12);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const rocks = useMemo(() => {
    const list: Array<[number, number, number, number]> = [];
    const rng = (s: number) => {
      const x = Math.sin(s * 999) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 18; i++) {
      const a = rng(i + 1) * Math.PI * 2;
      const d = 11 + rng(i + 40) * 18;
      list.push([
        Math.cos(a) * d,
        rng(i + 7) * 0.4,
        Math.sin(a) * d,
        0.4 + rng(i + 13) * 1.2,
      ]);
    }
    return list;
  }, []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#8a704e" roughness={0.98} metalness={0} />
      </mesh>
      {rocks.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={s} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#6a5340" roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}
