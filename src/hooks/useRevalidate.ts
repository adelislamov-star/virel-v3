'use client';

import { useState } from 'react';

export function useRevalidate() {
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [revalidateStatus, setRevalidateStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const revalidate = async (path: string) => {
    setIsRevalidating(true);
    setRevalidateStatus('idle');

    try {
      const res = await fetch(
        `/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        }
      );

      if (res.ok) {
        setRevalidateStatus('success');
        setTimeout(() => setRevalidateStatus('idle'), 3000);
      } else {
        setRevalidateStatus('error');
        setTimeout(() => setRevalidateStatus('idle'), 3000);
      }
    } catch {
      setRevalidateStatus('error');
      setTimeout(() => setRevalidateStatus('idle'), 3000);
    } finally {
      setIsRevalidating(false);
    }
  };

  return { revalidate, isRevalidating, revalidateStatus };
}
