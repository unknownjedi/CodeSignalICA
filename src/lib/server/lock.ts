const locks = new Map<string, Promise<unknown>>();

export function withAssessmentLock<T>(
  assessmentId: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = locks.get(assessmentId) ?? Promise.resolve();
  const next = previous.then(task, task);
  locks.set(
    assessmentId,
    next.catch(() => {})
  );
  return next;
}
