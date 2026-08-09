import { SystemAnnouncement, AuthUser } from '../types';

export function isAnnouncementTargetedToUser(
  announcement: SystemAnnouncement,
  user: AuthUser | null
): boolean {
  if (!user) return false;
  
  // Super admin always sees all announcements in admin preview mode
  if (user.role === 'SUPER_ADMIN') return true;

  // If no targetType or ALL, target everyone
  if (!announcement.targetType || announcement.targetType === 'ALL') {
    return true;
  }

  const now = new Date();

  switch (announcement.targetType) {
    case 'NEW_USERS': {
      // Registered less than 1 month (30 days) ago
      if (!user.registeredAt) return true;
      const regDate = new Date(user.registeredAt);
      const diffMs = now.getTime() - regDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 30 && diffDays >= 0;
    }

    case 'TRIAL_USERS': {
      // Subscription plan is '7_DAY_TRIAL' or status is 'TRIAL_ACTIVE'
      return user.subscriptionPlan === '7_DAY_TRIAL' || user.status === 'TRIAL_ACTIVE';
    }

    case 'NEAR_EXPIRY': {
      // Expiring within 7 days or recently expired within 30 days
      const expiryStr = user.approvedUntilDate || user.trialExpiryDate;
      if (!expiryStr) return false;
      const expiryDate = new Date(expiryStr);
      const diffMs = expiryDate.getTime() - now.getTime();
      const daysRemaining = diffMs / (1000 * 60 * 60 * 24);
      return daysRemaining <= 7 && daysRemaining >= -30;
    }

    case 'SUBSCRIPTION_PLAN': {
      if (!announcement.targetPlans || announcement.targetPlans.length === 0) {
        return true;
      }
      return announcement.targetPlans.includes(user.subscriptionPlan);
    }

    case 'MANUAL_USERS': {
      if (!announcement.targetUserIds || announcement.targetUserIds.length === 0) {
        return false;
      }
      return (
        announcement.targetUserIds.includes(user.id) ||
        announcement.targetUserIds.includes(user.phone) ||
        announcement.targetUserIds.includes(user.email) ||
        announcement.targetUserIds.includes(user.username)
      );
    }

    default:
      return true;
  }
}
