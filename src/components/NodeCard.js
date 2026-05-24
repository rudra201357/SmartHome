import { StyleSheet, Text, View } from 'react-native';
import DeviceCard from './DeviceCard';
import { colors, radius, shadow, spacing } from '../styles/theme';
import { getNodeDevices, getNodeId, getNodeName, isNodeOnline } from '../utils/nodes';

export default function NodeCard({ node, onUpdate, updatingKey }) {
  const devices = getNodeDevices(node);
  const online = isNodeOnline(node);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{getNodeName(node)}</Text>
          <Text style={styles.id}>{getNodeId(node)}</Text>
        </View>
        <View style={[styles.badge, online ? styles.onlineBadge : styles.offlineBadge]}>
          <View style={[styles.dot, online ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.badgeText, online ? styles.onlineText : styles.offlineText]}>
            {online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{devices.length}</Text>
          <Text style={styles.statLabel}>{devices.length === 1 ? 'Device' : 'Devices'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{node.role || (node.primary ? 'primary' : 'user')}</Text>
          <Text style={styles.statLabel}>Access</Text>
        </View>
      </View>

      <View style={styles.devices}>
        {devices.length ? (
          devices.map((device) => (
            <DeviceCard
              key={`${getNodeId(node)}-${device.name}`}
              node={node}
              device={device}
              onUpdate={onUpdate}
              updatingKey={updatingKey}
            />
          ))
        ) : (
          <Text style={styles.empty}>This node is connected, but it has not reported devices yet.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  id: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },
  badge: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  onlineBadge: {
    backgroundColor: '#0E2B1C',
  },
  offlineBadge: {
    backgroundColor: '#351924',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: colors.green,
  },
  offlineDot: {
    backgroundColor: colors.red,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  onlineText: {
    color: colors.green,
  },
  offlineText: {
    color: colors.red,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: '#101A29',
    borderWidth: 1,
    borderColor: '#26384F',
    padding: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  devices: {
    gap: spacing.md,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
});
