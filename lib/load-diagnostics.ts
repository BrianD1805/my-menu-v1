export function startLoadTimer(label: string) {
  const startedAt = Date.now();
  return {
    end(extra?: Record<string, unknown>) {
      const durationMs = Date.now() - startedAt;
      console.info(`[Orduva load] ${label}: ${durationMs}ms`, extra || "");
      return durationMs;
    },
  };
}
