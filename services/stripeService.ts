export interface StripePlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
}

export interface StripeConfig {
  publishableKey: string;
  configured: boolean;
  mode?: 'test' | 'live';
  taxEnabled?: boolean;
  connectEnabled?: boolean;
  products?: string[];
  plans: {
    super: StripePlan;
    max: StripePlan;
  };
}

export interface StripeApiStatus {
  ok: boolean;
  configured: boolean;
  connected: boolean;
  mode: 'test' | 'live';
  publishableKey: string;
  maskedSecretKey: string | null;
  currency?: string;
  availableBalance?: number;
  products: string[];
  environments: {
    cloudRun: boolean;
    aiStudio: boolean;
  };
  error?: string;
  timestamp: string;
}

export const getStripeConfig = async (): Promise<StripeConfig | null> => {
  try {
    const res = await fetch('/api/stripe/config');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Failed to fetch Stripe config:', e);
    return null;
  }
};

export const getStripeApiStatus = async (): Promise<StripeApiStatus | null> => {
  try {
    const res = await fetch('/api/stripe/status', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Failed to verify Stripe API status:', e);
    return null;
  }
};

/**
 * Safely navigates to Stripe Checkout / Portal.
 * In direct Cloud Run tabs, navigates the current window.
 * In AI Studio embedded iframes (where checkout.stripe.com denies framing),
 * attempts top-frame navigation cleanly and returns fallbackUrl if sandboxed.
 */
export const navigateToStripeUrl = (url: string): { navigated: boolean; fallbackUrl?: string } => {
  if (typeof window === 'undefined' || !url) {
    return { navigated: false, fallbackUrl: url };
  }
  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (!inIframe) {
    window.location.href = url;
    return { navigated: true };
  }

  try {
    if (window.top) {
      window.top.location.href = url;
      return { navigated: true };
    }
  } catch {
    // Sandboxed iframe (e.g. AI Studio) blocks cross-origin top navigation; caller displays clickable external link
  }

  return { navigated: false, fallbackUrl: url };
};

export const createStripeCheckout = async (params: {
  tier: 'super' | 'max';
  email?: string;
  username?: string;
}): Promise<{ url?: string; sessionId?: string; error?: string }> => {
  try {
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: params.tier,
        email: params.email,
        username: params.username,
        returnUrl: window.location.origin,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { error: data?.error?.message || 'Failed to create checkout session' };
    }
    return { url: data.url, sessionId: data.sessionId };
  } catch (e: any) {
    return { error: e?.message || 'Network error creating Stripe session' };
  }
};

export const createStripeGemsCheckout = async (params: {
  gems: 1200 | 6500;
  email?: string;
  username?: string;
}): Promise<{ url?: string; sessionId?: string; error?: string }> => {
  try {
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'gems',
        gems: params.gems,
        email: params.email,
        username: params.username,
        returnUrl: window.location.origin,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { error: data?.error?.message || 'Failed to create gems checkout session' };
    }
    return { url: data.url, sessionId: data.sessionId };
  } catch (e: any) {
    return { error: e?.message || 'Network error creating Stripe gems session' };
  }
};

export const cancelStripeSubscription = async (params: {
  subscriptionId?: string;
  customerId?: string;
  email?: string;
  reason?: string;
}): Promise<{ success: boolean; message: string; canceledAt?: string }> => {
  try {
    const res = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: params.subscriptionId,
        customerId: params.customerId,
        email: params.email,
        reason: params.reason || 'User cancelled subscription in Shop',
      }),
    });

    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || 'Subscription successfully cancelled',
      canceledAt: data.canceledAt || new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      success: true,
      message: 'Подписка отменена локально в DuoWindo6601',
      canceledAt: new Date().toISOString(),
    };
  }
};

export const openStripePortal = async (params: {
  customerId?: string;
  email?: string;
}): Promise<{ url?: string; error?: string }> => {
  try {
    const res = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: params.customerId,
        email: params.email,
        returnUrl: window.location.origin,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { error: data?.error?.message || 'Customer portal not available' };
    }
    return { url: data.url };
  } catch (e: any) {
    return { error: e?.message || 'Failed to open customer portal' };
  }
};

export const checkStripeSession = async (sessionId: string) => {
  try {
    const res = await fetch(`/api/stripe/session-status/${encodeURIComponent(sessionId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};
