import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Goal interface
export interface Goal {
  id: string;
  title: string;
  description?: string;
  deadlineDate: string; // YYYY-MM-DD format
  deadlineTime: string; // HH:MM format (24-hour)
  createdAt: string; // ISO timestamp
  notificationIds?: string[]; // Array of notification IDs for this goal
}

// Storage key for goals
const GOALS_STORAGE_KEY = '@countdown_tracker_goals';
// Storage key for notified goals
const NOTIFIED_GOALS_STORAGE_KEY = '@countdown_tracker_notified_goals';

/**
 * Storage utility class for managing goals in AsyncStorage
 * Handles all CRUD operations for goals with proper error handling
 */
export class GoalStorage {
  /**
   * Save a single goal to AsyncStorage
   * @param goal - The goal object to save
   * @returns Promise<boolean> - Success status
   */
  static async saveGoal(goal: Goal): Promise<boolean> {
    try {
      const existingGoals = await this.getAllGoals();
      const updatedGoals = [...existingGoals, goal];
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));
      return true;
    } catch (error) {
      console.error('Error saving goal:', error);
      return false;
    }
  }

  /**
   * Get all goals from AsyncStorage
   * @returns Promise<Goal[]> - Array of all goals
   */
  static async getAllGoals(): Promise<Goal[]> {
    try {
      const goalsJson = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      return goalsJson ? JSON.parse(goalsJson) : [];
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  }

  /**
   * Update an existing goal
   * @param goalId - ID of the goal to update
   * @param updatedGoal - Updated goal object
   * @returns Promise<boolean> - Success status
   */
  static async updateGoal(goalId: string, updatedGoal: Partial<Goal>): Promise<boolean> {
    try {
      const goals = await this.getAllGoals();
      const goalIndex = goals.findIndex(goal => goal.id === goalId);
      
      if (goalIndex === -1) {
        return false;
      }

      goals[goalIndex] = { ...goals[goalIndex], ...updatedGoal };
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      return false;
    }
  }

  /**
   * Delete a goal by ID
   * @param goalId - ID of the goal to delete
   * @returns Promise<boolean> - Success status
   */
  static async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const goals = await this.getAllGoals();
      const filteredGoals = goals.filter(goal => goal.id !== goalId);
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(filteredGoals));
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  }

  /**
   * Clear all goals from storage
   * @returns Promise<boolean> - Success status
   */
  static async clearAllGoals(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(GOALS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing goals:', error);
      return false;
    }
  }

  /**
   * Generate a unique ID for new goals
   * @returns string - Unique ID
   */
  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save notified goals to AsyncStorage
   * @param notifiedGoals - Set of goal IDs that have been notified
   * @returns Promise<boolean> - Success status
   */
  static async saveNotifiedGoals(notifiedGoals: Set<string>): Promise<boolean> {
    try {
      const notifiedGoalsArray = Array.from(notifiedGoals);
      await AsyncStorage.setItem(NOTIFIED_GOALS_STORAGE_KEY, JSON.stringify(notifiedGoalsArray));
      return true;
    } catch (error) {
      console.error('Error saving notified goals:', error);
      return false;
    }
  }

  /**
   * Get notified goals from AsyncStorage
   * @returns Promise<Set<string>> - Set of goal IDs that have been notified
   */
  static async getNotifiedGoals(): Promise<Set<string>> {
    try {
      const notifiedGoalsJson = await AsyncStorage.getItem(NOTIFIED_GOALS_STORAGE_KEY);
      const notifiedGoalsArray = notifiedGoalsJson ? JSON.parse(notifiedGoalsJson) : [];
      return new Set(notifiedGoalsArray);
    } catch (error) {
      console.error('Error getting notified goals:', error);
      return new Set();
    }
  }

  /**
   * Add a goal ID to notified goals
   * @param goalId - ID of the goal to mark as notified
   * @returns Promise<boolean> - Success status
   */
  static async addNotifiedGoal(goalId: string): Promise<boolean> {
    try {
      const notifiedGoals = await this.getNotifiedGoals();
      notifiedGoals.add(goalId);
      return await this.saveNotifiedGoals(notifiedGoals);
    } catch (error) {
      console.error('Error adding notified goal:', error);
      return false;
    }
  }

  /**
   * Clear all notified goals from storage
   * @returns Promise<boolean> - Success status
   */
  static async clearNotifiedGoals(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(NOTIFIED_GOALS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing notified goals:', error);
      return false;
    }
  }
}
