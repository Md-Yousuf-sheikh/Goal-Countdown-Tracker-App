import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Goal } from '../storage/storage';
import { Countdown, CountdownUtils } from './Countdown';

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
  const isExpired = CountdownUtils.isExpired(goal.deadlineDate, goal.deadlineTime);
  const deadlineFormatted = CountdownUtils.formatDeadline(goal.deadlineDate, goal.deadlineTime);

  /**
   * Handle delete confirmation
   */
  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
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
  const handleExpired = () => {
    // Could trigger notifications or other actions when goal expires
    console.log(`Goal "${goal.title}" has expired!`);
  };

  return (
    <View style={[styles.container, isExpired && styles.expiredContainer]}>
      {/* Goal Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isExpired && styles.expiredText]}>
            {goal.title}
          </Text>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>EXPIRED</Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
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
      <View style={styles.countdownContainer}>
        <Countdown
          deadlineDate={goal.deadlineDate}
          deadlineTime={goal.deadlineTime}
          onExpired={handleExpired}
        />
      </View>

      {/* Progress Indicator (Visual) */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: isExpired ? '100%' : '0%',
                backgroundColor: isExpired ? '#FF3B30' : '#007AFF',
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, isExpired && styles.expiredText]}>
          {isExpired ? 'Goal completed' : 'In progress'}
        </Text>
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  expiredContainer: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  expiredText: {
    color: '#FF3B30',
  },
  expiredBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deadlineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  deadlineText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  countdownContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
