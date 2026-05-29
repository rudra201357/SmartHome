import { Pressable, Text, View } from 'react-native';
import { formatScheduleAction, formatScheduleTrigger } from '../../utils/scheduleHelpers';
import styles from '../dashboard/styles';

export default function SchedulesSettings({ schedules, scheduleServiceNodes, onDeleteSchedule }) {
  if (!schedules.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No schedules found</Text>
        <Text style={styles.emptyText}>
          {scheduleServiceNodes.length
            ? 'Long press a device on Home to add a dated ON/OFF schedule.'
            : 'This ESP node is not reporting the RainMaker Schedule service. Enable schedule and time service in firmware.'}
        </Text>
      </View>
    );
  }

  return schedules.map((schedule) => (
    <View key={schedule.key} style={styles.settingCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleTitleWrap}>
          <Text style={styles.settingTitle}>{schedule.name || schedule.id}</Text>
          <Text style={styles.scheduleMeta}>{schedule.nodeName}</Text>
        </View>
        <Pressable
          onPress={() => onDeleteSchedule(schedule)}
          style={({ pressed }) => [styles.deleteScheduleButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.deleteScheduleText}>Delete</Text>
        </Pressable>
      </View>
      <Text style={styles.scheduleMeta}>{formatScheduleTrigger(schedule.triggers?.[0])}</Text>
      <Text style={styles.scheduleMeta}>{formatScheduleAction(schedule.action)}</Text>
    </View>
  ));
}
