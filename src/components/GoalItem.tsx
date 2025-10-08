import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { Goal } from "../storage/storage";
import { Countdown, CountdownUtils } from "./Countdown";
// import sendNotification from '../utils/sendNotification';

interface GoalItemProps {
  goal: Goal;
  onDelete: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
}

/**
 * GoalItem component displays individual goals with countdown timers
 * Shows goal details, real-time countdown, and action buttons
 * Handles expired goals with special styling
 */
export const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  onDelete,
  onEdit,
}) => {
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({ days: 0, hours: 0, minutes: 0 });
  const [isExpired, setIsExpired] = useState<boolean>(
    CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime)
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const notificationSent = useRef<boolean>(false);
  const deadlineFormatted = CountdownUtils.formatDeadline(
    goal.deadlineDate,
    goal.deadlineTime
  );

  /**
   * Handle delete confirmation
   */
  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(goal.id),
        },
      ]
    );
  };

  /**
   * Handle edit action
   */
  const handleEdit = () => {
    if (onEdit) {
      onEdit(goal);
    }
  };

  /**
   * Handle countdown expiration
   */
  const handleExpired = async () => {
    // Only send notification once per goal expiration
    if (!notificationSent.current) {
      try {
        notificationSent.current = true;
      } catch (error) {
        console.error("Error sending expiration notification:", error);
      }
    }
  };

  /**
   * Calculate target progress percentage based on time remaining
   * Converts time remaining to seconds and calculates percentage
   */
  const calculateTargetProgress = (): number => {
    if (isExpired) return 100;

    try {
      const [year, month, day] = goal.deadlineDate.split("-").map(Number);
      const [hour, minute] = goal.deadlineTime.split(":").map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      const createdAt = new Date(goal.createdAt);

      // Calculate total duration from creation to deadline in seconds
      const totalDurationSeconds =
        (deadline.getTime() - createdAt.getTime()) / 1000;

      // Calculate time remaining in seconds
      const timeRemainingSeconds = Math.max(
        0,
        (deadline.getTime() - now.getTime()) / 1000
      );

      // Calculate progress percentage (0-100)
      // Progress = (total time - remaining time) / total time * 100
      const progress = Math.min(
        100,
        Math.max(
          0,
          ((totalDurationSeconds - timeRemainingSeconds) /
            totalDurationSeconds) *
            100
        )
      );

      return progress;
    } catch (error) {
      console.error("Error calculating progress:", error);
      return 0;
    }
  };

  /**
   * Calculate time remaining in a readable format
   */
  const calculateTimeRemaining = (): {
    days: number;
    hours: number;
    minutes: number;
  } => {
    if (isExpired) return { days: 0, hours: 0, minutes: 0 };

    try {
      const [year, month, day] = goal.deadlineDate.split("-").map(Number);
      const [hour, minute] = goal.deadlineTime.split(":").map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference <= 0) return { days: 0, hours: 0, minutes: 0 };

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      return { days, hours, minutes };
    } catch (error) {
      return { days: 0, hours: 0, minutes: 0 };
    }
  };

  /**
   * Update progress based on actual time calculation
   */
  const updateProgress = () => {
    if (!isExpired) {
      const targetProgress = calculateTargetProgress();
      const newProgress = Math.min(100, Math.max(0, targetProgress));

      if (Math.abs(newProgress - currentProgress) > 0.1) {
        // Only update if significant change
        // console.log(`Updating progress: ${currentProgress}% -> ${newProgress}%`);
        setCurrentProgress(newProgress);

        // Animate the progress bar smoothly
        Animated.timing(progressAnimation, {
          toValue: newProgress,
          duration: 500, // Smooth animation over 0.5 seconds
          useNativeDriver: false,
        }).start();
      }
    }
  };

  /**
   * Update time remaining
   */
  const updateTimeRemaining = () => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
  };

  /**
   * Check and update expired state
   */
  const checkExpiredState = () => {
    const expired = CountdownUtils.isExpired(
      goal.deadlineDate,
      goal.deadlineTime
    );
    if (expired !== isExpired) {
      setIsExpired(expired);
      // console.log(`Goal "${goal.title}" expired state changed: ${isExpired} -> ${expired}`);
    }
  };

  /**
   * Check if goal is about to expire (within next 60 seconds)
   */
  const isAboutToExpire = (): boolean => {
    try {
      const [year, month, day] = goal.deadlineDate.split("-").map(Number);
      const [hour, minute] = goal.deadlineTime.split(":").map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      const timeUntilExpiry = deadline.getTime() - now.getTime();

      return timeUntilExpiry <= 60000 && timeUntilExpiry > 0; // Within 60 seconds
    } catch (error) {
      return false;
    }
  };

  /**
   * Start automatic progress and time updates
   */
  useEffect(() => {
    // console.log('Setting up progress updates for goal:', goal.title);

    // Reset progress state when goal data changes
    setCurrentProgress(0);
    progressAnimation.setValue(0);

    // Reset notification flag when goal data changes
    notificationSent.current = false;

    // Reset expired state when goal data changes
    const initialExpired = CountdownUtils.isExpired(
      goal.deadlineDate,
      goal.deadlineTime
    );
    setIsExpired(initialExpired);

    // Initialize progress animation with current calculated progress
    const initialProgress = calculateTargetProgress();
    setCurrentProgress(initialProgress);
    progressAnimation.setValue(initialProgress);

    // Don't start timers for expired goals
    if (isExpired) {
      console.log("Goal is expired, stopping all timers");
      return;
    }

    // Use faster updates for goals about to expire
    const updateInterval = isAboutToExpire() ? 100 : 1000; // 100ms if about to expire, 1s otherwise

    // Start updating progress and time
    intervalRef.current = setInterval(() => {
      // console.log('Updating progress and time for goal:', goal.title);
      checkExpiredState(); // Check expired state first
      updateProgress();
      updateTimeRemaining();
    }, updateInterval);

    // Cleanup intervals on unmount
    return () => {
      // console.log('Cleaning up intervals for goal:', goal.title);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [goal.id, goal.deadlineDate, goal.deadlineTime, isExpired]); // Depend on goal data and expired state

  /**
   * Cleanup interval when component unmounts
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const aboutToExpire = isAboutToExpire();

  return (
    <View
      style={[
        styles.container,
        isExpired && styles.expiredContainer,
        aboutToExpire && !isExpired && styles.warningContainer,
      ]}
    >
      {/* Goal Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              isExpired && styles.expiredText,
              aboutToExpire && !isExpired && styles.warningText,
            ]}
          >
            {goal.title}
          </Text>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>EXPIRED</Text>
            </View>
          )}
          {aboutToExpire && !isExpired && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>SOON</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Goal Description */}
      {goal.description && (
        <Text style={[styles.description, isExpired && styles.expiredText]}>
          {goal.description}
        </Text>
      )}

      {/* Deadline Information */}
      <View style={styles.deadlineContainer}>
        <Text style={[styles.deadlineLabel, isExpired && styles.expiredText]}>
          Deadline:
        </Text>
        <Text style={[styles.deadlineText, isExpired && styles.expiredText]}>
          {deadlineFormatted}
        </Text>
      </View>

      {/* Countdown Timer */}
      {!isExpired && (
        <View style={styles.countdownContainer}>
          <Countdown
            deadlineDate={goal.deadlineDate}
            deadlineTime={goal.deadlineTime}
            onExpired={handleExpired}
          />
        </View>
      )}

      {/* Progress Indicator (Visual) */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, isExpired && styles.expiredText]}>
            Progress
          </Text>
          <Text
            style={[styles.progressPercentage, isExpired && styles.expiredText]}
          >
            {isExpired ? "100%" : `${Math.round(currentProgress)}%`}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: isExpired
                  ? "100%"
                  : progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                      extrapolate: "clamp",
                    }),
                backgroundColor: isExpired ? "#FF3B30" : "#007AFF",
              },
            ]}
          />
        </View>
        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, isExpired && styles.expiredText]}>
            {isExpired ? "Goal completed" : "In progress"}
          </Text>
          {!isExpired && (
            <Text style={styles.timeRemainingText}>
              {(() => {
                if (timeRemaining.days > 0) {
                  return `${timeRemaining.days}d ${timeRemaining.hours}h remaining`;
                } else if (timeRemaining.hours > 0) {
                  return `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`;
                } else {
                  return `${timeRemaining.minutes}m remaining`;
                }
              })()}
            </Text>
          )}
        </View>
      </View>

      {/* Creation Date */}
      <View style={styles.metaContainer}>
        <Text style={[styles.metaText, isExpired && styles.expiredText]}>
          Created: {new Date(goal.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  expiredContainer: {
    borderLeftColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  warningContainer: {
    borderLeftColor: "#FF9500",
    backgroundColor: "#FFF8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  expiredText: {
    color: "#FF3B30",
  },
  warningText: {
    color: "#FF9500",
  },
  expiredBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  warningBadge: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deadlineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  deadlineText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  countdownContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E9ECEF",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  timeRemainingText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
