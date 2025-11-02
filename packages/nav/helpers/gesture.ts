import { atom } from "jotai";

export type Gesture = {
	neutral: boolean;
	isBlocked: boolean;
	lastGestureTime: number;
};

export const gestureAtom = atom<Gesture>({
	neutral: false,
	lastGestureTime: 0,
	isBlocked: false,
});
