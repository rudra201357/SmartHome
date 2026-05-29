import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

export default function SchedulingModal({
  visible,
  relayName,
  isOn,
  onClose,
  onSchedule,
  loading,
}) {
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedAction, setSelectedAction] = useState(isOn ? 'OFF' : 'ON');
  const [label, setLabel] = useState('');
  const [recurDaily, setRecurDaily] = useState(false);

  const handleSchedule = () => {
    if (!selectedTime) {
      Alert.alert('Scheduling', 'Please select a time');
      return;
    }

    onSchedule({
      time: selectedTime,
      action: selectedAction,
      label: label || `Turn ${selectedAction}`,
      recurDaily,
      timestamp: Date.now(),
    });

    setLabel('');
    setRecurDaily(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Schedule {relayName}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Action</Text>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => setSelectedAction('ON')}
                  style={[
                    styles.actionButton,
                    selectedAction === 'ON' ? styles.actionButtonActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      selectedAction === 'ON' ? styles.actionButtonTextActive : null,
                    ]}
                  >
                    Turn ON
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedAction('OFF')}
                  style={[
                    styles.actionButton,
                    selectedAction === 'OFF' ? styles.actionButtonActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      selectedAction === 'OFF' ? styles.actionButtonTextActive : null,
                    ]}
                  >
                    Turn OFF
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time</Text>
              <TextInput
                value={selectedTime}
                onChangeText={setSelectedTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.muted}
                style={styles.timeInput}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Label (optional)</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder={`Turn ${selectedAction}`}
                placeholderTextColor={colors.muted}
                style={styles.labelInput}
              />
            </View>

            <View style={styles.section}>
              <Pressable
                onPress={() => setRecurDaily(!recurDaily)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    recurDaily ? styles.checkboxChecked : null,
                  ]}
                >
                  {recurDaily && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Repeat daily</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSchedule}
              disabled={loading}
              style={[styles.button, styles.scheduleButton]}
            >
              <Text style={styles.scheduleButtonText}>
                {loading ? 'Scheduling...' : 'Schedule'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeIcon: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  actionButtonActive: {
    backgroundColor: colors.green,
    borderColor: '#86EFAC',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
  },
  actionButtonTextActive: {
    color: '#06130B',
  },
  timeInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '800',
  },
  labelInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '800',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: '#86EFAC',
  },
  checkmark: {
    color: '#06130B',
    fontSize: 14,
    fontWeight: '900',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.muted,
  },
  scheduleButton: {
    backgroundColor: colors.green,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#06130B',
  },
});
