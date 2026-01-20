import { useCallback, useState } from "react";

export interface HistoryItem {
  fileId: string;
  scrollPosition: number;
  timestamp: Date;
}

export function useNavigationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const push = useCallback(
    (fileId: string, scrollPosition: number = 0) => {
      // Remove any forward history when a new navigation occurs
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push({
        fileId,
        scrollPosition,
        timestamp: new Date(),
      });
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    },
    [history, currentIndex]
  );

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return history[currentIndex - 1].fileId;
    }
    return null;
  }, [history, currentIndex]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return history[currentIndex + 1].fileId;
    }
    return null;
  }, [history, currentIndex]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  return {
    push,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    current: currentIndex >= 0 ? history[currentIndex] : null,
  };
}
