import { useRef, useCallback, TouchEvent } from 'react';

interface UseSwipeGestureOptions {
    minSwipeDistance?: number;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
}

interface UseSwipeGestureReturn {
    onTouchStart: (e: TouchEvent<HTMLElement>) => void;
    onTouchMove: (e: TouchEvent<HTMLElement>) => void;
    onTouchEnd: () => void;
}

export const useSwipeGesture = ({
    minSwipeDistance = 50,
    onSwipeLeft,
    onSwipeRight
}: UseSwipeGestureOptions = {}): UseSwipeGestureReturn => {
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    const onTouchStart = useCallback((e: TouchEvent<HTMLElement>) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    }, []);

    const onTouchMove = useCallback((e: TouchEvent<HTMLElement>) => {
        touchEnd.current = e.targetTouches[0].clientX;
    }, []);

    const onTouchEnd = useCallback(() => {
        if (!touchStart.current || !touchEnd.current) return;

        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }
        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        }
    }, [minSwipeDistance, onSwipeLeft, onSwipeRight]);

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};
