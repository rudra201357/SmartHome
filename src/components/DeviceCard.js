import { StyleSheet, Text, View } from 'react-native';
import ParamControl from './ParamControl';
import { colors, radius, spacing } from '../styles/theme';
import { getDeviceParams, getNodeId } from '../utils/nodes';

export default function DeviceCard({ node, device, onUpdate, updatingKey }) {
  const params = getDeviceParams(node, device);
  const nodeId = getNodeId(node);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>{(device.name || 'D').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{device.name || 'Device'}</Text>
          <Text style={styles.subtitle}>
            {params.length} {params.length === 1 ? 'parameter' : 'parameters'}
          </Text>
        </View>
      </View>

      <View style={styles.params}>
        {params.length ? (
          params.map((param) => (
            <ParamControl
              key={`${device.name}-${param.name}`}
              nodeId={nodeId}
              deviceName={device.name}
              param={param}
              onUpdate={onUpdate}
              updatingKey={updatingKey}
            />
          ))
        ) : (
          <Text style={styles.empty}>No parameters reported yet.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#12365A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.cyan,
    fontSize: 18,
    fontWeight: '900',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  params: {
    gap: spacing.sm,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
});
