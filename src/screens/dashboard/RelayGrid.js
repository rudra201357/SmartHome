import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../../styles/theme';
import styles from './styles';

export default function RelayGrid({ relays, loading, updatingKey, names, onUpdate }) {
  if (!relays.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No relays found</Text>
        <Text style={styles.emptyText}>Only boolean relay controls are shown on Home.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {relays.map((relay) => {
        const label = names[relay.key]?.trim() || relay.defaultName;

        return (
          <RelayTile
            key={relay.key}
            relay={relay}
            loading={loading}
            updatingKey={updatingKey}
            label={label}
            onUpdate={onUpdate}
          />
        );
      })}
    </View>
  );
}

function RelayTile({ relay, loading, updatingKey, label, onUpdate }) {
  const isUpdating = updatingKey === relay.key;
  
  // Local optimistic state
  const [optimisticValue, setOptimisticValue] = useState(relay.value);

  // Sync optimistic value with props when not updating
  useEffect(() => {
    if (!isUpdating) {
      setOptimisticValue(relay.value);
    }
  }, [relay.value, isUpdating]);

  // Spring scale animation for tactile click
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for border/glow
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Scanner/sweep animation for progress bar
  const sweepAnim = useRef(new Animated.Value(-80)).current;

  const triggerSpring = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.94,
        tension: 180,
        friction: 6,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        tension: 180,
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
        toValue: 200,
        duration: 1500,
        useNativeDriver: false,
      })
    );

    if (isUpdating) {
      pulse.start();
      sweepAnim.setValue(-80);
      sweep.start();
    } else {
      pulseAnim.setValue(0);
      sweepAnim.setValue(-80);
    }

    return () => {
      pulse.stop();
      sweep.stop();
    };
  }, [isUpdating, pulseAnim, sweepAnim]);

  const animatedBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [optimisticValue ? '#86EFAC' : '#526173', colors.cyan || '#06B6D4'],
  });

  const animatedBackgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [optimisticValue ? colors.green : '#263244', '#152438'],
  });

  const animatedTileStyle = {
    transform: [{ scale: scaleAnim }],
    width: '48.8%',
    aspectRatio: 1.05,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: animatedBorderColor,
    backgroundColor: animatedBackgroundColor,
    overflow: 'hidden',
    ...shadow,
  };

  return (
    <Animated.View style={animatedTileStyle}>
      <Pressable
        disabled={loading || !relay.online}
        onPress={() => {
          if (isUpdating) return;
          triggerSpring();
          const nextVal = !optimisticValue;
          setOptimisticValue(nextVal);
          onUpdate(relay.nodeId, relay.deviceName, relay.paramName, nextVal, relay.key);
        }}
        style={({ pressed }) => [
          localStyles.pressable,
          !relay.online ? styles.relayDisabled : null,
          pressed && !isUpdating ? styles.pressed : null,
        ]}
      >
        <Text numberOfLines={2} adjustsFontSizeToFit style={styles.relayName}>
          {label}
        </Text>
        <View style={localStyles.stateRow} pointerEvents="none">
          {isUpdating && <ActivityIndicator size="small" color={colors.white} style={localStyles.inlineSpinner} />}
          <Text style={styles.relayState}>{optimisticValue ? 'ON' : 'OFF'}</Text>
        </View>
        {isUpdating && (
          <View style={localStyles.progressBarContainer}>
            <Animated.View
              style={[
                localStyles.progressBar,
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
      </Pressable>
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    width: '100%',
    height: '100%',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  inlineSpinner: {
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: 60,
    backgroundColor: colors.cyan || '#06B6D4',
  },
});
