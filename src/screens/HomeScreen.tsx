import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { GoalStorage, Goal } from '../storage/storage';
import { GoalItem } from '../components/GoalItem';
import { CountdownUtils } from '../components/Countdown';
import { NotificationManager } from '../utils/notifications';
import { SortFilterModal } from '../components/SortFilterModal';

interface HomeScreenProps {
  navigation: any;
}

/**
 * HomeScreen component displays all goals with countdown timers
 * Features goal management, sorting, filtering, and real-time updates
 * Handles goal deletion and navigation to create new goals
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'deadline' | 'created' | 'title'>('deadline');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'expired'>('all');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  /**
   * Load goals from storage
   */
  const loadGoals = useCallback(async () => {
    try {
      const loadedGoals = await GoalStorage.getAllGoals();
      setGoals(loadedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert(
        'Error',
        'Failed to load goals. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Load goals on component mount
   */
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  /**
   * Handle goal deletion
   */
  const handleDeleteGoal = async (goalId: string) => {
    try {
      // Find the goal to get notification IDs
      const goalToDelete = goals.find(goal => goal.id === goalId);
      
      // Cancel notifications for this goal
      if (goalToDelete?.notificationIds) {
        await NotificationManager.cancelGoalNotifications(goalId);
      }

      const success = await GoalStorage.deleteGoal(goalId);
      if (success) {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      } else {
        Alert.alert(
          'Error',
          'Failed to delete goal. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle goal creation (navigate to create screen)
   */
  const handleCreateGoal = () => {
    navigation.navigate('CreateGoal');
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGoals();
  };

  /**
   * Sort goals based on selected criteria
   */
  const sortGoals = (goalsToSort: Goal[]): Goal[] => {
    return [...goalsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          const deadlineA = new Date(`${a.deadlineDate}T${a.deadlineTime}`).getTime();
          const deadlineB = new Date(`${b.deadlineDate}T${b.deadlineTime}`).getTime();
          return deadlineA - deadlineB;
        case 'created':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  /**
   * Filter goals based on selected criteria
   */
  const filterGoals = (goalsToFilter: Goal[]): Goal[] => {
    return goalsToFilter.filter(goal => {
      const isExpired = CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime);
      
      switch (filterBy) {
        case 'active':
          return !isExpired;
        case 'expired':
          return isExpired;
        case 'all':
        default:
          return true;
      }
    });
  };

  /**
   * Get processed goals (sorted and filtered)
   */
  const getProcessedGoals = (): Goal[] => {
    const filtered = filterGoals(goals);
    return sortGoals(filtered);
  };

  /**
   * Get statistics for display
   */
  const getStats = () => {
    const activeGoals = goals.filter(goal => !CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime));
    const expiredGoals = goals.filter(goal => CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime));
    
    return {
      total: goals.length,
      active: activeGoals.length,
      expired: expiredGoals.length,
    };
  };

  /**
   * Render individual goal item
   */
  const renderGoalItem = ({ item }: { item: Goal }) => (
    <GoalItem
      goal={item}
      onDelete={handleDeleteGoal}
    />
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Goals Yet</Text>
      <Text style={styles.emptySubtitle}>
        {filterBy === 'all' 
          ? 'Create your first goal to get started!'
          : filterBy === 'active'
          ? 'No active goals at the moment.'
          : 'No expired goals yet.'
        }
      </Text>
      {filterBy === 'all' && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={handleCreateGoal}
        >
          <Text style={styles.createFirstButtonText}>Create Your First Goal</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * Render header with stats and controls
   */
  const renderHeader = () => {
    const stats = getStats();
    
    return (
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.activeStat]}>
              {stats.active}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.expiredStat]}>
              {stats.expired}
            </Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        {/* Sort and Filter Button */}
        <TouchableOpacity
          style={styles.sortFilterButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.sortFilterButtonText}>
            🔧 Sort & Filter
          </Text>
          <Text style={styles.sortFilterSubtext}>
            {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} • {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={getProcessedGoals()}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateGoal}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Sort & Filter Modal */}
      <SortFilterModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        sortBy={sortBy}
        filterBy={filterBy}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  activeStat: {
    color: '#28A745',
  },
  expiredStat: {
    color: '#FF3B30',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sortFilterButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  sortFilterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sortFilterSubtext: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
