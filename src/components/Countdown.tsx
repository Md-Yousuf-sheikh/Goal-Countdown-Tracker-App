import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownProps {
  deadlineDate: string; // YYYY-MM-DD format
  deadlineTime: string; // HH:MM format (24-hour)
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // Total milliseconds remaining
}

/**
 * Countdown component with real-time timer logic
 * Updates every second using setInterval
 * Handles edge cases like expired deadlines
 * All calculations done manually without third-party libraries
 */
export const Countdown: React.FC<CountdownProps> = ({
  deadlineDate,
  deadlineTime,
  onExpired,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calculate time remaining until deadline
   * Uses manual Date calculations without external libraries
   */
  const calculateTimeRemaining = (): TimeRemaining => {
    try {
      // Parse deadline date and time
      const [year, month, day] = deadlineDate.split('-').map(Number);
      const [hour, minute] = deadlineTime.split(':').map(Number);
      
      // Create deadline Date object (month is 0-indexed in Date constructor)
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      
      // Calculate difference in milliseconds
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        };
      }
      
      // Convert milliseconds to days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return {
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      };
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
      };
    }
  };

  /**
   * Update countdown display
   * Called every second via setInterval
   */
  const updateCountdown = () => {
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
    
    // Check if expired
    if (remaining.total <= 0 && !isExpired) {
      setIsExpired(true);
      if (onExpired) {
        onExpired();
      }
    }
  };

  // Start/stop countdown timer
  useEffect(() => {
    // Reset expired state when deadline changes
    setIsExpired(false);
    
    // Initial calculation
    updateCountdown();
    
    // Set up interval for updates every second
    intervalRef.current = setInterval(updateCountdown, 1000);
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deadlineDate, deadlineTime]);

  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Format time unit with leading zero if needed
   */
  const formatTimeUnit = (value: number): string => {
    return value.toString().padStart(2, '0');
  };

  /**
   * Get display text for countdown
   */
  const getCountdownText = (): string => {
    if (isExpired) {
      return 'Expired';
    }
    
    return `${formatTimeUnit(timeRemaining.days)} days : ${formatTimeUnit(timeRemaining.hours)} hrs : ${formatTimeUnit(timeRemaining.minutes)} min : ${formatTimeUnit(timeRemaining.seconds)} sec`;
  };

  /**
   * Get compact countdown text for smaller displays
   */
  const getCompactCountdownText = (): string => {
    if (isExpired) {
      return 'Expired';
    }
    
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    } else if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    } else {
      return `${timeRemaining.seconds}s`;
    }
  };

  /**
   * Calculate progress percentage (0-100)
   * Useful for progress bars or visual indicators
   */
  const getProgressPercentage = (): number => {
    if (isExpired) return 100;
    
    try {
      const [year, month, day] = deadlineDate.split('-').map(Number);
      const [hour, minute] = deadlineTime.split(':').map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      
      // Calculate total duration from creation to deadline
      // For simplicity, we'll use a default duration if we don't have creation time
      const totalDuration = 7 * 24 * 60 * 60 * 1000; // 7 days default
      const elapsed = totalDuration - timeRemaining.total;
      
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    } catch (error) {
      return 0;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.countdownText, isExpired && styles.expiredText]}>
        {getCountdownText()}
      </Text>
      <Text style={[styles.compactText, isExpired && styles.expiredText]}>
        {getCompactCountdownText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  expiredText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});

// Export utility functions for use in other components
export const CountdownUtils = {
  /**
   * Check if a deadline has passed
   */
  isExpired: (deadlineDate: string, deadlineTime: string): boolean => {
    try {
      const [year, month, day] = deadlineDate.split('-').map(Number);
      const [hour, minute] = deadlineTime.split(':').map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      return deadline.getTime() <= now.getTime();
    } catch (error) {
      return true;
    }
  },

  /**
   * Get time remaining in milliseconds
   */
  getTimeRemaining: (deadlineDate: string, deadlineTime: string): number => {
    try {
      const [year, month, day] = deadlineDate.split('-').map(Number);
      const [hour, minute] = deadlineTime.split(':').map(Number);
      const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);
      const now = new Date();
      return Math.max(0, deadline.getTime() - now.getTime());
    } catch (error) {
      return 0;
    }
  },

  /**
   * Format deadline date and time for display
   */
  formatDeadline: (deadlineDate: string, deadlineTime: string): string => {
    try {
      const [year, month, day] = deadlineDate.split('-').map(Number);
      const [hour, minute] = deadlineTime.split(':').map(Number);
      
      const date = new Date(year, month - 1, day);
      const time = new Date(0, 0, 0, hour, minute);
      
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      const timeStr = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      return `${dateStr} at ${timeStr}`;
    } catch (error) {
      return 'Invalid Date';
    }
  },
};
