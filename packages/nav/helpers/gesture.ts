import { atom } from "jotai";

export type Gesture = {
	neutral: boolean;
	isBlocked: boolean;
	lastGestureTime: number;
	thumbsUp: boolean;
	thumbsDown: boolean;
	enabled: boolean;
};

export const gestureAtom = atom<Gesture>({
	neutral: false,
	lastGestureTime: 0,
	isBlocked: false,
	thumbsUp: false,
	thumbsDown: false,
	enabled: true,
});
