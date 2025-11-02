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

/**
 * Hook for detecting left swipe gestures with the right hand.
 * Executes the callback when the right hand moves left by 7cm (0.07m) within 0.7 seconds.
 * Uses the existing joint tracking system for more reliable hand position detection.
 *
 * @param callback - Function to execute when left swipe is detected
 * @param threshold - Distance threshold in meters (default: 0.07m = 7cm)
 * @param timeThreshold - Time threshold in seconds (default: 0.7s)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const handleLeftSwipe = useCallback(() => {
 *     console.log("Left swipe detected!");
 *     // Your swipe action here
 *   }, []);
 *
 *   // Detect left swipe of 70cm in 0.7 seconds
 *   useLeftSwipeGesture(handleLeftSwipe);
 *
 *   // Or with custom thresholds
 *   useLeftSwipeGesture(handleLeftSwipe, 0.3, 0.8); // 30cm in 0.8 seconds
 *
 *   return <div>Move your right hand left to trigger gesture</div>;
 * }
 * ```
 */
export function useLeftSwipeGesture(
  callback: () => void,
  threshold: number = 0.07,
  timeThreshold: number = 0.7
) {
  const { joints } = useXRJointsContext();
  const { triggerGesture } = useGestureManager();
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

  useFrame((state) => {
    if (!joints) {
      // Reset tracking if joints are not available
      previousPosition.current = null;
      previousTime.current = null;
      gestureStartPosition.current = null;
      gestureStartTime.current = null;
      return;
    }

    // Get the right hand wrist position (joint index 0 is typically the wrist)
    const middleTipTransform = getJointTransform("Middle_Tip", joints);
    const currentPosition = getJointXYZ(middleTipTransform);
    const currentTime = state.clock.getElapsedTime();

    // Initialize gesture tracking if we don't have a start position
    if (!gestureStartPosition.current) {
      gestureStartPosition.current = { ...currentPosition };
      gestureStartTime.current = currentTime;
    }

    // Check if we have enough data to detect a gesture
    if (previousPosition.current && previousTime.current) {
      const deltaX = currentPosition.x - previousPosition.current.x;

      // If hand is moving left (negative X direction)
      if (deltaX < 0) {
        // Calculate total distance moved since gesture started
        const totalDistance = Math.abs(
          currentPosition.x - (gestureStartPosition.current?.x || 0)
        );
        const totalTime =
          currentTime - (gestureStartTime.current || currentTime);

        // Check if we've moved the required distance in the required time
        if (totalDistance >= threshold && totalTime <= timeThreshold) {
          // Try to trigger gesture - will be blocked if another gesture is active
          if (triggerGesture()) {
            callback();
            // Reset gesture tracking after successful detection
            gestureStartPosition.current = { ...currentPosition };
            gestureStartTime.current = currentTime;
          }
        }
      } else if (deltaX > 0) {
        // If hand is moving right, reset gesture tracking
        gestureStartPosition.current = { ...currentPosition };
        gestureStartTime.current = currentTime;
      }
    }

    // Update previous position and time
    previousPosition.current = { ...currentPosition };
    previousTime.current = currentTime;
  });
}

/**
 * Hook for detecting right swipe gestures with the right hand.
 * Executes the callback when the right hand moves right by 7cm (0.07m) within 0.7 seconds.
 * Uses the existing joint tracking system for more reliable hand position detection.
 *
 * @param callback - Function to execute when right swipe is detected
 * @param threshold - Distance threshold in meters (default: 0.07m = 7cm)
 * @param timeThreshold - Time threshold in seconds (default: 0.7s)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const handleRightSwipe = useCallback(() => {
 *     console.log("Right swipe detected!");
 *     // Your swipe action here
 *   }, []);
 *
 *   // Detect right swipe of 50cm in 0.5 seconds
 *   useRightSwipeGesture(handleRightSwipe);
 *
 *   // Or with custom thresholds
 *   useRightSwipeGesture(handleRightSwipe, 0.3, 0.8); // 30cm in 0.8 seconds
 *
 *   return <div>Move your right hand right to trigger gesture</div>;
 * }
 * ```
 */
export function useRightSwipeGesture(
  callback: () => void,
  threshold: number = 0.07,
  timeThreshold: number = 0.7
) {
  const { joints } = useXRJointsContext();
  const { triggerGesture } = useGestureManager();
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

  useFrame((state) => {
    if (!joints) {
      // Reset tracking if joints are not available
      previousPosition.current = null;
      previousTime.current = null;
      gestureStartPosition.current = null;
      gestureStartTime.current = null;
      return;
    }

    // Get the right hand wrist position (joint index 0 is typically the wrist)
    const middleTipTransform = getJointTransform("Middle_Tip", joints);
    const currentPosition = getJointXYZ(middleTipTransform);
    const currentTime = state.clock.getElapsedTime();

    // Initialize gesture tracking if we don't have a start position
    if (!gestureStartPosition.current) {
      gestureStartPosition.current = { ...currentPosition };
      gestureStartTime.current = currentTime;
    }

    // Check if we have enough data to detect a gesture
    if (previousPosition.current && previousTime.current) {
      const deltaX = currentPosition.x - previousPosition.current.x;

      // If hand is moving right (positive X direction)
      if (deltaX > 0) {
        // Calculate total distance moved since gesture started
        const totalDistance = Math.abs(
          currentPosition.x - (gestureStartPosition.current?.x || 0)
        );
        const totalTime =
          currentTime - (gestureStartTime.current || currentTime);

        // Check if we've moved the required distance in the required time
        if (totalDistance >= threshold && totalTime <= timeThreshold) {
          // Try to trigger gesture - will be blocked if another gesture is active
          if (triggerGesture()) {
            callback();
            // Reset gesture tracking after successful detection
            gestureStartPosition.current = { ...currentPosition };
            gestureStartTime.current = currentTime;
          }
        }
      } else if (deltaX < 0) {
        // If hand is moving left, reset gesture tracking
        gestureStartPosition.current = { ...currentPosition };
        gestureStartTime.current = currentTime;
      }
    }

    // Update previous position and time
    previousPosition.current = { ...currentPosition };
    previousTime.current = currentTime;
  });
}

