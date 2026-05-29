import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

  // Local optimistic state for boolean toggle
  const [optimisticValue, setOptimisticValue] = useState(param.value);

  // Sync optimistic value with prop updates when not updating
  useEffect(() => {
    if (!isUpdating) {
      setOptimisticValue(param.value);
    }
  }, [param.value, isUpdating]);

  // Pulse animation for border/background during updates
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Spring scale animation for tactile press feel
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Scanner/sweep animation for progress bar
  const sweepAnim = useRef(new Animated.Value(-120)).current;

  const triggerSpring = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        tension: 150,
        friction: 6,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        tension: 150,
        friction: 4,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );

    const sweep = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 400,
        duration: 1500,
        useNativeDriver: false,
      })
    );

    if (isUpdating) {
      pulse.start();
      sweepAnim.setValue(-120);
      sweep.start();
    } else {
      pulseAnim.setValue(0);
      sweepAnim.setValue(-120);
    }

    return () => {
      pulse.stop();
      sweep.stop();
    };
  }, [isUpdating, pulseAnim, sweepAnim]);

  const animatedBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#26384F', colors.cyan || '#06B6D4'],
  });

  const animatedBackgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#101A29', '#152438'],
  });

  const animatedCardStyle = {
    transform: [{ scale: scaleAnim }],
    borderColor: animatedBorderColor,
    backgroundColor: animatedBackgroundColor,
    shadowColor: colors.cyan || '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.4],
    }),
    shadowRadius: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
  };

  if (typeof param.value === 'boolean') {
    return (
      <Animated.View
        style={[
          styles.row,
          animatedCardStyle,
        ]}
      >
        <View style={styles.paramText}>
          <Text style={styles.label}>{param.name}</Text>
          <Text style={[styles.value, isUpdating ? { color: colors.cyan } : null]}>
            {isUpdating ? 'Updating device...' : (optimisticValue ? 'Currently on' : 'Currently off')}
          </Text>
        </View>
        <View style={styles.controlRow} pointerEvents={isUpdating ? 'none' : 'auto'}>
          {isUpdating && <ActivityIndicator size="small" color={colors.cyan} style={styles.inlineSpinner} />}
          <Switch
            value={optimisticValue}
            onValueChange={(value) => {
              triggerSpring();
              setOptimisticValue(value);
              onUpdate(nodeId, deviceName, param.name, value, key);
            }}
            trackColor={{ false: '#475569', true: '#14532D' }}
            thumbColor={optimisticValue ? colors.green : '#CBD5E1'}
          />
        </View>
        {isUpdating && (
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  transform: [
                    {
                      translateX: sweepAnim,
                    },
                  ],
                },
              ]}
            />
          </View>
        )}
      </Animated.View>
    );
  }

  const isNumber = typeof param.value === 'number';

  return (
    <Animated.View
      style={[
        styles.editor,
        animatedCardStyle,
      ]}
    >
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
            triggerSpring();
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
      {isUpdating && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                transform: [
                  {
                    translateX: sweepAnim,
                  },
                ],
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
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
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineSpinner: {
    marginRight: 4,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    overflow: 'hidden',
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  progressBar: {
    height: '100%',
    width: 120,
    backgroundColor: colors.cyan || '#06B6D4',
  },
});
