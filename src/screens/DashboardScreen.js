import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { aboutContent } from '../content/about';
import { colors, radius, shadow, spacing } from '../styles/theme';
import { getNodeSchedules, getRelayControls, getScheduleServiceNodes } from '../utils/nodes';

export default function DashboardScreen({
  nodes,
  loading,
  onLogout,
  onUpdate,
  updatingKey,
  relayNames,
  onRenameRelay,
  onCreateSchedule,
  onDeleteSchedule,
}) {
  const [activeTab, setActiveTab] = useState('home');
  const relays = useMemo(() => getRelayControls(nodes), [nodes]);
  const schedules = useMemo(() => getNodeSchedules(nodes), [nodes]);
  const scheduleServiceNodes = useMemo(() => getScheduleServiceNodes(nodes), [nodes]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab === 'settings') {
        setActiveTab('home');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [activeTab]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      style={styles.keyboardView}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My SmartHome</Text>
        <Pressable
          onPress={() => setActiveTab(activeTab === 'settings' ? 'home' : 'settings')}
          style={({ pressed }) => [styles.settingsButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.settingsIcon}>{activeTab === 'settings' ? 'Home' : 'Settings'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {activeTab === 'home' ? (
          <RelayGrid
            relays={relays}
            loading={loading}
            updatingKey={updatingKey}
            names={relayNames}
            onUpdate={onUpdate}
            onCreateSchedule={onCreateSchedule}
          />
        ) : (
          <SettingsList
            relays={relays}
            names={relayNames}
            schedules={schedules}
            scheduleServiceNodes={scheduleServiceNodes}
            onRenameRelay={onRenameRelay}
            onDeleteSchedule={onDeleteSchedule}
            onLogout={onLogout}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RelayGrid({ relays, loading, updatingKey, names, onUpdate, onCreateSchedule }) {
  const [scheduleRelay, setScheduleRelay] = useState(null);

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
        const isUpdating = updatingKey === relay.key;
        const label = names[relay.key]?.trim() || relay.defaultName;
        const relayWithLabel = {
          ...relay,
          displayName: label,
        };

        return (
          <Pressable
            key={relay.key}
            disabled={loading || isUpdating || !relay.online}
            onPress={() => onUpdate(relay.nodeId, relay.deviceName, relay.paramName, !relay.value, relay.key)}
            onLongPress={() => setScheduleRelay(relayWithLabel)}
            delayLongPress={450}
            style={({ pressed }) => [
              styles.relayTile,
              relay.value ? styles.relayOn : styles.relayOff,
              !relay.online ? styles.relayDisabled : null,
              pressed && !isUpdating ? styles.pressed : null,
            ]}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text numberOfLines={2} adjustsFontSizeToFit style={styles.relayName}>
                  {label}
                </Text>
                <Text style={styles.relayState}>{relay.value ? 'ON' : 'OFF'}</Text>
              </>
            )}
          </Pressable>
        );
      })}

      <ScheduleModal
        relay={scheduleRelay}
        onClose={() => setScheduleRelay(null)}
        onSave={(schedule) => {
          onCreateSchedule(scheduleRelay, schedule);
          setScheduleRelay(null);
        }}
      />
    </View>
  );
}

