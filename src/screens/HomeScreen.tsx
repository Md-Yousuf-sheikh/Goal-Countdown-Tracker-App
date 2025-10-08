import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  const expiryCheckInterval = useRef<NodeJS.Timeout | null>(null);

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
   * Check for newly expired goals and update state
   */
  const checkForExpiredGoals = useCallback(() => {
    setGoals(prevGoals => {
      let hasChanges = false;
      const updatedGoals = prevGoals.map(goal => {
        const isExpired = CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime);
        // If goal just expired, we need to trigger a re-render
        if (isExpired) {
          hasChanges = true;
          console.log(`Goal "${goal.title}" has expired!`);
        }
        return goal;
      });
      
      // Only update state if there are changes to prevent unnecessary re-renders
      return hasChanges ? [...updatedGoals] : prevGoals;
    });
  }, []);

  /**
   * Check for goals expiring soon (within next minute) for smoother transitions
   */
  const checkForGoalsExpiringSoon = useCallback(() => {
    setGoals(prevGoals => {
      let hasChanges = false;
      const updatedGoals = prevGoals.map(goal => {
        const isExpired = CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime);
        if (!isExpired) {
          // Check if goal expires within the next minute
          try {
            const [year, month, day] = goal.deadlineDate.split('-').map(Number);
            const [hour, minute] = goal.deadlineTime.split(':').map(Number);
            const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
            const now = new Date();
            const timeUntilExpiry = deadline.getTime() - now.getTime();
            
            // If expires within 60 seconds, trigger more frequent updates
            if (timeUntilExpiry <= 60000 && timeUntilExpiry > 0) {
              hasChanges = true;
            }
          } catch (error) {
            console.error('Error checking expiry time:', error);
          }
        }
        return goal;
      });
      
      return hasChanges ? [...updatedGoals] : prevGoals;
    });
  }, []);

  /**
   * Start periodic expiry checking
   */
  const startExpiryChecking = useCallback(() => {
    // Clear existing interval
    if (expiryCheckInterval.current) {
      clearInterval(expiryCheckInterval.current);
    }
    
    // Check for expired goals every 10 seconds for more responsive updates
    expiryCheckInterval.current = setInterval(() => {
      console.log('Checking for expired goals...');
      checkForExpiredGoals();
      checkForGoalsExpiringSoon();
    }, 10000);
  }, [checkForExpiredGoals, checkForGoalsExpiringSoon]);

  /**
   * Stop periodic expiry checking
   */
  const stopExpiryChecking = useCallback(() => {
    if (expiryCheckInterval.current) {
      clearInterval(expiryCheckInterval.current);
      expiryCheckInterval.current = null;
    }
  }, []);

  /**
   * Start expiry checking when component mounts and stop when unmounts
   */
  useEffect(() => {
    startExpiryChecking();
    
    return () => {
      stopExpiryChecking();
    };
  }, [startExpiryChecking, stopExpiryChecking]);

  /**
   * Auto-refresh when screen comes into focus (e.g., returning from CreateGoal)
   */
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - refreshing goals');
      loadGoals();
      // Also check for expired goals immediately when screen comes into focus
      setTimeout(() => {
        checkForExpiredGoals();
      }, 100);
    }, [loadGoals, checkForExpiredGoals])
  );

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
