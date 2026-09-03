import { Billboard } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  deckY,
  edgeWorld,
  FLOOR_H,
  FOUND_H,
  garageAlong,
  garageCenterY,
  garageHeight,
  PENTA_H,
  PENTA_W,
  pentaCenterY,
  pentaHeight,
  roofCenterY,
  ROOF_H,
  WALL_H,
  WALL_T,
  wallCenterY,
  yaw,
} from "@/lib/grid";
import { PIECES, type PieceType } from "@/lib/pieces";
import type { PlacedPiece } from "@/lib/plan";
import { markerTexture } from "./markers";

type Props = {
  piece: PlacedPiece;
  selected: boolean;
  hovered: boolean;
  showMarker: boolean;
  hatchAsRoof: boolean;
  ghost?: boolean;
  hidden?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function Marker({
  code,
  color,
  position,
  visible,
}: {
  code: string;
  color: string;
  position: [number, number, number];
  visible: boolean;
}) {
  const map = useMemo(() => markerTexture(code, color), [code, color]);
  if (!visible) return null;
  return (
    <Billboard position={position} follow>
      <mesh renderOrder={2} raycast={() => {}}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshBasicMaterial map={map} transparent depthTest={false} />
      </mesh>
    </Billboard>
  );
}

function Stone({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.88} metalness={0.04} />;
}

function FoundationBody({ color }: { color: string }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.96, FOUND_H, 0.96]} />
      <Stone color={color} />
    </mesh>
  );
}

