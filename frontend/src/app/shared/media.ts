import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { MEDIA } from '@stupa-makers/ui-kit';

/** True while the viewport is phone sized (the ui-kit breakpoint). Call in an injection context. */
export function isPhone(): Signal<boolean> {
  if (typeof matchMedia === 'undefined') return signal(false);
  const query = matchMedia(MEDIA.phone);
  const value = signal(query.matches);
  const listener = (e: MediaQueryListEvent) => value.set(e.matches);
  query.addEventListener('change', listener);
  inject(DestroyRef).onDestroy(() => query.removeEventListener('change', listener));
  return value.asReadonly();
}
