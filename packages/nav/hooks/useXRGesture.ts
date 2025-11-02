import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { gestureAtom } from "../helpers/gesture";
import { getJointTransform, getJointXYZ, type Joints } from "../helpers/joints";
import { useXRJointsContext } from "../components/XRJointsProvider";

/**
 * Custom hook for detecting when both hands are in a neutral position
 * by checking if the thumb tips of both hands are close together.
 *
 * This hook directly accesses the XR session to get joint data from both hands
 * and determines when the user's hands are in a neutral/resting position.
 *
 * @param threshold - Distance threshold in meters to consider thumb tips "close" (default: 0.05m)
 * @returns Object containing:
 *   - isNeutral: boolean indicating if hands are in neutral position
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isNeutral } = useNeutralHandPos();
 *
 *   return (
 *     <div>
 *       <p>Hands neutral: {isNeutral ? "Yes" : "No"}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNeutralHandPos(threshold: number = 0.01) {
  const { joints } = useXRJointsContext();

  const [isNeutral, setIsNeutral] = useState(false);
  const [thumbDistance, setThumbDistance] = useState(0);

  const checkNeutralPosition = useCallback(
    (joints: Joints | null) => {
      if (!joints) {
        setIsNeutral(false);
        return;
      }

      const thumbPos = getJointXYZ(getJointTransform("Thumb_Tip", joints));
      const indexPos = getJointXYZ(getJointTransform("Index_Tip", joints));

      // Calculate distance between thumb tips
      const thumbDistance = thumbPos.distanceTo(indexPos);

      setThumbDistance(thumbDistance);
      setIsNeutral(thumbDistance <= threshold);
    },
    [threshold]
  );

  useEffect(() => {
    checkNeutralPosition(joints);
  }, [joints, checkNeutralPosition]);

  return {
    isNeutral,
    thumbDistance,
  };
}

export function useUpdateGesture() {
  const { isNeutral } = useNeutralHandPos();
  const [, setGesture] = useAtom(gestureAtom);

  useEffect(() => {
    setGesture((prev) => ({ ...prev, neutral: isNeutral }));
  }, [isNeutral, setGesture]);
}

// Add this to src/hooks/useXRGesture.ts

/**
 * Hook for managing gesture blocking across all gesture types.
 * Provides a shared state that prevents multiple gestures from firing simultaneously.
 *
 * @param blockDuration - Duration in seconds to block other gestures after one fires (default: 1.0s)
 * @returns Object with gesture blocking state and methods
 */
export function useGestureManager(blockDuration: number = 0.2) {
  const [gesture, setGesture] = useAtom(gestureAtom);
  const currentTime = useRef<number>(0);
  const { isNeutral } = useNeutralHandPos();

  useEffect(() => {
    setGesture((prev) => ({ ...prev, neutral: isNeutral }));
  }, [isNeutral, setGesture]);

  useFrame((state) => {
    currentTime.current = state.clock.getElapsedTime();

    // Check if we should unblock gestures
    if (
      gesture.isBlocked &&
      currentTime.current - gesture.lastGestureTime >= blockDuration
    ) {
      setGesture((prev) => ({ ...prev, isBlocked: false }));
    }
  });

  const triggerGesture = useCallback(() => {
    if (gesture.isBlocked) {
      return false;
    }

    // Block all gestures and record the trigger time
    setGesture((prev) => ({
      ...prev,
      isBlocked: true,
      lastGestureTime: currentTime.current,
      blockDuration: blockDuration,
    }));

    return true;
  }, [gesture.isBlocked, setGesture, blockDuration]);

  return {
    isBlocked: gesture.isBlocked,
    triggerGesture,
    remainingBlockTime: gesture.isBlocked
      ? Math.max(
          0,
          blockDuration - (currentTime.current - gesture.lastGestureTime)
        )
      : 0,
  };
}

export type SwipeDirection = "left" | "right" | "up" | "down";

