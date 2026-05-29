import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEDULES_KEY = '@schedules';

export async function getSchedules() {
  try {
    const data = await AsyncStorage.getItem(SCHEDULES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading schedules:', error);
    return {};
  }
}

export async function saveSchedule(relayKey, schedule) {
  try {
    const schedules = await getSchedules();
    if (!schedules[relayKey]) {
      schedules[relayKey] = [];
    }
    schedules[relayKey].push({
      ...schedule,
      id: `${relayKey}-${Date.now()}`,
    });
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
    return schedules;
  } catch (error) {
    console.error('Error saving schedule:', error);
    throw error;
  }
}

export async function deleteSchedule(relayKey, scheduleId) {
  try {
    const schedules = await getSchedules();
    if (schedules[relayKey]) {
      schedules[relayKey] = schedules[relayKey].filter(s => s.id !== scheduleId);
    }
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
    return schedules;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

export async function getSchedulesForRelay(relayKey) {
  try {
    const schedules = await getSchedules();
    return schedules[relayKey] || [];
  } catch (error) {
    console.error('Error getting relay schedules:', error);
    return [];
  }
}
