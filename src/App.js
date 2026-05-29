import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  createNodeAutomation,
  deleteNodeAutomation,
  fetchUserAutomations,
  fetchUserNodes,
  loginRainMaker,
  updateNodeParam,
} from './api/rainmakerApi';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import { deleteStoredAccessToken, getStoredAccessToken, saveAccessToken } from './storage/authStorage';
import { colors } from './styles/theme';
import { getAutomationId, getAutomationName } from './utils/automationHelpers';

export default function App() {
  const [accessToken, setAccessToken] = useState('');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingSavedLogin, setCheckingSavedLogin] = useState(true);
  const [updatingKey, setUpdatingKey] = useState('');
  const [automations, setAutomations] = useState([]);

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

        if (!options.silent) {
          try {
            const nextAutomations = await fetchUserAutomations(token, getNodeIds(nextNodes));
            setAutomations(nextAutomations);
          } catch (error) {
            setAutomations([]);
          }
        }
      } catch (error) {
        if (options.clearSavedToken) {
          await deleteStoredAccessToken();
          setAccessToken('');
          setNodes([]);
          setAutomations([]);
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

  const refreshAutomations = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      const nextAutomations = await fetchUserAutomations(accessToken, getNodeIds(nodes));
      setAutomations(nextAutomations);
    } catch (error) {
      setAutomations([]);
    }
  }, [accessToken, nodes]);

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
    setAutomations([]);
  }



  async function handleCreateAutomation(automation) {
    try {
      await createNodeAutomation(accessToken, automation);
      const nextAutomations = await fetchUserAutomations(accessToken, getNodeIds(nodes));
      setAutomations(nextAutomations);
      Alert.alert('Automation added', `${automation.name} is now active in RainMaker.`);
    } catch (error) {
      Alert.alert('Automation failed', error.message || 'Could not add this automation.');
    }
  }

  function handleDeleteAutomation(automation) {
    const automationId = getAutomationId(automation);

    if (!automationId) {
      Alert.alert('Automation', 'This automation does not include an ID from RainMaker.');
      return;
    }

    Alert.alert('Delete automation', `Delete "${getAutomationName(automation) || automationId}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNodeAutomation(accessToken, automationId);
            const nextAutomations = await fetchUserAutomations(accessToken, getNodeIds(nodes));
            setAutomations(nextAutomations);
          } catch (error) {
            Alert.alert('Delete failed', error.message || 'Could not delete this automation.');
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
          automations={automations}
          onCreateAutomation={handleCreateAutomation}
          onDeleteAutomation={handleDeleteAutomation}
          onRefreshAutomations={refreshAutomations}
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



function getNodeIds(nodes) {
  return nodes.map((node) => node?.id || node?.node_id || node?.config?.node_id || '').filter(Boolean);
}
