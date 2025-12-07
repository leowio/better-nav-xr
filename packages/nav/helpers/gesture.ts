import { atom } from "jotai";

export type Gesture = {
	neutral: boolean;
	isBlocked: boolean;
	lastGestureTime: number;
	thumbsUp: boolean;
	thumbsDown: boolean;
	thumbHoldProgress: number; // 0-1, progress toward confirmation
	enabled: boolean;
};

export const gestureAtom = atom<Gesture>({
	neutral: false,
	lastGestureTime: 0,
	isBlocked: false,
	thumbsUp: false,
	thumbsDown: false,
	thumbHoldProgress: 0,
	enabled: true,
});
