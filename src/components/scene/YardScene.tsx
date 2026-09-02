import { Grid, OrbitControls, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { compassYaw, framedPosition, zoomOffset } from "@/lib/camera";
import { pieceGhostInCutaway, pieceHiddenInCutaway } from "@/lib/cutaway";
import { isEdgeType } from "@/lib/pieces";
import { boundsOf } from "@/lib/plan";
import { useYard } from "@/lib/store";
import { PieceMesh } from "./PieceMesh";
import { Sand } from "./Sand";

function hatchIsRoof(
  pieces: { type: string; x: number; y: number; z: number }[],
  x: number,
  y: number,
  z: number,
): boolean {
  const hasFloor = pieces.some(
    (p) => p.type === "floor" && p.x === x && p.y === y && p.z === z,
  );
  const hasRoof = pieces.some(
    (p) => p.type === "rooftop" && p.x === x && p.y === y && p.z === z,
  );
  if (y === 0) return true;
  if (hasRoof && !hasFloor) return true;
  return false;
}

function CameraRig() {
  const view = useYard((s) => s.view);
  const camTick = useYard((s) => s.camTick);
  const zoomPulse = useYard((s) => s.zoomPulse);
  const zoomAction = useYard((s) => s.zoomAction);
  const { camera } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const lastPulse = useRef(0);

  useFrame(({ camera: cam }) => {
    const plan = useYard.getState().plan;
    const b = boundsOf(plan);
    const yaw = compassYaw(cam.position.x, cam.position.z, b.cx, b.cz);
    useYard.getState().setCamYaw(yaw);
  });

  useLayoutEffect(() => {
    const plan = useYard.getState().plan;
    const b = boundsOf(plan);
    const tx = b.cx;
    const ty = 0.45;
    const tz = b.cz;
    const c = controls.current;
    const isZoom = zoomPulse !== lastPulse.current;
    lastPulse.current = zoomPulse;

    if (isZoom && zoomAction !== "fit") {
      const off = zoomOffset(
        camera.position.x - tx,
        camera.position.y - ty,
        camera.position.z - tz,
        zoomAction,
      );
      camera.position.set(tx + off.x, ty + off.y, tz + off.z);
      camera.lookAt(tx, ty, tz);
      if (c) {
        c.target.set(tx, ty, tz);
        c.update();
      }
      return;
    }

    const position = framedPosition(view, b);
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(tx, ty, tz);
    if (c) {
      c.target.set(tx, ty, tz);
      c.update();
    }
  }, [camera, camTick, view, zoomPulse, zoomAction]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.16}
      rotateSpeed={0.55}
      panSpeed={0.65}
      zoomSpeed={0.8}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2 - 0.06}
      minDistance={5}
      maxDistance={48}
      enablePan
      screenSpacePanning
    />
  );
}

function PlacementPlane() {
  const placeType = useYard((s) => s.placeType);
  const placeStory = useYard((s) => s.placeStory);
  const placeAt = useYard((s) => s.placeAt);

  if (!placeType) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onClick={(e) => {
        e.stopPropagation();
        const p = e.point;
        const x = Math.floor(p.x);
        const z = Math.floor(p.z);
        const lx = p.x - x;
        const lz = p.z - z;
        let rot = 0;
        if (isEdgeType(placeType) || placeType === "ladder") {
          const dn = lz;
          const ds = 1 - lz;
          const dw = lx;
          const de = 1 - lx;
          const m = Math.min(dn, ds, dw, de);
          if (m === ds) rot = 0;
          else if (m === de) rot = 90;
          else if (m === dn) rot = 180;
          else rot = 270;
        }
        placeAt(x, z, rot, placeStory);
      }}
    >
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export function YardScene() {
  const plan = useYard((s) => s.plan);
  const selectedId = useYard((s) => s.selectedId);
  const showMarkers = useYard((s) => s.showMarkers);
  const showGrid = useYard((s) => s.showGrid);
  const select = useYard((s) => s.select);
  const placeType = useYard((s) => s.placeType);
  const cutaway = useYard((s) => s.cutaway);
  const [hovered, setHovered] = useState<string | null>(null);
  const b = boundsOf(plan);
  useCursor(Boolean(hovered) || Boolean(placeType));

  const hatchRoof = useMemo(() => {
    const set = new Set<string>();
    for (const p of plan.pieces) {
      if (p.type !== "hatch") continue;
      if (hatchIsRoof(plan.pieces, p.x, p.y, p.z)) set.add(p.id);
    }
    return set;
  }, [plan.pieces]);

  return (
    <>
      <color attach="background" args={["#3a3028"]} />
      <fog attach="fog" args={["#3a3028", 22, 62]} />
      <hemisphereLight args={["#f0d8b0", "#4a3828", 0.55]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[12, 16, 6]}
        intensity={1.7}
        color="#ffd6a8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (!placeType) select(null);
        }}
      >
        <Sand />
      </group>
      {showGrid ? (
        <Grid
          position={[b.cx, 0.02, b.cz]}
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.55}
          cellColor="#c4b49a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#ede6d6"
          fadeDistance={28}
          fadeStrength={1}
          infiniteGrid
        />
      ) : null}
      {plan.pieces.map((p) => {
        const hatchAsRoof = hatchRoof.has(p.id);
        return (
          <PieceMesh
            key={p.id}
            piece={p}
            selected={p.id === selectedId}
            hovered={p.id === hovered}
            showMarker={showMarkers || p.id === selectedId || p.id === hovered}
            hatchAsRoof={hatchAsRoof}
            hidden={cutaway && pieceHiddenInCutaway(p.type, hatchAsRoof)}
            ghost={cutaway && pieceGhostInCutaway(p, b)}
            onHover={setHovered}
            onSelect={select}
          />
        );
      })}
      <PlacementPlane />
      <CameraRig />
    </>
  );
}
