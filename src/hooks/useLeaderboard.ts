// src/hooks/useLeaderboard.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { adService } from "../services/AdService";
import { useGameStore } from "../store/gameStore";

interface LeaderboardState {
  rank: number | null;
  totalScore: number;
  isLoading: boolean;
}
export const LAST_SENT_SCORE_KEY = "harem-leaderboard-last-sent";

export function useLeaderboard() {
  const locationProgress = useGameStore((s) => s.locationProgress);
  const isAuthorized = adService.getIsAuthorized();

  // Используем ref для отслеживания последнего отправленного счёта
  // чтобы избежать проблем с замыканиями
  const lastSubmittedRef = useRef<number>(0);
  const pendingSubmitRef = useRef<number | null>(null);
  const submitTimeoutRef = useRef<number | null>(null);

  const [state, setState] = useState<LeaderboardState>({
    rank: null,
    totalScore: 0,
    isLoading: false,
  });

  // Инициализация lastSubmittedRef из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_SENT_SCORE_KEY);
      if (saved) {
        lastSubmittedRef.current = parseInt(saved, 10) || 0;
      }
    } catch {
      lastSubmittedRef.current = 0;
    }
  }, []);

  // Вычисляем сумму максимальных уровней
  const calculateTotalScore = useCallback(() => {
    return Object.values(locationProgress).reduce((sum, progress) => {
      return sum + (progress.maxLevelReached || 0);
    }, 0);
  }, [locationProgress]);

  // Обновляем totalScore при изменении прогресса
  useEffect(() => {
    const totalScore = calculateTotalScore();
    setState((prev) => ({ ...prev, totalScore }));
  }, [calculateTotalScore]);

  // Сохраняем lastSubmittedScore в localStorage
  const saveLastSentScore = useCallback((score: number) => {
    try {
      localStorage.setItem(LAST_SENT_SCORE_KEY, score.toString());
      lastSubmittedRef.current = score;
    } catch (e) {
      console.warn("[useLeaderboard] Failed to save last sent score:", e);
    }
  }, []);

  // Отправляем рекорд ТОЛЬКО если он реально вырос
  const submitIfImproved = useCallback(
    async (scoreToSubmit: number) => {
      if (!isAuthorized) return;

      // Используем ref вместо state чтобы всегда иметь актуальное значение
      const lastSent = lastSubmittedRef.current;

      // ❗ ГЛАВНАЯ ПРОВЕРКА: отправляем только если счёт увеличился
      if (scoreToSubmit <= lastSent) {
        console.log("[useLeaderboard] Score not improved, skipping:", {
          current: scoreToSubmit,
          lastSent: lastSent,
        });
        return;
      }

      // Не отправляем 0 или отрицательные значения
      if (scoreToSubmit <= 0) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        console.log("[useLeaderboard] Submitting improved score:", {
          from: lastSent,
          to: scoreToSubmit,
        });

        const submitted = await adService.submitScore(scoreToSubmit);

        if (submitted) {
          // Сохраняем успешно отправленное значение
          saveLastSentScore(scoreToSubmit);

          // Получаем ранг с небольшой задержкой
          setTimeout(async () => {
            const rank = await adService.getPlayerRank();
            setState((prev) => ({
              ...prev,
              rank,
              isLoading: false,
            }));
          }, 800);
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error("[useLeaderboard] Error submitting score:", err);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [isAuthorized, saveLastSentScore],
  );

  // Проверяем улучшение при изменении прогресса (с дебаунсом)
  useEffect(() => {
    const currentScore = calculateTotalScore();

    // Если счёт вырос — запускаем таймер на отправку
    if (isAuthorized && currentScore > lastSubmittedRef.current) {
      // Сохраняем счёт который хотим отправить
      pendingSubmitRef.current = currentScore;

      // Очищаем предыдущий таймаут
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }

      submitTimeoutRef.current = window.setTimeout(() => {
        const score = pendingSubmitRef.current;
        if (score !== null) {
          submitIfImproved(score);
          pendingSubmitRef.current = null;
        }
      }, 3000); // 3 секунды дебаунс

      return () => {
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }
      };
    }
  }, [calculateTotalScore, isAuthorized, submitIfImproved]);

  // Периодически обновляем ранг (но не отправляем счёт)
  useEffect(() => {
    if (!isAuthorized) return;

    const updateRankOnly = async () => {
      const rank = await adService.getPlayerRank();
      setState((prev) => ({ ...prev, rank }));
    };

    updateRankOnly();
    const interval = setInterval(updateRankOnly, 60000); // Раз в минуту

    return () => clearInterval(interval);
  }, [isAuthorized]);

  // Ручное обновление
  const refreshRank = useCallback(async () => {
    if (!isAuthorized) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    const rank = await adService.getPlayerRank();
    setState((prev) => ({ ...prev, rank, isLoading: false }));
  }, [isAuthorized]);

  return {
    rank: state.rank,
    totalScore: state.totalScore,
    isLoading: state.isLoading,
    isAuthorized,
    refreshRank,
    // Для отладки:
    lastSubmittedScore: lastSubmittedRef.current,
    hasImproved: calculateTotalScore() > lastSubmittedRef.current,
  };
}
