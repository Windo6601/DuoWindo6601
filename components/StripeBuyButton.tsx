import React, { useEffect, useRef, useState } from 'react';
import { STRIPE_PUBLISHABLE_KEY } from '../types';
import { getStripeConfig } from '../services/stripeService';

interface StripeBuyButtonProps {
  buyButtonId: string;
  publishableKey?: string;
  customerEmail?: string;
  clientReferenceId?: string;
  className?: string;
}

export const StripeBuyButton: React.FC<StripeBuyButtonProps> = ({
  buyButtonId,
  publishableKey = STRIPE_PUBLISHABLE_KEY,
  customerEmail,
  clientReferenceId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedKey, setResolvedKey] = useState<string>(publishableKey || STRIPE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (publishableKey && publishableKey.startsWith('pk_')) {
      setResolvedKey(publishableKey);
      return;
    }
    let mounted = true;
    getStripeConfig().then((cfg) => {
      if (mounted && cfg?.publishableKey && cfg.publishableKey.startsWith('pk_')) {
        setResolvedKey(cfg.publishableKey);
      }
    });
    return () => {
      mounted = false;
    };
  }, [publishableKey]);

  useEffect(() => {
    if (!document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/buy-button.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  if (!resolvedKey || !resolvedKey.startsWith('pk_') || !buyButtonId || buyButtonId.endsWith('_trial')) {
    return null;
  }

  return (
    <div ref={containerRef} className={`stripe-buy-btn-container ${className}`}>
      {React.createElement('stripe-buy-button', {
        'buy-button-id': buyButtonId,
        'publishable-key': resolvedKey,
        'customer-email': customerEmail || undefined,
        'client-reference-id': clientReferenceId || undefined,
      })}
    </div>
  );
};
