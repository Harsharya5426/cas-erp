import { ERROR_CODES } from '@cas-erp/shared';
import { env } from '../config/env.js';
import { verifyHmacSignature } from '../core/crypto.js';
import { AppError } from '../core/errors.js';

export interface CashfreeCreateOrderInput {
  orderId: string;
  orderAmount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
}

export function getCashfreeStatus() {
  const configured =
    env.CASHFREE_MODE !== 'disabled' &&
    Boolean(env.CASHFREE_CLIENT_ID) &&
    Boolean(env.CASHFREE_CLIENT_SECRET);
  return {
    mode: env.CASHFREE_MODE,
    configured,
    apiVersion: env.CASHFREE_API_VERSION
  };
}

function getBaseUrl(): string {
  return env.CASHFREE_MODE === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

export async function createCashfreeOrder(input: CashfreeCreateOrderInput) {
  const status = getCashfreeStatus();
  if (!status.configured) {
    throw new AppError(
      503,
      ERROR_CODES.INTEGRATION_NOT_CONFIGURED,
      'Cashfree merchant credentials are not configured. Use offline/challan payment recording or configure CASHFREE_MODE=sandbox with client credentials.'
    );
  }

  const response = await fetch(`${getBaseUrl()}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': env.CASHFREE_API_VERSION,
      'x-client-id': env.CASHFREE_CLIENT_ID,
      'x-client-secret': env.CASHFREE_CLIENT_SECRET
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.orderAmount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new AppError(
      502,
      ERROR_CODES.EXTERNAL_GATEWAY_ERROR,
      `Cashfree order creation failed (${response.status})`,
      { providerMessage: errText.slice(0, 300) }
    );
  }

  return response.json() as Promise<{
    cf_order_id: string;
    order_id: string;
    payment_session_id: string;
    order_status: string;
  }>;
}

export async function fetchCashfreeOrderStatus(orderId: string) {
  const status = getCashfreeStatus();
  if (!status.configured) {
    throw new AppError(
      503,
      ERROR_CODES.INTEGRATION_NOT_CONFIGURED,
      'Cashfree merchant credentials are not configured.'
    );
  }

  const response = await fetch(`${getBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      'x-api-version': env.CASHFREE_API_VERSION,
      'x-client-id': env.CASHFREE_CLIENT_ID,
      'x-client-secret': env.CASHFREE_CLIENT_SECRET
    }
  });

  if (!response.ok) {
    throw new AppError(502, ERROR_CODES.EXTERNAL_GATEWAY_ERROR, 'Failed to verify Cashfree order server-to-server');
  }

  return response.json() as Promise<{
    order_id: string;
    order_status: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
    order_amount: number;
  }>;
}

export function verifyCashfreeWebhookSignature(
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  const secret =
    process.env.CASHFREE_WEBHOOK_SECRET ||
    env.CASHFREE_WEBHOOK_SECRET ||
    process.env.CASHFREE_CLIENT_SECRET ||
    env.CASHFREE_CLIENT_SECRET;
  if (!secret || !timestamp || !signature) return false;
  return verifyHmacSignature(`${timestamp}${rawBody}`, signature, secret, 'base64');
}
