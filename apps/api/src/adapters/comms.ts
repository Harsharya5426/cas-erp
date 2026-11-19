import { env } from '../config/env.js';
import { logger } from '../core/logger.js';
import { Notification } from '../modules/notifications/models.js';

export type CommsChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export interface DispatchCommsInput {
  recipientUserId?: string | null;
  recipientContact?: string;
  channel: CommsChannel;
  title: string;
  body: string;
  portalPath?: string;
  category?: string;
}

export async function dispatchCommunication(input: DispatchCommsInput) {
  let deliveryState: 'delivered' | 'queued' | 'skipped_disabled' = 'skipped_disabled';
  let providerMessageId: string | undefined;

  if (input.channel === 'in_app' && input.recipientUserId) {
    const doc = await Notification.create({
      userId: input.recipientUserId,
      title: input.title,
      body: input.body,
      portalPath: input.portalPath || '/',
      category: input.category || 'system',
      channel: 'in_app',
      deliveryState: 'delivered'
    });
    return { deliveryState: 'delivered', notificationId: String(doc._id) };
  }

  const providerMode =
    input.channel === 'email'
      ? env.EMAIL_PROVIDER
      : input.channel === 'sms'
      ? env.SMS_PROVIDER
      : env.WHATSAPP_PROVIDER;

  if (providerMode === 'log') {
    deliveryState = 'delivered';
    providerMessageId = `log_${input.channel}_${Date.now()}`;
    // Log metadata only — never log sensitive document contents
    logger.info(
      { channel: input.channel, providerMessageId, category: input.category },
      'External notification logged by configured log adapter'
    );
  } else if (providerMode !== 'disabled') {
    deliveryState = 'queued';
    providerMessageId = `queued_${input.channel}_${Date.now()}`;
  }

  return { deliveryState, providerMessageId, providerMode };
}

