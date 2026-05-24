import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

export default function ParamControl({ nodeId, deviceName, param, onUpdate, updatingKey }) {
  const key = `${nodeId}:${deviceName}:${param.name}`;
  const isUpdating = updatingKey === key;
  const [draft, setDraft] = useState(String(param.value ?? ''));

  if (typeof param.value === 'boolean') {
    return (
      <View style={styles.row}>
        <View style={styles.paramText}>
          <Text style={styles.label}>{param.name}</Text>
          <Text style={styles.value}>{param.value ? 'Currently on' : 'Currently off'}</Text>
        </View>
        {isUpdating ? (
          <ActivityIndicator color={colors.cyan} />
        ) : (
          <Switch
            value={param.value}
            onValueChange={(value) => onUpdate(nodeId, deviceName, param.name, value, key)}
            trackColor={{ false: '#475569', true: '#14532D' }}
            thumbColor={param.value ? colors.green : '#CBD5E1'}
          />
        )}
      </View>
    );
  }

  const isNumber = typeof param.value === 'number';

  return (
    <View style={styles.editor}>
      <Text style={styles.label}>{param.name}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          keyboardType={isNumber ? 'numeric' : 'default'}
          placeholder="Value"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable
          disabled={isUpdating}
          onPress={() => {
            const nextValue = isNumber ? Number(draft) : draft;
            onUpdate(nodeId, deviceName, param.name, nextValue, key);
          }}
          style={({ pressed }) => [
            styles.updateButton,
            pressed && !isUpdating ? styles.pressed : null,
            isUpdating ? styles.disabled : null,
          ]}
        >
          {isUpdating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.updateText}>Set</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 62,
    borderRadius: radius.md,
    backgroundColor: '#101A29',
    borderWidth: 1,
    borderColor: '#26384F',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  paramText: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  editor: {
    borderRadius: radius.md,
    backgroundColor: '#101A29',
    borderWidth: 1,
    borderColor: '#26384F',
    padding: spacing.md,
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    paddingHorizontal: spacing.md,
    backgroundColor: '#0B111C',
  },
  updateButton: {
    minWidth: 62,
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  updateText: {
    color: colors.white,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.62,
  },
});
