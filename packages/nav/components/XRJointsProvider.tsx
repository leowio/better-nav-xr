import { useXRStore } from "@react-three/xr";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getJointsFromXRFrame, type Joints } from "../helpers/joints";

const XRContext = createContext<{
  session: XRSession | undefined;
  originReferenceSpace: XRReferenceSpace | undefined;
  joints: Joints;
} | null>(null);

export const XRJointsProvider = ({ children }: { children: ReactNode }) => {
  const xrStore = useXRStore();
  const [session, setSession] = useState<XRSession | undefined>();
  const [originReferenceSpace, setOriginReferenceSpace] = useState<
    XRReferenceSpace | undefined
  >();
  const [joints, setJoints] = useState<Joints>(new Float32Array(25 * 16));

  useEffect(() => {
    const unsubscribe = xrStore.subscribe((state) => {
      setSession(state.session);
      setOriginReferenceSpace(state.originReferenceSpace);
    });
    return unsubscribe;
  }, [xrStore]);

  useEffect(() => {
    if (!session || !originReferenceSpace) return;

    const jointsRef: { current: Joints } = {
      current: new Float32Array(25 * 16),
    };
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL_MS = 100; // Throttle state updates to ~10Hz

    const animate = () => {
      session.requestAnimationFrame((time, frame) => {
        const jointTransforms = getJointsFromXRFrame(
          time,
          frame,
          session,
          originReferenceSpace
        );
        if (jointTransforms) {
          // Update ref immediately (no React re-render)
          jointsRef.current = jointTransforms;

          // Only update state at a throttled rate (e.g., 10Hz)
          // This triggers React updates for consumers
          const now = performance.now();
          if (now - lastUpdateTime >= UPDATE_INTERVAL_MS) {
            setJoints(jointTransforms);
            lastUpdateTime = now;
          }
        }

        animate(); // Chain next frame
      });
    };

    animate();

    return () => {
      // Cleanup handled by session lifecycle
    };
  }, [session, originReferenceSpace]);

  return (
    <XRContext.Provider
      value={{
        session,
        originReferenceSpace,
        joints,
      }}
    >
      {children}
    </XRContext.Provider>
  );
};

export const useXRJointsContext = () => {
  const context = useContext(XRContext);
  if (!context) throw new Error("useXRContext must be used within XRProvider");
  return context;
};
