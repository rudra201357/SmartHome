import { View } from 'react-native';
import styles from './styles';

export function HomeIcon() {
  return (
    <View style={styles.homeIcon}>
      <View style={styles.homeRoof} />
      <View style={styles.homeBody}>
        <View style={styles.homeDoor} />
      </View>
    </View>
  );
}

export function SettingsGearIcon() {
  return (
    <View style={styles.gearIcon}>
      <View style={[styles.gearTooth, styles.gearToothTop]} />
      <View style={[styles.gearTooth, styles.gearToothRight]} />
      <View style={[styles.gearTooth, styles.gearToothBottom]} />
      <View style={[styles.gearTooth, styles.gearToothLeft]} />
      <View style={styles.gearCircle}>
        <View style={styles.gearDot} />
      </View>
    </View>
  );
}
