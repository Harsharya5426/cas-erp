import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    portalPath: { type: String, default: '/' },
    category: { type: String, default: 'system' },
    channel: { type: String, enum: ['in_app', 'email', 'sms', 'whatsapp'], default: 'in_app' },
    deliveryState: { type: String, default: 'delivered' },
    readAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);

const announcementSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    titleHi: { type: String, default: '' },
    content: { type: String, required: true },
    contentHi: { type: String, default: '' },
    category: { type: String, required: true },
    priority: { type: String, enum: ['Urgent', 'High', 'Normal'], default: 'Normal' },
    targetRole: { type: String, default: 'ALL' },
    departmentName: { type: String, default: 'Office of the Registrar' },
    isPublic: { type: Boolean, default: false },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    publishedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true, versionKey: false }
);
announcementSchema.index({ isPublic: 1, publishedAt: -1 });
export const Announcement = mongoose.model('Announcement', announcementSchema);

