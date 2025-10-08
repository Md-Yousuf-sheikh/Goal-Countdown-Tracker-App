import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Goal } from '../storage/storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Notification utility class for managing goal deadline alerts
 * Handles permission requests, scheduling, and cancellation of notifications
 */
export class NotificationManager {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('goal-reminders', {
          name: 'Goal Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for a goal deadline
   */
  static async scheduleGoalNotification(goal: Goal): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Calculate notification time (1 hour before deadline)
      const [year, month, day] = goal.deadlineDate.split('-').map(Number);
      const [hour, minute] = goal.deadlineTime.split(':').map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      
      // Schedule notification 1 hour before deadline
      const notificationTime = new Date(deadline.getTime() - 60 * 60 * 1000);
      const now = new Date();

      // Don't schedule if notification time is in the past
      if (notificationTime <= now) {
        console.log('Notification time is in the past, skipping');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Goal Deadline Approaching!',
          body: `"${goal.title}" deadline is in 1 hour`,
          data: {
            goalId: goal.id,
            goalTitle: goal.title,
            deadlineDate: goal.deadlineDate,
            deadlineTime: goal.deadlineTime,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: notificationTime,
        },
      });

      console.log(`Scheduled notification for goal "${goal.title}" at ${notificationTime.toISOString()}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule multiple notifications for a goal (1 hour, 30 minutes, 5 minutes before)
   */
  static async scheduleMultipleGoalNotifications(goal: Goal): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const [year, month, day] = goal.deadlineDate.split('-').map(Number);
      const [hour, minute] = goal.deadlineTime.split(':').map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();

      const notificationIds: string[] = [];
      const intervals = [
        { minutes: 60, message: '1 hour' },
        { minutes: 30, message: '30 minutes' },
        { minutes: 5, message: '5 minutes' },
      ];

      for (const interval of intervals) {
        const notificationTime = new Date(deadline.getTime() - interval.minutes * 60 * 1000);
        
        // Only schedule if notification time is in the future
        if (notificationTime > now) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Goal Deadline Approaching!',
              body: `"${goal.title}" deadline is in ${interval.message}`,
              data: {
                goalId: goal.id,
                goalTitle: goal.title,
                deadlineDate: goal.deadlineDate,
                deadlineTime: goal.deadlineTime,
                interval: interval.minutes,
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: notificationTime,
            },
          });

          notificationIds.push(notificationId);
        }
      }

      console.log(`Scheduled ${notificationIds.length} notifications for goal "${goal.title}"`);
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling multiple notifications:', error);
      return [];
    }
  }

  /**
   * Cancel a specific notification
   */
  static async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cancel notifications for a specific goal
   */
  static async cancelGoalNotifications(goalId: string): Promise<boolean> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      const goalNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.goalId === goalId
      );

      for (const notification of goalNotifications) {
        await this.cancelNotification(notification.identifier);
      }

      console.log(`Cancelled ${goalNotifications.length} notifications for goal ${goalId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling goal notifications:', error);
      return false;
    }
  }

  /**
   * Reschedule notifications for a goal (useful when goal is updated)
   */
  static async rescheduleGoalNotifications(goal: Goal): Promise<string[]> {
    try {
      // Cancel existing notifications for this goal
      await this.cancelGoalNotifications(goal.id);
      
      // Schedule new notifications
      return await this.scheduleMultipleGoalNotifications(goal);
    } catch (error) {
      console.error('Error rescheduling goal notifications:', error);
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<{
    enabled: boolean;
    permissions: Notifications.NotificationPermissionsStatus;
  }> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      return {
        enabled: permissions.status === 'granted',
        permissions,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        enabled: false,
        permissions: { status: 'undetermined' },
      };
    }
  }
}
