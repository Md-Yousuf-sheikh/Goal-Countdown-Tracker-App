import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

interface TimePickerProps {
  selectedTime: string; // HH:MM format (24-hour)
  onTimeChange: (time: string) => void;
  placeholder?: string;
}

/**
 * Custom TimePicker component built from scratch
 * Uses numeric inputs for hour/minute with AM/PM toggle
 * Converts between 12-hour display and 24-hour storage format
 * No third-party time libraries - all logic implemented manually
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  selectedTime,
  onTimeChange,
  placeholder = 'Select Time',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Initialize with current time to show it in center when no time is selected
  const now = new Date();
  const currentHour24 = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Convert current time to 12-hour format for initial state
  let initialHour = 12;
  let initialIsAM = true;
  
  if (currentHour24 === 0) {
    initialHour = 12;
    initialIsAM = true;
  } else if (currentHour24 < 12) {
    initialHour = currentHour24;
    initialIsAM = true;
  } else if (currentHour24 === 12) {
    initialHour = 12;
    initialIsAM = false;
  } else {
    initialHour = currentHour24 - 12;
    initialIsAM = false;
  }
  
  const [hour, setHour] = useState<number>(initialHour);
  const [minute, setMinute] = useState<number>(currentMinute);
  const [isAM, setIsAM] = useState<boolean>(initialIsAM);

  // Parse the selected time when component mounts or time changes
  useEffect(() => {
    if (selectedTime) {
      const [hourStr, minuteStr] = selectedTime.split(':');
      const hour24 = parseInt(hourStr, 10);
      const minute24 = parseInt(minuteStr, 10);
      
      // Convert 24-hour to 12-hour format
      if (hour24 === 0) {
        setHour(12);
        setIsAM(true);
      } else if (hour24 < 12) {
        setHour(hour24);
        setIsAM(true);
      } else if (hour24 === 12) {
        setHour(12);
        setIsAM(false);
      } else {
        setHour(hour24 - 12);
        setIsAM(false);
      }
      
      setMinute(minute24);
    } else {
      // Set default to current time - this ensures current time is shown in center when no time is selected
      const now = new Date();
      const hour24 = now.getHours();
      const minute24 = now.getMinutes();
      
      if (hour24 === 0) {
        setHour(12);
        setIsAM(true);
      } else if (hour24 < 12) {
        setHour(hour24);
        setIsAM(true);
      } else if (hour24 === 12) {
        setHour(12);
        setIsAM(false);
      } else {
        setHour(hour24 - 12);
        setIsAM(false);
      }
      
      setMinute(minute24);
    }
  }, [selectedTime]);

  // Refs for each picker wheel to control scrolling
  const hourScrollRef = React.useRef<ScrollView>(null);
  const minuteScrollRef = React.useRef<ScrollView>(null);

  // Center the selected values when modal opens
  useEffect(() => {
    if (isVisible) {
      const itemHeight = 50;
      
      // Center hour picker
      const hourOptions = generateHourOptions();
      const hourIndex = hourOptions.findIndex(option => option.value === hour);
      if (hourIndex >= 0 && hourScrollRef.current) {
        setTimeout(() => {
          hourScrollRef.current?.scrollTo({
            y: hourIndex * itemHeight,
            animated: true,
          });
        }, 150);
      }

      // Center minute picker
      const minuteOptions = generateMinuteOptions();
      const minuteIndex = minuteOptions.findIndex(option => option.value === minute);
      if (minuteIndex >= 0 && minuteScrollRef.current) {
        setTimeout(() => {
          minuteScrollRef.current?.scrollTo({
            y: minuteIndex * itemHeight,
            animated: true,
          });
        }, 200);
      }
    }
  }, [isVisible, hour, minute]);

  // Convert 12-hour format to 24-hour format for storage
  const convertTo24Hour = (hour12: number, minute12: number, isAM: boolean): string => {
    let hour24 = hour12;
    
    if (isAM && hour12 === 12) {
      hour24 = 0;
    } else if (!isAM && hour12 !== 12) {
      hour24 = hour12 + 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute12.toString().padStart(2, '0')}`;
  };

  // Handle time selection
  const handleTimeSelect = () => {
    const time24 = convertTo24Hour(hour, minute, isAM);
    onTimeChange(time24);
    setIsVisible(false);
  };

  // Format display text
  const getDisplayText = (): string => {
    if (!selectedTime) return placeholder;
    
    const [hourStr, minuteStr] = selectedTime.split(':');
    const hour24 = parseInt(hourStr, 10);
    const minute24 = parseInt(minuteStr, 10);
    
    let displayHour = hour24;
    let period = 'AM';
    
    if (hour24 === 0) {
      displayHour = 12;
    } else if (hour24 < 12) {
      displayHour = hour24;
    } else if (hour24 === 12) {
      displayHour = 12;
      period = 'PM';
    } else {
      displayHour = hour24 - 12;
      period = 'PM';
    }
    
    return `${displayHour}:${minuteStr} ${period}`;
  };

  // Validate and update hour input
  const handleHourChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setHour(num);
    } else if (text === '') {
      setHour(1);
    }
  };

  // Validate and update minute input
  const handleMinuteChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setMinute(num);
    } else if (text === '') {
      setMinute(0);
    }
  };

  // Generate hour options for picker wheel
  const generateHourOptions = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: (i + 1).toString(),
    }));
  };

  // Generate minute options for picker wheel
  const generateMinuteOptions = () => {
    return Array.from({ length: 60 }, (_, i) => ({
      value: i,
      label: i.toString().padStart(2, '0'),
    }));
  };

  // Render picker wheel for hours or minutes
  const renderPickerWheel = (
    options: { value: number; label: string }[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    width: number,
    scrollRef: React.RefObject<ScrollView | null>
  ) => {
    const itemHeight = 50;
    const visibleItems = 3;
    const totalHeight = itemHeight * visibleItems;

    return (
      <ScrollView
        ref={scrollRef}
        style={[styles.pickerWheel, { width, height: totalHeight }]}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingTop: itemHeight,
          paddingBottom: itemHeight,
        }}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerItem,
              {
                height: itemHeight,
                backgroundColor: selectedValue === option.value ? '#007AFF' : 'transparent',
              },
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text
              style={[
                styles.pickerItemText,
                {
                  color: selectedValue === option.value ? 'white' : '#333',
                  fontWeight: selectedValue === option.value ? 'bold' : 'normal',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.timeButtonText}>{getDisplayText()}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {renderPickerWheel(
                generateHourOptions(),
                hour,
                setHour,
                Dimensions.get('window').width / 4,
                hourScrollRef
              )}
              <Text style={styles.separator}>:</Text>
              {renderPickerWheel(
                generateMinuteOptions(),
                minute,
                setMinute,
                Dimensions.get('window').width / 4,
                minuteScrollRef
              )}
            </View>

            <View style={styles.ampmContainer}>
              <TouchableOpacity
                style={[
                  styles.ampmButton,
                  isAM && styles.ampmButtonSelected,
                ]}
                onPress={() => setIsAM(true)}
              >
                <Text
                  style={[
                    styles.ampmButtonText,
                    isAM && styles.ampmButtonTextSelected,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ampmButton,
                  !isAM && styles.ampmButtonSelected,
                ]}
                onPress={() => setIsAM(false)}
              >
                <Text
                  style={[
                    styles.ampmButtonText,
                    !isAM && styles.ampmButtonTextSelected,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleTimeSelect}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  pickerWheel: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 18,
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
  },
  ampmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  ampmButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  ampmButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ampmButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  ampmButtonTextSelected: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
