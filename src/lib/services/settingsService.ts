import { prisma } from '@/lib/prisma';

export class SettingsService {
  private static SETTINGS_ID = 'default';

  /**
   * Get system settings (creates default if not exists)
   */
  async getSettings() {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: SettingsService.SETTINGS_ID },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: SettingsService.SETTINGS_ID,
          cancellationDeadlineHours: 2,
          absenceAlertThreshold: 3,
          absenceAlertWindowDays: 30,
          absenceAlertCooldownDays: 14,
          adminNotificationEmail: 'admin@svesting.de',
          absenceAlertEnabled: true,
          maxUploadSizeMB: 10,
          sessionGenerationDaysAhead: 90,
        },
      });
    }

    return settings;
  }

  /**
   * Update system settings
   */
  async updateSettings(
    data: {
      cancellationDeadlineHours?: number;
      absenceAlertThreshold?: number;
      absenceAlertWindowDays?: number;
      absenceAlertCooldownDays?: number;
      adminNotificationEmail?: string;
      absenceAlertEnabled?: boolean;
      maxUploadSizeMB?: number;
      sessionGenerationDaysAhead?: number;
    },
    modifiedBy: string
  ) {
    return prisma.systemSettings.upsert({
      where: { id: SettingsService.SETTINGS_ID },
      update: {
        ...data,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      },
      create: {
        id: SettingsService.SETTINGS_ID,
        cancellationDeadlineHours: data.cancellationDeadlineHours ?? 2,
        absenceAlertThreshold: data.absenceAlertThreshold ?? 3,
        absenceAlertWindowDays: data.absenceAlertWindowDays ?? 30,
        absenceAlertCooldownDays: data.absenceAlertCooldownDays ?? 14,
        adminNotificationEmail: data.adminNotificationEmail ?? 'admin@svesting.de',
        absenceAlertEnabled: data.absenceAlertEnabled ?? true,
        maxUploadSizeMB: data.maxUploadSizeMB ?? 10,
        sessionGenerationDaysAhead: data.sessionGenerationDaysAhead ?? 90,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      },
    });
  }

  /**
   * Get cancellation deadline in hours
   */
  async getCancellationDeadlineHours(): Promise<number> {
    const settings = await this.getSettings();
    return settings.cancellationDeadlineHours;
  }

  /**
   * Get absence alert settings
   */
  async getAbsenceAlertSettings() {
    const settings = await this.getSettings();
    return {
      threshold: settings.absenceAlertThreshold,
      windowDays: settings.absenceAlertWindowDays,
      cooldownDays: settings.absenceAlertCooldownDays,
      enabled: settings.absenceAlertEnabled,
      adminEmail: settings.adminNotificationEmail,
    };
  }
}

export const settingsService = new SettingsService();
