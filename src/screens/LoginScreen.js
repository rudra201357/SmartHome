import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, shadow, spacing } from '../styles/theme';

export default function LoginScreen({ onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>My SmartHome</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            style={styles.passwordInput}
          />
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [styles.showButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.showText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Pressable
          disabled={loading}
          onPress={() => onLogin(email.trim(), password)}
          style={({ pressed }) => [
            styles.button,
            pressed && !loading ? styles.pressed : null,
            loading ? styles.disabled : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>
      </View>
      <Text style={styles.footer}>Powered by <Text style={styles.footerHighlight}>Rudradeb</Text> ❤️</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: 'Georgia-Bold',
    color: colors.cyan,
   
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
    ...shadow,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#0B111C',
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  passwordRow: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#0B111C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  showButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showText: {
    color: colors.cyan,
    fontWeight: '800',
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.65,
  },
  footer: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  footerHighlight: {
    color: colors.cyan,
    fontWeight: '800',
  },
});
