import { Text, View } from 'react-native';
import { aboutContent } from '../../content/about';
import styles from '../dashboard/styles';

export default function AboutSettings() {
  return (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>{aboutContent.title}</Text>
      {aboutContent.paragraphs.map((paragraph) => (
        <Text key={paragraph} style={styles.aboutText}>
          {paragraph}
        </Text>
      ))}
      <Text style={styles.aboutTextFooter}>
        ~ Powered by <Text style={styles.rudradeb}>Rudradeb</Text>.
      </Text>
    </View>
  );
}
