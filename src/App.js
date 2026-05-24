import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchUserNodes, loginRainMaker, updateNodeParam } from './api/rainmakerApi';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import { deleteStoredAccessToken, getStoredAccessToken, saveAccessToken } from './storage/authStorage';
import { colors } from './styles/theme';

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
  }

  function handleRenameRelay(key, name) {
    setRelayNames((current) => ({
      ...current,
      [key]: name,
    }));
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
