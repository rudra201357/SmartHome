import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
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
import { getRelayControls } from '../utils/nodes';

export default function DashboardScreen({
  nodes,
  loading,
  onLogout,
  onUpdate,
  updatingKey,
  relayNames,
  onRenameRelay,
}) {
  const [activeTab, setActiveTab] = useState('home');
  const relays = useMemo(() => getRelayControls(nodes), [nodes]);

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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.header}>
        <Text style={styles.title}>My SmartHome</Text>
        <Pressable
          onPress={() => setActiveTab(activeTab === 'settings' ? 'home' : 'settings')}
          style={({ pressed }) => [styles.settingsButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.settingsIcon}>{activeTab === 'settings' ? 'Home' : '⚙'}</Text>
        </Pressable>
      </View>

      {activeTab === 'home' ? (
        <RelayGrid relays={relays} loading={loading} updatingKey={updatingKey} names={relayNames} onUpdate={onUpdate} />
      ) : (
        <SettingsList relays={relays} names={relayNames} onRenameRelay={onRenameRelay} onLogout={onLogout} />
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RelayGrid({ relays, loading, updatingKey, names, onUpdate }) {
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
        // Saved names override the RainMaker device name on both Home and Settings.
        const label = names[relay.key]?.trim() || relay.defaultName;

        return (
          <Pressable
            key={relay.key}
            disabled={loading || isUpdating || !relay.online}
            onPress={() => onUpdate(relay.nodeId, relay.deviceName, relay.paramName, !relay.value, relay.key)}
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
    </View>
  );
}

function SettingsList({ relays, names, onRenameRelay, onLogout }) {
  const [section, setSection] = useState('devices');
  const [draftNames, setDraftNames] = useState(names);

  return (
    <View style={styles.settings}>
      <View style={styles.settingsTabs}>
        <SettingsOption label="Devices" value="devices" active={section} onPress={setSection} />
        <SettingsOption label="About" value="about" active={section} onPress={setSection} />
        <SettingsOption label="Logout" value="logout" active={section} onPress={setSection} />
      </View>

      {section === 'devices' && relays.length ? (
        relays.map((relay) => (
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
              onPress={() => onRenameRelay(relay.key, (draftNames[relay.key] ?? relay.defaultName).trim())}
              style={({ pressed }) => [styles.saveButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.saveText}>Save name</Text>
            </Pressable>
          </View>
        ))
      ) : null}

      {section === 'devices' && !relays.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No devices found</Text>
          <Text style={styles.emptyText}>Refresh after your RainMaker node reports relay parameters.</Text>
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
          <Text style={[styles.aboutTextFooter]}>~ Powered by <Text style={styles.rudradeb}>Rudradeb</Text> ❤️.</Text> 
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
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
    minWidth: 54,
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
    fontWeight: '900',
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
});
