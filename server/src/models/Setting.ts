import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface ISetting {
  smsOtpEnabled: boolean;
  emailOtpEnabled: boolean;
  emailNotificationsEnabled: boolean;
  feedbackEnabled: boolean;
  notifyRequesterOnEveryAction: boolean;
  requireRequesterEmail: boolean;
  mobileMode: 'hidden' | 'optional' | 'required' | 'otp_required';
  emailMode: 'hidden' | 'optional' | 'required' | 'otp_required';
  notifyEvents: {
    created: boolean;
    assigned: boolean;
    statusChanged: boolean;
    resolved: boolean;
    closed: boolean;
    reopened: boolean;
    commented: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ISettingDocument = HydratedDocument<ISetting>;

const settingSchema = new Schema<ISetting>(
  {
    smsOtpEnabled: { type: Boolean, default: true },
    emailOtpEnabled: { type: Boolean, default: false },
    emailNotificationsEnabled: { type: Boolean, default: true },
    feedbackEnabled: { type: Boolean, default: true },
    notifyRequesterOnEveryAction: { type: Boolean, default: true },
    requireRequesterEmail: { type: Boolean, default: false },
    mobileMode: {
      type: String,
      enum: ['hidden', 'optional', 'required', 'otp_required'],
      default: 'otp_required',
    },
    emailMode: {
      type: String,
      enum: ['hidden', 'optional', 'required', 'otp_required'],
      default: 'optional',
    },
    notifyEvents: {
      created: { type: Boolean, default: true },
      assigned: { type: Boolean, default: true },
      statusChanged: { type: Boolean, default: true },
      resolved: { type: Boolean, default: true },
      closed: { type: Boolean, default: true },
      reopened: { type: Boolean, default: true },
      commented: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const Setting: Model<ISetting> = mongoose.model<ISetting>('Setting', settingSchema);

export default Setting;
