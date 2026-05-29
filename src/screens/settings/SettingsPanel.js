import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import appConfig from '../../../app.json';
import AboutSettings from './AboutSettings';
import AutomationsSettings from './AutomationsSettings';
import styles from '../dashboard/styles';

const SETTINGS_OPTIONS = [
  {
    value: 'automations',
    label: 'Automations',
    badge: 'AU',
    description: 'Create and remove valid trigger/action rules.',
  },
  {
    value: 'about',
    label: 'About',
    badge: 'AB',
    description: 'App information and credits.',
  },
  {
    value: 'logout',
    label: 'Logout',
    badge: 'LO',
    description: 'Sign out from this RainMaker account on this phone.',
    danger: true,
  },
];

export default function SettingsPanel({
  section,
  onSectionChange,
  relays,
  names,
  automations,
  onCreateAutomation,
  onDeleteAutomation,
  onRefreshAutomations,
  onLogout,
}) {
  const activeOption = SETTINGS_OPTIONS.find((option) => option.value === section);
  const appVersion = appConfig?.expo?.version || '1.0.0';

  useEffect(() => {
    if (section === 'automations') {
      onRefreshAutomations?.();
    }
  }, [onRefreshAutomations, section]);

  if (!section) {
    return (
      <View style={styles.settingsMenu}>
        {SETTINGS_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onSectionChange(option.value)}
            style={({ pressed }) => [styles.settingsMenuCard, pressed ? styles.pressed : null]}
          >
            <View style={[styles.settingsMenuBadge, option.danger ? styles.settingsMenuBadgeDanger : null]}>
              <Text style={styles.settingsMenuBadgeText}>{option.badge}</Text>
            </View>
            <View style={styles.settingsMenuText}>
              <Text style={styles.settingsMenuTitle}>{option.label}</Text>
              <Text style={styles.settingsMenuSubtitle}>{option.description}</Text>
            </View>
            <Text style={styles.settingsMenuChevron}>></Text>
          </Pressable>
        ))}
        <Text style={styles.settingsVersion}>SmartHome v{appVersion}</Text>
      </View>
    );
  }

  return (
    <View style={styles.settings}>
      <View style={styles.sectionHeader}>
        <Pressable onPress={() => onSectionChange('')} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>{activeOption?.label || 'Settings'}</Text>
      </View>

      {section === 'automations' ? (
        <AutomationsSettings
          relays={relays}
          names={names}
          automations={automations}
          onCreateAutomation={onCreateAutomation}
          onDeleteAutomation={onDeleteAutomation}
        />
      ) : null}

      {section === 'about' ? <AboutSettings /> : null}

      {section === 'logout' ? (
        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