/**
 * Hook for detecting up swipe gestures with the right hand.
 * Executes the callback when the right middle finger tip moves up by 5cm (0.05m) within 0.5 seconds.
 * Uses the existing joint tracking system for more reliable hand position detection.
 *
 * @param callback - Function to execute when up swipe is detected
 * @param threshold - Distance threshold in meters (default: 0.05m = 5cm)
 * @param timeThreshold - Time threshold in seconds (default: 0.5s)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const handleUpSwipe = useCallback(() => {
 *     console.log("Up swipe detected!");
 *     // Your swipe action here
 *   }, []);
 *
 *   // Detect up swipe of 5cm in 0.5 seconds
 *   useUpSwipeGesture(handleUpSwipe);
 *
 *   // Or with custom thresholds
 *   useUpSwipeGesture(handleUpSwipe, 0.3, 0.8); // 30cm in 0.8 seconds
 *
 *   return <div>Move your right hand middle finger tip up to trigger gesture</div>;
 * }
 * ```
 */
export function useUpSwipeGesture(
  callback: () => void,
  threshold: number = 0.05,
  timeThreshold: number = 0.5
) {
  const { joints } = useXRJointsContext();
  const { triggerGesture } = useGestureManager();
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

  useFrame((state) => {
    if (!joints) {
      // Reset tracking if joints are not available
      previousPosition.current = null;
      previousTime.current = null;
      gestureStartPosition.current = null;
      gestureStartTime.current = null;
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
    }

    // Check if we have enough data to detect a gesture
    if (previousPosition.current && previousTime.current) {
      const deltaY = currentPosition.y - previousPosition.current.y;

      // If hand is moving up (positive Y direction)
      if (deltaY > 0) {
        // Calculate total distance moved since gesture started
        const totalDistance = Math.abs(
          (gestureStartPosition.current?.y || 0) - currentPosition.y
        );
        const totalTime =
          currentTime - (gestureStartTime.current || currentTime);

        // Check if we've moved the required distance in the required time
        if (totalDistance >= threshold && totalTime <= timeThreshold) {
          // Try to trigger gesture - will be blocked if another gesture is active
          if (triggerGesture()) {
            callback();
            // Reset gesture tracking after successful detection
            gestureStartPosition.current = { ...currentPosition };
            gestureStartTime.current = currentTime;
          }
        }
      } else if (deltaY < 0) {
        // If hand is moving down, reset gesture tracking
        gestureStartPosition.current = { ...currentPosition };
        gestureStartTime.current = currentTime;
      }
    }

    // Update previous position and time
    previousPosition.current = { ...currentPosition };
    previousTime.current = currentTime;
  });
}

/**
 * Hook for detecting down swipe gestures with the right hand.
 * Executes the callback when the right middle finger tip moves down by 5cm (0.05m) within 0.5 seconds.
 * Uses the existing joint tracking system for more reliable hand position detection.
 *
 * @param callback - Function to execute when down swipe is detected
 * @param threshold - Distance threshold in meters (default: 0.05m = 5cm)
 * @param timeThreshold - Time threshold in seconds (default: 0.5s)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const handleDownSwipe = useCallback(() => {
 *     console.log("Down swipe detected!");
 *     // Your swipe action here
 *   }, []);
 *
 *   // Detect down swipe of 5cm in 0.5 seconds
 *   useDownSwipeGesture(handleDownSwipe);
 *
 *   // Or with custom thresholds
 *   useDownSwipeGesture(handleDownSwipe, 0.3, 0.8); // 30cm in 0.8 seconds
 *
 *   return <div>Move your right hand middle finger tip up to trigger gesture</div>;
 * }
 * ```
 */
export function useDownSwipeGesture(
  callback: () => void,
  threshold: number = 0.05,
  timeThreshold: number = 0.5
) {
  const { joints } = useXRJointsContext();
  const { triggerGesture } = useGestureManager();
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

  useFrame((state) => {
    if (!joints) {
      // Reset tracking if joints are not available
      previousPosition.current = null;
      previousTime.current = null;
      gestureStartPosition.current = null;
      gestureStartTime.current = null;
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
    }

    // Check if we have enough data to detect a gesture
    if (previousPosition.current && previousTime.current) {
      const deltaY = currentPosition.y - previousPosition.current.y;

      // If hand is moving down (negative Y direction)
      if (deltaY < 0) {
        // Calculate total distance moved since gesture started
        const totalDistance = Math.abs(
          currentPosition.y - (gestureStartPosition.current?.y || 0)
        );
        const totalTime =
          currentTime - (gestureStartTime.current || currentTime);

        // Check if we've moved the required distance in the required time
        if (totalDistance >= threshold && totalTime <= timeThreshold) {
          // Try to trigger gesture - will be blocked if another gesture is active
          if (triggerGesture()) {
            callback();
            // Reset gesture tracking after successful detection
            gestureStartPosition.current = { ...currentPosition };
            gestureStartTime.current = currentTime;
          }
        }
      } else if (deltaY > 0) {
        // If hand is moving up, reset gesture tracking
        gestureStartPosition.current = { ...currentPosition };
        gestureStartTime.current = currentTime;
      }
    }

    // Update previous position and time
    previousPosition.current = { ...currentPosition };
    previousTime.current = currentTime;
  });
}
