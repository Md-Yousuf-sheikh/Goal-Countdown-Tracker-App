import AsyncStorage from '@react-native-async-storage/async-storage';

const GOALS_KEY = 'countdown_goals';

export const storage = {
  // Save goals to AsyncStorage
  async saveGoals(goals) {
    try {
      const jsonGoals = JSON.stringify(goals);
      await AsyncStorage.setItem(GOALS_KEY, jsonGoals);
      return true;
    } catch (error) {
      console.error('Error saving goals:', error);
      return false;
    }
  },

  // Load goals from AsyncStorage
  async loadGoals() {
    try {
      const jsonGoals = await AsyncStorage.getItem(GOALS_KEY);
      return jsonGoals ? JSON.parse(jsonGoals) : [];
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    }
  },

  // Add a new goal
  async addGoal(goal) {
    try {
      const goals = await this.loadGoals();
      const newGoal = {
        id: Date.now().toString(),
        ...goal,
        createdAt: new Date().toISOString(),
      };
      goals.push(newGoal);
      await this.saveGoals(goals);
      return newGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
      return null;
    }
  },

  // Delete a goal
  async deleteGoal(goalId) {
    try {
      const goals = await this.loadGoals();
      const filteredGoals = goals.filter(goal => goal.id !== goalId);
      await this.saveGoals(filteredGoals);
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  },

  // Update a goal
  async updateGoal(goalId, updatedGoal) {
    try {
      const goals = await this.loadGoals();
      const goalIndex = goals.findIndex(goal => goal.id === goalId);
      if (goalIndex !== -1) {
        goals[goalIndex] = { ...goals[goalIndex], ...updatedGoal };
        await this.saveGoals(goals);
        return goals[goalIndex];
      }
      return null;
    } catch (error) {
      console.error('Error updating goal:', error);
      return null;
    }
  },

  // Clear all goals
  async clearAllGoals() {
    try {
      await AsyncStorage.removeItem(GOALS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing goals:', error);
      return false;
    }
  }
};
