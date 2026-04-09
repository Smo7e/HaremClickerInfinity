import { useEffect, useRef, useCallback, useState } from "react";
import { useGameStore } from "../store/gameStore";

const MAX_CPS = 20;
const WARNING_DURATION = 30;
const RESET_DELAY = 5000;

interface CPSState {
  cps: number;
  isWarning: boolean;
  warningTimeLeft: number;
}

export function useCPS() {
  const clicksRef = useRef<number[]>([]);
  const warningStartRef = useRef<number | null>(null);
  const accumulatedWarningRef = useRef(0);
  const lastViolationRef = useRef<number | null>(null);

  const [state, setState] = useState<CPSState>({
    cps: 0,
    isWarning: false,
    warningTimeLeft: WARNING_DURATION,
  });

  const resetGame = useGameStore((state) => state.resetGame);

  const recordClick = useCallback(() => {
    const now = Date.now();
    clicksRef.current.push(now);

    if (clicksRef.current.length > 100) {
      clicksRef.current = clicksRef.current.slice(-50);
    }
  }, []);

  const checkCPS = useCallback(() => {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    clicksRef.current = clicksRef.current.filter((t) => t > oneSecondAgo);
    const currentCPS = clicksRef.current.length;
    const isViolation = currentCPS > MAX_CPS;

    setState((prev) => {
      let isWarning = prev.isWarning;
      let warningTimeLeft = prev.warningTimeLeft;

      if (isViolation) {
        lastViolationRef.current = now;

        if (!warningStartRef.current) {
          warningStartRef.current = now;
          isWarning = true;
        }

        const currentSession = now - warningStartRef.current;
        const totalMs = accumulatedWarningRef.current + currentSession;
        warningTimeLeft = Math.max(0, WARNING_DURATION - Math.floor(totalMs / 1000));

        if (warningTimeLeft <= 0) {
          resetGame();
          window.location.reload();
          return prev;
        }
      } else if (isWarning && lastViolationRef.current) {
        const timeSinceViolation = now - lastViolationRef.current;

        if (timeSinceViolation >= RESET_DELAY) {
          if (warningStartRef.current) {
            const sessionMs = lastViolationRef.current - warningStartRef.current;
            accumulatedWarningRef.current += sessionMs;
          }
          warningStartRef.current = null;
          lastViolationRef.current = null;
          isWarning = false;
        }
      }
      return {
        cps: currentCPS,
        isWarning,
        warningTimeLeft,
      };
    });
  }, [resetGame]);

  useEffect(() => {
    const interval = window.setInterval(checkCPS, 100);
    return () => clearInterval(interval);
  }, [checkCPS]);

  return {
    cps: state.cps,
    isWarning: state.isWarning,
    warningTimeLeft: state.warningTimeLeft,
    recordClick,
    maxCPS: MAX_CPS,
  };
}
