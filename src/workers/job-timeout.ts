/**
 * Wrap a job processor promise with a hard timeout.
 *
 * BullMQ has no built-in per-job execution timeout, so a stuck job (e.g. a
 * hung OCR engine or an unresponsive NAS mount) would occupy a worker slot
 * indefinitely. This races the processor against a timer; on timeout the job
 * rejects and BullMQ applies the queue's normal retry/fail handling, freeing
 * the slot.
 */
export async function withJobTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} exceeded ${timeoutMs}ms timeout`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
