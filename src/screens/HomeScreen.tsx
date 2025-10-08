import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { GoalStorage, Goal } from "../storage/storage";
import { GoalItem } from "../components/GoalItem";
import { CountdownUtils } from "../components/Countdown";

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
  const [sortBy, setSortBy] = useState<"deadline" | "created" | "title">(
    "deadline"
  );
  const [filterBy, setFilterBy] = useState<"all" | "active" | "expired">("all");
  const expiryCheckInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load goals from storage
   */
  const loadGoals = useCallback(async () => {
    try {
      const loadedGoals = await GoalStorage.getAllGoals();
      setGoals(loadedGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      Alert.alert("Error", "Failed to load goals. Please try again.", [
        { text: "OK" },
      ]);
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
      const goalToDelete = goals.find((goal) => goal.id === goalId);

      const success = await GoalStorage.deleteGoal(goalId);
      if (success) {
        setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
      } else {
        Alert.alert("Error", "Failed to delete goal. Please try again.", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  /**
   * Handle goal creation (navigate to create screen)
   */
  const handleCreateGoal = () => {
    navigation.navigate("CreateGoal");
  };

  /**
   * Handle goal editing (navigate to edit screen)
   */
  const handleEditGoal = (goal: Goal) => {
    navigation.navigate("EditGoal", {
      goal,
      onGoalUpdated: (updatedGoal: Goal) => {
        // Update the goal in the local state immediately
        setGoals((prevGoals) =>
          prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
        );
      },
    });
  };

  /**
   * Check for newly expired goals and update state
   */
  const checkForExpiredGoals = useCallback(() => {
    setGoals((prevGoals) => {
      let hasChanges = false;
      const updatedGoals = prevGoals.map((goal) => {
        const isExpired = CountdownUtils.isExpired(
          goal.deadlineDate,
          goal.deadlineTime
        );
        // If goal just expired, we need to trigger a re-render
        if (isExpired) {
          hasChanges = true;
          // console.log(`Goal "${goal.title}" has expired!`);
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
    setGoals((prevGoals) => {
      let hasChanges = false;
      const updatedGoals = prevGoals.map((goal) => {
        const isExpired = CountdownUtils.isExpired(
          goal.deadlineDate,
          goal.deadlineTime
        );
        if (!isExpired) {
          // Check if goal expires within the next minute
          try {
            const [year, month, day] = goal.deadlineDate.split("-").map(Number);
            const [hour, minute] = goal.deadlineTime.split(":").map(Number);
            const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
            const now = new Date();
            const timeUntilExpiry = deadline.getTime() - now.getTime();

            // If expires within 60 seconds, trigger more frequent updates
            if (timeUntilExpiry <= 60000 && timeUntilExpiry > 0) {
              hasChanges = true;
            }
          } catch (error) {
            console.error("Error checking expiry time:", error);
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

    // Check for expired goals every 1 second for instant expiration detection
    expiryCheckInterval.current = setInterval(() => {
      // console.log('Checking for expired goals...');
      checkForExpiredGoals();
      checkForGoalsExpiringSoon();
    }, 1000);
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
      // console.log('HomeScreen focused - refreshing goals');
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
      // Check if goals are expired
      const aExpired = CountdownUtils.isExpired(a.deadlineDate, a.deadlineTime);
      const bExpired = CountdownUtils.isExpired(b.deadlineDate, b.deadlineTime);

      // When filter is "all", show expired goals at the bottom
      if (filterBy === "all") {
        if (aExpired && !bExpired) return 1; // a goes after b
        if (!aExpired && bExpired) return -1; // a goes before b
        // If both have same expired status, continue with normal sorting
      }

      switch (sortBy) {
        case "deadline":
          const deadlineA = new Date(
            `${a.deadlineDate}T${a.deadlineTime}`
          ).getTime();
          const deadlineB = new Date(
            `${b.deadlineDate}T${b.deadlineTime}`
          ).getTime();
          return deadlineA - deadlineB;
        case "created":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
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
    return goalsToFilter.filter((goal) => {
      const isExpired = CountdownUtils.isExpired(
        goal.deadlineDate,
        goal.deadlineTime
      );

      switch (filterBy) {
        case "active":
          return !isExpired;
        case "expired":
          return isExpired;
        case "all":
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
    const activeGoals = goals.filter(
      (goal) => !CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime)
    );
    const expiredGoals = goals.filter((goal) =>
      CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime)
    );

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
    <GoalItem goal={item} onDelete={handleDeleteGoal} onEdit={handleEditGoal} />
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Goals Yet</Text>
      <Text style={styles.emptySubtitle}>
        {filterBy === "all"
          ? "Create your first goal to get started!"
          : filterBy === "active"
          ? "No active goals at the moment."
          : "No expired goals yet."}
      </Text>
      {filterBy === "all" && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={handleCreateGoal}
        >
          <Text style={styles.createFirstButtonText}>
            Create Your First Goal
          </Text>
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

        {/* Sort Controls */}
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsTitle}>Sort & Filter</Text>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.controlLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === "deadline" && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy("deadline")}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "deadline" && styles.sortButtonTextActive,
                  ]}
                >
                  Nearest Deadline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === "created" && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy("created")}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "created" && styles.sortButtonTextActive,
                  ]}
                >
                  Created Date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === "title" && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy("title")}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "title" && styles.sortButtonTextActive,
                  ]}
                >
                  Title
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Options */}
          <View style={styles.filterContainer}>
            <Text style={styles.controlLabel}>Filter:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterBy === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setFilterBy("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterBy === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterBy === "active" && styles.filterButtonActive,
                ]}
                onPress={() => setFilterBy("active")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterBy === "active" && styles.filterButtonTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterBy === "expired" && styles.filterButtonActive,
                ]}
                onPress={() => setFilterBy("expired")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterBy === "expired" && styles.filterButtonTextActive,
                  ]}
                >
                  Expired
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateGoal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  activeStat: {
    color: "#28A745",
  },
  expiredStat: {
    color: "#FF3B30",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  controlsContainer: {
    marginTop: 16,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  sortContainer: {
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
  },
  sortButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  sortButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
    flex: 1,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
