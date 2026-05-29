import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  formatAutomationSummary,
  getAutomationId,
  getAutomationName,
  getRelayLabel,
  validateAutomationDraft,
} from '../../utils/automationHelpers';
import styles from '../dashboard/styles';

export default function AutomationsSettings({
  relays,
  names,
  automations,
  onCreateAutomation,
  onDeleteAutomation,
}) {
  const [triggerKey, setTriggerKey] = useState(relays[0]?.key || '');
  const [triggerValue, setTriggerValue] = useState(true);
  const [actionKey, setActionKey] = useState(relays[1]?.key || '');
  const [actionValue, setActionValue] = useState(true);

  useEffect(() => {
    if (!triggerKey && relays[0]?.key) {
      setTriggerKey(relays[0].key);
    }

    if ((!actionKey || actionKey === triggerKey) && relays.length > 1) {
      const nextAction = relays.find((relay) => relay.key !== triggerKey);
      setActionKey(nextAction?.key || '');
    }
  }, [actionKey, relays, triggerKey]);

  const triggerRelay = relays.find((relay) => relay.key === triggerKey);
  const actionRelay = relays.find((relay) => relay.key === actionKey);
  const validationMessage = validateAutomationDraft({
    triggerRelay,
    actionRelay,
    triggerValue,
    actionValue,
    automations,
  });
  const canSave = !validationMessage;

  return (
    <View style={styles.automationWrap}>
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>New automation</Text>
        <Text style={styles.scheduleMeta}>When this device changes to</Text>
        <RelayPicker relays={relays} names={names} value={triggerKey} onChange={setTriggerKey} />
        <BinaryPicker value={triggerValue} onChange={setTriggerValue} />

        <Text style={styles.scheduleMeta}>Then set this device to</Text>
        <RelayPicker relays={relays} names={names} value={actionKey} onChange={setActionKey} />
        <BinaryPicker value={actionValue} onChange={setActionValue} />

        {validationMessage ? <Text style={styles.errorText}>{validationMessage}</Text> : null}

        <Pressable
          disabled={!canSave}
          onPress={() => {
            const name = `${getRelayLabel(triggerRelay, names)} ${triggerValue ? 'ON' : 'OFF'} -> ${getRelayLabel(actionRelay, names)} ${actionValue ? 'ON' : 'OFF'}`;
            onCreateAutomation({
              name,
              trigger: {
                ...triggerRelay,
                value: triggerValue,
              },
              action: {
                ...actionRelay,
                value: actionValue,
              },
            });
          }}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave ? styles.disabledButton : null,
            pressed && canSave ? styles.pressed : null,
          ]}
        >
          <Text style={styles.saveText}>Add automation</Text>
        </Pressable>
      </View>

      {Array.isArray(automations) && automations.length > 0 ? (
        automations.map((automation, index) => (
          <View key={getAutomationId(automation) || index} style={styles.settingCard}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleTitleWrap}>
                <Text style={styles.settingTitle}>{getAutomationName(automation)}</Text>
                <Text style={styles.scheduleMeta}>{formatAutomationSummary(automation)}</Text>
              </View>
              <Pressable
                onPress={() => onDeleteAutomation(automation)}
                style={({ pressed }) => [styles.deleteScheduleButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.deleteScheduleText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No automations found</Text>
          <Text style={styles.emptyText}>Create a relay automation that follows RainMaker trigger and action rules.</Text>
        </View>
      )}
    </View>
  );
}

function RelayPicker({ relays, names, value, onChange }) {
  return (
    <View style={styles.pickerGrid}>
      {relays.map((relay) => {
        const selected = value === relay.key;

        return (
          <Pressable
            key={relay.key}
            onPress={() => onChange(relay.key)}
            style={[styles.pickerOption, selected ? styles.activePickerOption : null]}
          >
            <Text
              numberOfLines={1}
              style={[styles.pickerOptionText, selected ? styles.activePickerOptionText : null]}
            >
              {getRelayLabel(relay, names)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BinaryPicker({ value, onChange }) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        onPress={() => onChange(true)}
        style={[styles.actionButton, value ? styles.activeActionButton : null]}
      >
        <Text style={[styles.actionText, value ? styles.activeActionText : null]}>ON</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(false)}
        style={[styles.actionButton, !value ? styles.activeActionButton : null]}
      >
        <Text style={[styles.actionText, !value ? styles.activeActionText : null]}>OFF</Text>
      </Pressable>
    </View>
  );
}
