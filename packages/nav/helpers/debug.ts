import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { gestureAtom } from "./gesture";

export const useGestureDebug = () => {
  const setGesture = useSetAtom(gestureAtom);

  useEffect(() => {
    (window as any).setGestureEnabled = (enabled: boolean) => {
      setGesture((prev) => ({ ...prev, enabled }));
      console.log(`Gesture enabled: ${enabled}`);
    };

    return () => {
      delete (window as any).setGestureEnabled;
    };
  }, [setGesture]);
};

