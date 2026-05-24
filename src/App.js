import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  createNodeSchedule,
  deleteNodeSchedule,
  fetchNodeParams,
  fetchUserNodes,
  loginRainMaker,
  updateNodeMetadata,
  updateNodeParam,
} from './api/rainmakerApi';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import { deleteStoredAccessToken, getStoredAccessToken, saveAccessToken } from './storage/authStorage';
import { colors } from './styles/theme';

const RELAY_NAMES_METADATA_KEY = 'smart_home_relay_names';

export default function App() {
  const [accessToken, setAccessToken] = useState('');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingSavedLogin, setCheckingSavedLogin] = useState(true);
  const [updatingKey, setUpdatingKey] = useState('');
  const [relayNames, setRelayNames] = useState({});

  const loadNodes = useCallback(
    async (token, options = {}) => {
      if (!token) {
        return;
      }

      try {
        if (options.showLoading) {
          setLoading(true);
        }
        const nextNodes = await fetchUserNodes(token);
        setNodes(nextNodes);
        setRelayNames(extractRelayNames(nextNodes));
      } catch (error) {
        if (options.clearSavedToken) {
          await deleteStoredAccessToken();
          setAccessToken('');
          setNodes([]);
        }
        if (!options.silent) {
          Alert.alert('RainMaker', error.message || 'Unable to load nodes.');
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function restoreLogin() {
      try {
        const savedToken = await getStoredAccessToken();

        if (savedToken && isMounted) {
          setAccessToken(savedToken);
          await loadNodes(savedToken, { showLoading: true, clearSavedToken: true });
        }
      } catch (error) {
        await deleteStoredAccessToken();
      } finally {
        if (isMounted) {
          setCheckingSavedLogin(false);
        }
      }
    }

    restoreLogin();

    return () => {
      isMounted = false;
    };
  }, [loadNodes]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    // Keep relay states fresh without pull-to-refresh animation.
    const timer = setInterval(() => {
      loadNodes(accessToken, { silent: true });
    }, 3000);

    return () => clearInterval(timer);
  }, [accessToken, loadNodes]);

  async function handleLogin(email, password) {
    if (!email || !password) {
      Alert.alert('Login', 'Enter your RainMaker email and password.');
      return;
    }

    try {
      setLoading(true);
      const token = await loginRainMaker(email, password);
      await saveAccessToken(token);
      setAccessToken(token);
      await loadNodes(token, { showLoading: true });
    } catch (error) {
      Alert.alert('Login failed', error.message || 'Please check your RainMaker account details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(nodeId, deviceName, paramName, value, key) {
    try {
      setUpdatingKey(key);
      await updateNodeParam(accessToken, nodeId, deviceName, paramName, value);
      await loadNodes(accessToken, { silent: true });
    } catch (error) {
      Alert.alert('Update failed', error.message || 'Could not update status.');
    } finally {
      setUpdatingKey('');
    }
  }

  async function handleLogout() {
    await deleteStoredAccessToken();
    setAccessToken('');
    setNodes([]);
    setRelayNames({});
  }

  async function handleRenameRelay(relay, name) {
    const nextName = name.trim();

    if (!nextName) {
      Alert.alert('Rename device', 'Enter a device name first.');
      return;
    }

    const nextNames = {
      ...relayNames,
      [relay.key]: nextName,
    };
    const currentMetadata = relay.node?.metadata || {};

    try {
      setRelayNames(nextNames);
      await updateNodeMetadata(accessToken, relay.nodeId, {
        ...currentMetadata,
        [RELAY_NAMES_METADATA_KEY]: nextNames,
      });
      await loadNodes(accessToken, { silent: true });
    } catch (error) {
      setRelayNames(relayNames);
      Alert.alert('Rename failed', error.message || 'Could not sync this name to RainMaker.');
    }
  }

  async function handleCreateSchedule(relay, schedule) {
    try {
      const id = makeScheduleId();
      const actionLabel = schedule.value ? 'ON' : 'OFF';
      await createNodeSchedule(accessToken, relay.nodeId, {
        id,
        name: `${relay.displayName || relay.defaultName} ${actionLabel} ${schedule.dateLabel} ${schedule.timeLabel}`,
        minutes: schedule.minutes,
        day: schedule.day,
        month: schedule.month,
        year: schedule.year,
        value: schedule.value,
        deviceName: relay.deviceName,
        paramName: relay.paramName,
      });

      await loadNodes(accessToken, { silent: true });
      const params = await fetchNodeParams(accessToken, relay.nodeId);

      if (!hasSchedule(params, id)) {
        Alert.alert(
          'Schedule not saved',
          'RainMaker received the request, but the ESP node did not report the schedule back. Enable the RainMaker Schedule service and Time service in the firmware.',
        );
        return;
      }

      Alert.alert(
        'Schedule added',
        `${relay.displayName || relay.defaultName} will turn ${actionLabel} on ${schedule.dateLabel} at ${schedule.timeLabel}.`,
      );
    } catch (error) {
      Alert.alert(
        'Schedule failed',
        error.message || 'Could not add the schedule. Make sure scheduling is enabled in the ESP RainMaker firmware.',
      );
    }
  }

  function handleDeleteSchedule(schedule) {
    Alert.alert('Delete schedule', `Delete "${schedule.name || schedule.id}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNodeSchedule(accessToken, schedule.nodeId, schedule.id);
            await loadNodes(accessToken, { silent: true });
          } catch (error) {
            Alert.alert('Delete failed', error.message || 'Could not delete this schedule.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {accessToken ? (
        <DashboardScreen
          nodes={nodes}
          loading={loading}
          onLogout={handleLogout}
          onUpdate={handleUpdate}
          updatingKey={updatingKey}
          relayNames={relayNames}
          onRenameRelay={handleRenameRelay}
          onCreateSchedule={handleCreateSchedule}
          onDeleteSchedule={handleDeleteSchedule}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} loading={loading || checkingSavedLogin} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: colors.background,
  },
});

function extractRelayNames(nodes) {
  return nodes.reduce((names, node) => {
    const savedNames = node?.metadata?.[RELAY_NAMES_METADATA_KEY];

    if (savedNames && typeof savedNames === 'object' && !Array.isArray(savedNames)) {
      return {
        ...names,
        ...savedNames,
      };
    }

    return names;
  }, {});
}

function makeScheduleId() {
  return Math.random().toString(16).slice(2, 6).toUpperCase();
}

function hasSchedule(params, scheduleId) {
  const schedules = normalizeScheduleList(params?.Schedule?.Schedules);
  return schedules.some((schedule) => schedule?.id === scheduleId);
}

function normalizeScheduleList(schedules) {
  if (Array.isArray(schedules)) {
    return schedules;
  }

  if (typeof schedules === 'string') {
    try {
      return normalizeScheduleList(JSON.parse(schedules));
    } catch (error) {
      return [];
    }
  }

  if (schedules && typeof schedules === 'object') {
    return normalizeScheduleList(schedules.value);
  }

  return [];
}