function Slab({
  color,
  h,
  hole,
}: {
  color: string;
  h: number;
  hole?: boolean;
}) {
  if (!hole) {
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.98, h, 0.98]} />
        <Stone color={color} />
      </mesh>
    );
  }
  const rim = 0.18;
  const inner = 0.98 - rim * 2;
  return (
    <group>
      <mesh position={[0, 0, -(0.49 - rim / 2)]} castShadow receiveShadow>
        <boxGeometry args={[0.98, h, rim]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[0, 0, 0.49 - rim / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.98, h, rim]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[-(0.49 - rim / 2), 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[rim, h, inner]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[0.49 - rim / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[rim, h, inner]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[0, -h * 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[inner * 0.9, inner * 0.9]} />
        <meshStandardMaterial
          color="#1a1612"
          roughness={1}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function WallShell({
  color,
  height,
  opening,
}: {
  color: string;
  height: number;
  opening?: "door" | "window" | "passage";
}) {
  const t = WALL_T;
  const w = 1;
  if (!opening) {
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, height, t]} />
        <Stone color={color} />
      </mesh>
    );
  }
  if (opening === "window") {
    const holeW = 0.38;
    const holeH = 0.34;
    const side = (w - holeW) / 2;
    const sill = 0.28;
    const lintel = height - sill - holeH;
    return (
      <group>
        <mesh position={[-(holeW / 2 + side / 2), 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[side, height, t]} />
          <Stone color={color} />
        </mesh>
        <mesh position={[holeW / 2 + side / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[side, height, t]} />
          <Stone color={color} />
        </mesh>
        <mesh position={[0, -height / 2 + sill / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[holeW, sill, t]} />
          <Stone color={color} />
        </mesh>
        <mesh position={[0, height / 2 - lintel / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[holeW, lintel, t]} />
          <Stone color={color} />
        </mesh>
        <mesh position={[0, -height / 2 + sill + holeH / 2, 0]}>
          <planeGeometry args={[holeW * 0.92, holeH * 0.92]} />
          <meshStandardMaterial
            color="#2a3540"
            roughness={0.25}
            metalness={0.15}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    );
  }
  const holeW = opening === "passage" ? 0.72 : 0.42;
  const holeH = opening === "passage" ? height * 0.82 : height * 0.74;
  const side = (w - holeW) / 2;
  const lintel = height - holeH;
  return (
    <group>
      <mesh position={[-(holeW / 2 + side / 2), 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[side, height, t]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[holeW / 2 + side / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[side, height, t]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[0, height / 2 - lintel / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[holeW, lintel, t]} />
        <Stone color={color} />
      </mesh>
      <mesh position={[0, -height / 2 + holeH / 2, t * 0.2]}>
        <planeGeometry args={[holeW * 0.96, holeH * 0.96]} />
        <meshStandardMaterial
          color="#14110e"
          roughness={1}
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

function StairsBody({ color }: { color: string }) {
  const steps = 5;
  const rise = WALL_H / steps;
  const run = 0.92 / steps;
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => (
        <mesh
          key={i}
          position={[0, rise * i + rise / 2, -0.46 + run * i + run / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.88, rise, run + 0.02]} />
          <Stone color={color} />
        </mesh>
      ))}
    </group>
  );
}

function RampBody({ color }: { color: string }) {
  const len = Math.hypot(WALL_H, 0.96);
  const angle = Math.atan2(WALL_H, 0.96);
  return (
    <mesh
      rotation={[-angle, 0, 0]}
      position={[0, WALL_H / 2, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.88, 0.08, len]} />
      <Stone color={color} />
    </mesh>
  );
}

function ColumnBody({ color, corner }: { color: string; corner: boolean }) {
  const s = corner ? 0.18 : 0.22;
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[s, WALL_H, s]} />
      <Stone color={color} />
    </mesh>
  );
}

function RailingBody({ color }: { color: string }) {
  return (
    <group>
      {[-0.38, 0, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]} castShadow>
          <boxGeometry args={[0.04, 0.36, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[0.96, 0.04, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

function LadderBody({ color }: { color: string }) {
  const h = WALL_H;
  return (
    <group>
      <mesh position={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.04, h, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.18} />
      </mesh>
      <mesh position={[0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.04, h, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.18} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, -h / 2 + 0.14 + i * 0.16, 0]} castShadow>
          <boxGeometry args={[0.3, 0.03, 0.03]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.18} />
        </mesh>
      ))}
    </group>
  );
}

function GarageBody({ color }: { color: string }) {
  const w = 1.96;
  const h = garageHeight();
  const t = WALL_T * 1.35;
  const post = 0.1;
  const slats = 12;
  const innerW = w - post * 2;
  const innerH = h - 0.16;
  const slatH = innerH / slats;
  return (
    <group>
      <mesh position={[-(w / 2 - post / 2), 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[post, h, t]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.22} />
      </mesh>
      <mesh position={[w / 2 - post / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[post, h, t]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.22} />
      </mesh>
      <mesh position={[0, h / 2 - 0.07, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, 0.14, t]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, -h / 2 + 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[innerW, 0.1, t]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => (
        <mesh
          key={i}
          position={[0, -innerH / 2 + slatH * i + slatH / 2, t * 0.12]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[innerW * 0.98, slatH * 0.82, t * 0.7]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#5c5850" : "#4e4a44"}
            roughness={0.45}
            metalness={0.32}
          />
        </mesh>
      ))}
      <mesh position={[0, -h * 0.18, t * 0.55]}>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <meshStandardMaterial color="#1c1a18" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

function PentashieldBody({ along, rise }: { along: number; rise: number }) {
  const w = along - 0.06;
  const h = pentaHeight(rise);
  const t = WALL_T * 0.4;
  return (
    <mesh>
      <boxGeometry args={[w, h, t]} />
      <meshStandardMaterial
        color="#7ad4f0"
        transparent
        opacity={0.32}
        roughness={0.12}
        metalness={0.28}
        emissive="#1a5a78"
        emissiveIntensity={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}

function bodyFor(piece: PlacedPiece, color: string) {
  const type = piece.type;
  switch (type) {
    case "foundation":
      return <FoundationBody color={color} />;
    case "floor":
      return <Slab color={color} h={FLOOR_H} />;
    case "rooftop":
      return <Slab color={color} h={ROOF_H} />;
    case "hatch":
      return <Slab color={color} h={FLOOR_H} hole />;
    case "wall":
      return <WallShell color={color} height={WALL_H} />;
    case "half_wall":
      return <WallShell color={color} height={WALL_H * 0.46} />;
    case "door":
      return <WallShell color={color} height={WALL_H} opening="door" />;
    case "window":
      return <WallShell color={color} height={WALL_H} opening="window" />;
    case "passageway":
      return <WallShell color={color} height={WALL_H} opening="passage" />;
    case "garage_door":
      return <GarageBody color={color} />;
    case "pentashield":
      return (
        <PentashieldBody along={piece.along ?? PENTA_W} rise={piece.rise ?? PENTA_H} />
      );
    case "stairs":
      return <StairsBody color={color} />;
    case "ramp":
      return <RampBody color={color} />;
    case "center_column":
      return <ColumnBody color={color} corner={false} />;
    case "corner_column":
      return <ColumnBody color={color} corner />;
    case "railing":
      return <RailingBody color={color} />;
    case "ladder":
      return <LadderBody color={color} />;
  }
}

function pose(
  piece: PlacedPiece,
  hatchAsRoof: boolean,
): {
  pos: [number, number, number];
  rotY: number;
  marker: [number, number, number];
} {
  const { x, y, z, rot, type } = piece;
  if (type === "foundation") {
    return { pos: [x + 0.5, FOUND_H / 2, z + 0.5], rotY: 0, marker: [0, 0.28, 0] };
  }
  if (type === "floor") {
    return {
      pos: [x + 0.5, deckY(y) - FLOOR_H / 2, z + 0.5],
      rotY: 0,
      marker: [0, 0.22, 0],
    };
  }
  if (type === "rooftop") {
    return {
      pos: [x + 0.5, roofCenterY(y), z + 0.5],
      rotY: 0,
      marker: [0, 0.22, 0],
    };
  }
  if (type === "hatch") {
    const hy = hatchAsRoof || y === 0 ? roofCenterY(y) : deckY(y) - FLOOR_H / 2;
    return {
      pos: [x + 0.5, hy, z + 0.5],
      rotY: 0,
      marker: [0, 0.28, 0],
    };
  }
  if (type === "stairs" || type === "ramp") {
    return {
      pos: [x + 0.5, deckY(y), z + 0.5],
      rotY: yaw(rot),
      marker: [0, WALL_H * 0.7, 0],
    };
  }
  if (type === "center_column") {
    return {
      pos: [x + 0.5, wallCenterY(y), z + 0.5],
      rotY: 0,
      marker: [0, WALL_H / 2 + 0.18, 0],
    };
  }
  if (type === "corner_column") {
    return {
      pos: [x + 0.08, wallCenterY(y), z + 0.08],
      rotY: 0,
      marker: [0, WALL_H / 2 + 0.18, 0],
    };
  }
  const [ex, ez] = edgeWorld(x, z, rot);
  if (type === "railing") {
    return {
      pos: [ex, deckY(y) + WALL_H + 0.02, ez],
      rotY: yaw(rot),
      marker: [0, 0.55, 0],
    };
  }
  if (type === "half_wall") {
    return {
      pos: [ex, deckY(y) + WALL_H * 0.23, ez],
      rotY: yaw(rot),
      marker: [0, 0.42, 0],
    };
  }
  if (type === "ladder") {
    return {
      pos: [ex, wallCenterY(y), ez],
      rotY: yaw(rot),
      marker: [0, WALL_H / 2 + 0.2, 0],
    };
  }
  if (type === "garage_door") {
    const { dx, dz } = garageAlong(rot);
    return {
      pos: [ex + dx * 0.5, garageCenterY(y), ez + dz * 0.5],
      rotY: yaw(rot),
      marker: [0, garageHeight() / 2 + 0.18, WALL_T],
    };
  }
  if (type === "pentashield") {
    const alongN = piece.along ?? PENTA_W;
    const riseN = piece.rise ?? PENTA_H;
    const { dx, dz } = garageAlong(rot);
    return {
      pos: [
        ex + dx * ((alongN - 1) / 2),
        pentaCenterY(y, riseN),
        ez + dz * ((alongN - 1) / 2),
      ],
      rotY: yaw(rot),
      marker: [0, pentaHeight(riseN) / 2 + 0.18, WALL_T],
    };
  }
  return {
    pos: [ex, wallCenterY(y), ez],
    rotY: yaw(rot),
    marker: [0, WALL_H / 2 + 0.16, WALL_T],
  };
}

export function PieceMesh({
  piece,
  selected,
  hovered,
  showMarker,
  hatchAsRoof,
  ghost = false,
  hidden = false,
  onHover,
  onSelect,
}: Props) {
  const def = PIECES[piece.type];
  const color = selected || hovered ? "#e6d7c2" : def.stone;
  const { pos, rotY, marker } = pose(piece, hatchAsRoof);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const root = groupRef.current;
    if (!root) return;
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (!mat || !("opacity" in mat)) continue;
        const m = mat as THREE.MeshStandardMaterial;
        if (m.userData._baseOpacity == null) {
          m.userData._baseOpacity = m.opacity;
          m.userData._baseTransparent = m.transparent;
          m.userData._baseDepthWrite = m.depthWrite;
        }
        if (ghost) {
          m.transparent = true;
          m.opacity = Math.min(0.18, m.userData._baseOpacity);
          m.depthWrite = false;
        } else {
          m.opacity = m.userData._baseOpacity;
          m.transparent = m.userData._baseTransparent;
          m.depthWrite = m.userData._baseDepthWrite;
        }
      }
    });
  }, [ghost, piece.id, selected, hovered, color]);

  if (hidden) return null;

  return (
    <group
      ref={groupRef}
      position={pos}
      rotation={[0, rotY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(piece.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(piece.id);
      }}
    >
      {bodyFor(piece, color)}
      {selected ? (
        piece.type === "garage_door" || piece.type === "pentashield" ? (
          <mesh>
            <boxGeometry args={[2.08, garageHeight() + 0.06, WALL_T * 2.2]} />
            <meshBasicMaterial
              color="#ede6d6"
              wireframe
              transparent
              opacity={0.7}
            />
          </mesh>
        ) : (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
            <ringGeometry args={[0.38, 0.48, 24]} />
            <meshBasicMaterial color="#ede6d6" transparent opacity={0.9} />
          </mesh>
        )
      ) : null}
      <Marker
        code={def.code}
        color={def.marker}
        position={marker}
        visible={showMarker}
      />
    </group>
  );
}