export interface SwipeCallbacks {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

/**
 * Unified hook for detecting swipe gestures in all four directions with the right hand.
 * Detects left, right, up, and down swipes in a single unified hook.
 * Only enables when hands are in neutral position.
 *
 * @param callbacks - Object containing callbacks for each swipe direction
 * @param horizontalThreshold - Distance threshold in meters for left/right swipes (default: 0.07m = 7cm)
 * @param verticalThreshold - Distance threshold in meters for up/down swipes (default: 0.05m = 5cm)
 * @param horizontalTimeThreshold - Time threshold in seconds for left/right swipes (default: 0.7s)
 * @param verticalTimeThreshold - Time threshold in seconds for up/down swipes (default: 0.5s)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const handleSwipe = useCallback((direction: SwipeDirection) => {
 *     console.log(`${direction} swipe detected!`);
 *   }, []);
 *
 *   useSwipeGesture({
 *     onLeft: () => handleSwipe("left"),
 *     onRight: () => handleSwipe("right"),
 *     onUp: () => handleSwipe("up"),
 *     onDown: () => handleSwipe("down"),
 *   });
 *
 *   return <div>Swipe in any direction to trigger gesture</div>;
 * }
 * ```
 */
export function useSwipeGesture(
  callbacks: SwipeCallbacks,
  horizontalThreshold: number = 0.06,
  verticalThreshold: number = 0.05,
  horizontalTimeThreshold: number = 0.7,
  verticalTimeThreshold: number = 0.5
) {
  const { joints } = useXRJointsContext();
  const { triggerGesture } = useGestureManager();
  const { isNeutral } = useNeutralHandPos();
  const previousPosition = useRef<{ x: number; y: number; z: number } | null>(
    null
  );
  const previousTime = useRef<number | null>(null);
  const gestureStartPosition = useRef<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const gestureStartTime = useRef<number | null>(null);
  const currentDirection = useRef<SwipeDirection | null>(null);

  useFrame((state) => {
    if (!joints) {
      // Reset tracking if joints are not available
      previousPosition.current = null;
      previousTime.current = null;
      gestureStartPosition.current = null;
      gestureStartTime.current = null;
      currentDirection.current = null;
      return;
    }

    // Only enable gesture when hands are in neutral position
    if (!isNeutral) {
      // Reset tracking when not in neutral position
      previousPosition.current = null;
      previousTime.current = null;
      gestureStartPosition.current = null;
      gestureStartTime.current = null;
      currentDirection.current = null;
      return;
    }

    // Get the right hand middle finger tip position
    const middleTipTransform = getJointTransform("Middle_Tip", joints);
    const currentPosition = getJointXYZ(middleTipTransform);
    const currentTime = state.clock.getElapsedTime();

    // Initialize gesture tracking if we don't have a start position
    if (!gestureStartPosition.current) {
      gestureStartPosition.current = { ...currentPosition };
      gestureStartTime.current = currentTime;
      currentDirection.current = null;
    }

    // Check if we have enough data to detect a gesture
    if (previousPosition.current && previousTime.current) {
      const deltaX = currentPosition.x - previousPosition.current.x;
      const deltaY = currentPosition.y - previousPosition.current.y;

      // Determine the primary direction of movement
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check horizontal swipes (left/right)
      if (absDeltaX > absDeltaY) {
        // If hand is moving left (negative X direction)
        if (deltaX < 0) {
          // Update direction if we're starting a new gesture or continuing in the same direction
          if (
            currentDirection.current === null ||
            currentDirection.current === "left"
          ) {
            currentDirection.current = "left";

            // Calculate total distance moved since gesture started
            const totalDistance = Math.abs(
              currentPosition.x - (gestureStartPosition.current?.x || 0)
            );
            const totalTime =
              currentTime - (gestureStartTime.current || currentTime);

            // Check if we've moved the required distance in the required time
            if (
              totalDistance >= horizontalThreshold &&
              totalTime <= horizontalTimeThreshold &&
              callbacks.onLeft
            ) {
              // Try to trigger gesture - will be blocked if another gesture is active
              if (triggerGesture()) {
                callbacks.onLeft();
                // Reset gesture tracking after successful detection
                gestureStartPosition.current = { ...currentPosition };
                gestureStartTime.current = currentTime;
                currentDirection.current = null;
              }
            }
          }
        }
        // If hand is moving right (positive X direction)
        else if (deltaX > 0) {
          // Update direction if we're starting a new gesture or continuing in the same direction
          if (
            currentDirection.current === null ||
            currentDirection.current === "right"
          ) {
            currentDirection.current = "right";

            // Calculate total distance moved since gesture started
            const totalDistance = Math.abs(
              currentPosition.x - (gestureStartPosition.current?.x || 0)
            );
            const totalTime =
              currentTime - (gestureStartTime.current || currentTime);

            // Check if we've moved the required distance in the required time
            if (
              totalDistance >= horizontalThreshold &&
              totalTime <= horizontalTimeThreshold &&
              callbacks.onRight
            ) {
              // Try to trigger gesture - will be blocked if another gesture is active
              if (triggerGesture()) {
                callbacks.onRight();
                // Reset gesture tracking after successful detection
                gestureStartPosition.current = { ...currentPosition };
                gestureStartTime.current = currentTime;
                currentDirection.current = null;
              }
            }
          }
        }
        // If horizontal movement changes direction, reset tracking
        if (
          (currentDirection.current === "left" && deltaX > 0) ||
          (currentDirection.current === "right" && deltaX < 0)
        ) {
          gestureStartPosition.current = { ...currentPosition };
          gestureStartTime.current = currentTime;
          currentDirection.current = null;
        }
      }
      // Check vertical swipes (up/down)
      else if (absDeltaY > absDeltaX) {
        // If hand is moving up (positive Y direction)
        if (deltaY > 0) {
          // Update direction if we're starting a new gesture or continuing in the same direction
          if (
            currentDirection.current === null ||
            currentDirection.current === "up"
          ) {
            currentDirection.current = "up";

            // Calculate total distance moved since gesture started
            const totalDistance = Math.abs(
              (gestureStartPosition.current?.y || 0) - currentPosition.y
            );
            const totalTime =
              currentTime - (gestureStartTime.current || currentTime);

            // Check if we've moved the required distance in the required time
            if (
              totalDistance >= verticalThreshold &&
              totalTime <= verticalTimeThreshold &&
              callbacks.onUp
            ) {
              // Try to trigger gesture - will be blocked if another gesture is active
              if (triggerGesture()) {
                callbacks.onUp();
                // Reset gesture tracking after successful detection
                gestureStartPosition.current = { ...currentPosition };
                gestureStartTime.current = currentTime;
                currentDirection.current = null;
              }
            }
          }
        }
        // If hand is moving down (negative Y direction)
        else if (deltaY < 0) {
          // Update direction if we're starting a new gesture or continuing in the same direction
          if (
            currentDirection.current === null ||
            currentDirection.current === "down"
          ) {
            currentDirection.current = "down";

            // Calculate total distance moved since gesture started
            const totalDistance = Math.abs(
              currentPosition.y - (gestureStartPosition.current?.y || 0)
            );
            const totalTime =
              currentTime - (gestureStartTime.current || currentTime);

            // Check if we've moved the required distance in the required time
            if (
              totalDistance >= verticalThreshold &&
              totalTime <= verticalTimeThreshold &&
              callbacks.onDown
            ) {
              // Try to trigger gesture - will be blocked if another gesture is active
              if (triggerGesture()) {
                callbacks.onDown();
                // Reset gesture tracking after successful detection
                gestureStartPosition.current = { ...currentPosition };
                gestureStartTime.current = currentTime;
                currentDirection.current = null;
              }
            }
          }
        }
        // If vertical movement changes direction, reset tracking
        if (
          (currentDirection.current === "up" && deltaY < 0) ||
          (currentDirection.current === "down" && deltaY > 0)
        ) {
          gestureStartPosition.current = { ...currentPosition };
          gestureStartTime.current = currentTime;
          currentDirection.current = null;
        }
      }
    }

    // Update previous position and time
    previousPosition.current = { ...currentPosition };
    previousTime.current = currentTime;
  });
}
