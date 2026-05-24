import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'rainmaker_access_token';

export function getStoredAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token) {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export function deleteStoredAccessToken() {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
