/**
 * High-performance streaming typewriter utility for conversational chat interfaces.
 * Simulates real-time token/word streaming with smooth 60fps rendering and cursor animation.
 */
export function streamMessageText(
  fullText: string,
  onUpdate: (currentText: string, isFinished: boolean) => void,
  options?: { speedMs?: number }
): Promise<void> {
  const speedMs = options?.speedMs ?? 18;
  const tokens = fullText.split(/(\s+)/);
  let currentAccumulated = "";
  let i = 0;

  return new Promise<void>((resolve) => {
    if (!fullText || tokens.length === 0) {
      onUpdate(fullText, true);
      resolve();
      return;
    }

    const interval = setInterval(() => {
      if (i < tokens.length) {
        currentAccumulated += tokens[i];
        i++;
        onUpdate(currentAccumulated, false);
      } else {
        clearInterval(interval);
        onUpdate(fullText, true);
        resolve();
      }
    }, speedMs);
  });
}
