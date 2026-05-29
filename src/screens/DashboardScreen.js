import { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import RelayGrid from './dashboard/RelayGrid';
import { HomeIcon, SettingsGearIcon } from './dashboard/Icons';
import styles from './dashboard/styles';
import SettingsPanel from './settings/SettingsPanel';
import { getRelayControls } from '../utils/nodes';

export default function DashboardScreen({
  nodes,
  loading,
  onLogout,
  onUpdate,
  updatingKey,
  automations,
  onCreateAutomation,
  onDeleteAutomation,
  onRefreshAutomations,
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [settingsSection, setSettingsSection] = useState('');
  const relays = useMemo(() => getRelayControls(nodes), [nodes]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab === 'settings') {
        if (settingsSection) {
          setSettingsSection('');
          return true;
        }

        setActiveTab('home');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [activeTab, settingsSection]);

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
          {activeTab === 'settings' ? <HomeIcon /> : <SettingsGearIcon />}
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
            names={{}}
            onUpdate={onUpdate}
          />
        ) : (
          <SettingsPanel
            section={settingsSection}
            onSectionChange={setSettingsSection}
            relays={relays}
            names={{}}
            automations={automations}
            onCreateAutomation={onCreateAutomation}
            onDeleteAutomation={onDeleteAutomation}
            onRefreshAutomations={onRefreshAutomations}
            onLogout={onLogout}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
