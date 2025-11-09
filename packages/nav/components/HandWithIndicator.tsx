import { XRHandModel } from "@react-three/xr";
import { useAtom } from "jotai";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { gestureAtom } from "../helpers/gesture";

const HandWithIndicator = ({
  offColorHex,
  neutralColorHex = 0x0f2540,
}: {
  offColorHex?: number;
  neutralColorHex: number;
}) => {
  const [gesture] = useAtom(gestureAtom);
  const handRef = useRef<THREE.Group>(null);
  const originalColorsRef = useRef<
    Map<THREE.MeshStandardMaterial, THREE.Color>
  >(new Map());

  useEffect(() => {
    if (!handRef.current) return;

    // Store original colors if not already stored
    handRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (!originalColorsRef.current.has(material)) {
          originalColorsRef.current.set(material, material.color.clone());
        }
      }
    });

    // Apply or remove tint
    handRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        const originalColor = originalColorsRef.current.get(material);

        if (originalColor) {
          if (gesture.neutral) {
            // Apply green tint
            material.color.setHex(neutralColorHex);
            material.emissive.setHex(neutralColorHex);
            material.emissiveIntensity = 0.3;
          } else {
            // Restore original color
            material.color.copy(
              offColorHex ? new THREE.Color(offColorHex) : originalColor
            );
            material.emissive.setHex(offColorHex ? offColorHex : 0x000000);
            material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [gesture.neutral, offColorHex, neutralColorHex]);

  return (
    <>
      <Suspense>
        <group ref={handRef}>
          <XRHandModel />
        </group>
      </Suspense>
    </>
  );
};

export default HandWithIndicator;
