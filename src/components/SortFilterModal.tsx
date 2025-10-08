import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface SortFilterModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'deadline' | 'created' | 'title';
  filterBy: 'all' | 'active' | 'expired';
  onSortChange: (sort: 'deadline' | 'created' | 'title') => void;
  onFilterChange: (filter: 'all' | 'active' | 'expired') => void;
}

/**
 * SortFilterModal component for managing sort and filter options
 * Provides a clean modal interface for sorting and filtering goals
 */
export const SortFilterModal: React.FC<SortFilterModalProps> = ({
  visible,
  onClose,
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange,
}) => {
  const sortOptions = [
    { key: 'deadline', label: 'Deadline', icon: '⏰' },
    { key: 'created', label: 'Created Date', icon: '📅' },
    { key: 'title', label: 'Title', icon: '📝' },
  ] as const;

  const filterOptions = [
    { key: 'all', label: 'All Goals', icon: '📋' },
    { key: 'active', label: 'Active Goals', icon: '🟢' },
    { key: 'expired', label: 'Expired Goals', icon: '🔴' },
  ] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sort & Filter</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.optionsContainer}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionButton,
                      sortBy === option.key && styles.optionButtonSelected,
                    ]}
                    onPress={() => onSortChange(option.key)}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        sortBy === option.key && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sortBy === option.key && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filter By</Text>
              <View style={styles.optionsContainer}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionButton,
                      filterBy === option.key && styles.optionButtonSelected,
                    ]}
                    onPress={() => onFilterChange(option.key)}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        filterBy === option.key && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {filterBy === option.key && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