function SettingsList({
  relays,
  names,
  schedules,
  scheduleServiceNodes,
  onRenameRelay,
  onDeleteSchedule,
  onLogout,
}) {
  const [section, setSection] = useState('devices');
  const [draftNames, setDraftNames] = useState(names);

  useEffect(() => {
    setDraftNames(names);
  }, [names]);

  return (
    <View style={styles.settings}>
      <View style={styles.settingsTabs}>
        <SettingsOption label="Devices" value="devices" active={section} onPress={setSection} />
        <SettingsOption label="Schedules" value="schedules" active={section} onPress={setSection} />
        <SettingsOption label="About" value="about" active={section} onPress={setSection} />
        <SettingsOption label="Logout" value="logout" active={section} onPress={setSection} />
      </View>

      {section === 'devices' && relays.length
        ? relays.map((relay) => (
            <View key={relay.key} style={styles.settingCard}>
              <Text style={styles.settingTitle}>{names[relay.key]?.trim() || relay.defaultName}</Text>
              <TextInput
                value={draftNames[relay.key] ?? names[relay.key] ?? relay.defaultName}
                onChangeText={(text) =>
                  setDraftNames((current) => ({
                    ...current,
                    [relay.key]: text,
                  }))
                }
                placeholder="Relay name"
                placeholderTextColor={colors.muted}
                style={styles.nameInput}
              />
              <Pressable
                onPress={() => onRenameRelay(relay, (draftNames[relay.key] ?? relay.defaultName).trim())}
                style={({ pressed }) => [styles.saveButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.saveText}>Save name</Text>
              </Pressable>
            </View>
          ))
        : null}

      {section === 'devices' && !relays.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No devices found</Text>
          <Text style={styles.emptyText}>Refresh after your RainMaker node reports relay parameters.</Text>
        </View>
      ) : null}

      {section === 'schedules' && schedules.length
        ? schedules.map((schedule) => (
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
          ))
        : null}

      {section === 'schedules' && !schedules.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No schedules found</Text>
          <Text style={styles.emptyText}>
            {scheduleServiceNodes.length
              ? 'Long press a device on Home to add a dated ON/OFF schedule.'
              : 'This ESP node is not reporting the RainMaker Schedule service. Enable schedule and time service in firmware.'}
          </Text>
        </View>
      ) : null}

      {section === 'about' ? (
        <View style={styles.settingCard}>
          <Text style={styles.settingTitle}>{aboutContent.title}</Text>
          {aboutContent.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.aboutText}>
              {paragraph}
            </Text>
          ))}
          <Text style={styles.aboutTextFooter}>
            ~ Powered by <Text style={styles.rudradeb}>Rudradeb</Text>.
          </Text>
        </View>
      ) : null}

      {section === 'logout' ? (
        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SettingsOption({ label, value, active, onPress }) {
  const selected = active === value;

  return (
    <Pressable
      onPress={() => onPress(value)}
      style={[styles.settingsOption, selected ? styles.activeSettingsOption : null]}
    >
      <Text style={[styles.settingsOptionText, selected ? styles.activeSettingsOptionText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ScheduleModal({ relay, onClose, onSave }) {
  const today = new Date();
  const [year, setYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(String(today.getDate()).padStart(2, '0'));
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [value, setValue] = useState(true);

  useEffect(() => {
    if (!relay) {
      return;
    }

    const now = new Date();
    setYear(String(now.getFullYear()));
    setMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setDay(String(now.getDate()).padStart(2, '0'));
    setHour(String(now.getHours()).padStart(2, '0'));
    setMinute(String(now.getMinutes()).padStart(2, '0'));
    setValue(!relay.value);
  }, [relay]);

  if (!relay) {
    return null;
  }

  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  const hasValidDateText = /^\d{4}$/.test(year) && /^\d{1,2}$/.test(month) && /^\d{1,2}$/.test(day);
  const hasValidHourText = /^\d{1,2}$/.test(hour);
  const hasValidMinuteText = /^\d{1,2}$/.test(minute);
  const dateIsValid =
    hasValidDateText &&
    isValidDateParts(parsedYear, parsedMonth, parsedDay);
  const timeIsValid =
    hasValidHourText &&
    hasValidMinuteText &&
    Number.isInteger(parsedHour) &&
    Number.isInteger(parsedMinute) &&
    parsedHour >= 0 &&
    parsedHour <= 23 &&
    parsedMinute >= 0 &&
    parsedMinute <= 59;
  const formIsValid = dateIsValid && timeIsValid;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text numberOfLines={2} adjustsFontSizeToFit style={styles.modalTitle}>
            {relay.displayName}
          </Text>
          <Text style={styles.modalText}>Set date and clock time</Text>

          <View style={styles.dateRow}>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
              style={[styles.dateInput, styles.yearInput]}
            />
            <Text style={styles.dateSeparator}>-</Text>
            <TextInput
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.dateInput}
            />
            <Text style={styles.dateSeparator}>-</Text>
            <TextInput
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.dateInput}
            />
          </View>

          <View style={styles.timeRow}>
            <TextInput
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.timeInput}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.timeInput}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setValue(true)}
              style={[styles.actionButton, value ? styles.activeActionButton : null]}
            >
              <Text style={[styles.actionText, value ? styles.activeActionText : null]}>Turn ON</Text>
            </Pressable>
            <Pressable
              onPress={() => setValue(false)}
              style={[styles.actionButton, !value ? styles.activeActionButton : null]}
            >
              <Text style={[styles.actionText, !value ? styles.activeActionText : null]}>Turn OFF</Text>
            </Pressable>
          </View>

          {!dateIsValid ? <Text style={styles.errorText}>Use a valid date as YYYY-MM-DD.</Text> : null}
          {!timeIsValid ? <Text style={styles.errorText}>Use 24-hour time from 00:00 to 23:59.</Text> : null}

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!formIsValid}
              onPress={() =>
                onSave({
                  minutes: parsedHour * 60 + parsedMinute,
                  day: parsedDay,
                  month: parsedMonth,
                  year: parsedYear,
                  dateLabel: `${String(parsedYear)}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`,
                  timeLabel: `${String(parsedHour).padStart(2, '0')}:${String(parsedMinute).padStart(2, '0')}`,
                  value,
                })
              }
              style={[styles.saveScheduleButton, !formIsValid ? styles.disabledButton : null]}
            >
              <Text style={styles.saveScheduleText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function isValidDateParts(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (year < 2024 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatScheduleTrigger(trigger = {}) {
  const time = formatMinutes(trigger.m);

  if (trigger.dd && trigger.mm) {
    return `${formatMonthBitmap(trigger.mm)} ${trigger.dd}, ${trigger.yy || 'every year'} at ${time}`;
  }

  return `At ${time}`;
}

function formatScheduleAction(action = {}) {
  const [deviceName, params = {}] = Object.entries(action)[0] || [];
  const [paramName, value] = Object.entries(params)[0] || [];

  if (!deviceName || !paramName) {
    return 'No action details';
  }

  return `${deviceName} ${paramName}: ${value ? 'ON' : 'OFF'}`;
}

function formatMinutes(minutes) {
  if (!Number.isInteger(minutes)) {
    return '--:--';
  }

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function formatMonthBitmap(bitmap) {
  const monthIndex = Math.max(0, Math.round(Math.log2(bitmap || 1)));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[monthIndex] || 'Date';
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 180,
    gap: spacing.md,
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
  },
  settingsButton: {
    minWidth: 86,
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
  },
  settingsIcon: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  relayTile: {
    width: '48.8%',
    aspectRatio: 0.82,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    ...shadow,
  },
  relayOn: {
    backgroundColor: colors.green,
    borderColor: '#86EFAC',
  },
  relayOff: {
    backgroundColor: '#263244',
    borderColor: '#526173',
  },
  relayDisabled: {
    opacity: 0.45,
  },
  relayName: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  relayState: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  settings: {
    gap: spacing.md,
  },
  settingsTabs: {
    minHeight: 48,
    flexDirection: 'row',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
  },
  settingsOption: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSettingsOption: {
    backgroundColor: colors.blue,
  },
  settingsOptionText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  activeSettingsOptionText: {
    color: colors.white,
  },
  settingCard: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  settingTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  nameInput: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#0B111C',
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '800',
  },
  saveButton: {
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#06130B',
    fontWeight: '900',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleTitleWrap: {
    flex: 1,
  },
  scheduleMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  deleteScheduleButton: {
    minHeight: 38,
    minWidth: 78,
    borderRadius: radius.sm,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteScheduleText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  aboutText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  empty: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  logoutButton: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  logoutText: {
    color: colors.white,
    fontWeight: '900',
  },
  rudradeb: {
    color: colors.cyan,
    fontWeight: '800',
  },
  aboutTextFooter: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 9, 15, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dateInput: {
    width: 58,
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#0B111C',
    color: colors.text,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
  yearInput: {
    width: 86,
  },
  dateSeparator: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  timeInput: {
    width: 76,
    minHeight: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#0B111C',
    color: colors.text,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
  },
  timeSeparator: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeActionButton: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  actionText: {
    color: colors.muted,
    fontWeight: '900',
  },
  activeActionText: {
    color: colors.white,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: '900',
  },
  saveScheduleButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveScheduleText: {
    color: '#06130B',
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
