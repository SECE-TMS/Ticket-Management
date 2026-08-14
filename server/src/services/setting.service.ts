import Setting, { type ISetting } from '../models/Setting';

export const getSettings = async (): Promise<ISetting> => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      smsOtpEnabled: true,
      emailNotificationsEnabled: true,
      feedbackEnabled: true,
      notifyRequesterOnEveryAction: true,
      requireRequesterEmail: false,
      mobileMode: 'otp_required',
      emailMode: 'optional',
      notifyEvents: {
        created: true,
        assigned: true,
        statusChanged: true,
        resolved: true,
        closed: true,
        reopened: true,
        commented: true,
      },
    });
  } else {
    // Fill defaults for existing documents if not set
    if (settings.feedbackEnabled === undefined) {
      settings.feedbackEnabled = true;
    }
    if (!settings.mobileMode) {
      settings.mobileMode = settings.smsOtpEnabled ? 'otp_required' : 'required';
    }
    if (!settings.emailMode) {
      settings.emailMode = settings.requireRequesterEmail ? 'required' : 'optional';
    }
  }
  return settings;
};

export const updateSettings = async (data: Partial<ISetting>): Promise<ISetting> => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting(data);
  } else {
    Object.assign(settings, data);
  }

  // Keep boolean flags synced with modes
  if (data.mobileMode !== undefined) {
    settings.smsOtpEnabled = data.mobileMode === 'otp_required';
  }
  if (data.emailMode !== undefined) {
    settings.requireRequesterEmail = data.emailMode === 'required' || data.emailMode === 'otp_required';
    settings.emailOtpEnabled = data.emailMode === 'otp_required';
  }

  await settings.save();
  return settings;
};
