let sharedServerOnline: boolean =
  typeof navigator !== 'undefined' ? navigator.onLine : true;

const onlineSubscribers = new Set<(online: boolean) => void>();

export function getSharedServerOnline(): boolean {
  return sharedServerOnline;
}

export function setSharedServerOnline(next: boolean): void {
  sharedServerOnline = Boolean(next);
}

export function subscribeOnlineStatus(cb: (online: boolean) => void): () => void {
  onlineSubscribers.add(cb);
  return () => {
    onlineSubscribers.delete(cb);
  };
}

export function isAppOnlineNow(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  return sharedServerOnline;
}

export function setAppOnlineState(online: boolean, emitEvent: boolean = true): void {
  const next = Boolean(online) && (typeof navigator === 'undefined' || navigator.onLine);
  const changed = sharedServerOnline !== next;
  sharedServerOnline = next;
  if (changed) {
    onlineSubscribers.forEach((cb) => {
      try {
        cb(next);
      } catch {}
    });
  }
  if (emitEvent && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(next ? 'duowindo_network_online' : 'duowindo_network_offline')
    );
  }
}
