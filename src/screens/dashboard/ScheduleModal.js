import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import {
  WEEK_DAYS,
  buildScheduleTrigger,
  getRepeatDaysBitmap,
  getRepeatLabel,
  isValidDateParts,
} from '../../utils/scheduleHelpers';
import styles from './styles';

export default function ScheduleModal({ relay, onClose, onSave }) {
  const today = new Date();
  const [year, setYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(String(today.getDate()).padStart(2, '0'));
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [value, setValue] = useState(true);
  const [repeatMode, setRepeatMode] = useState('once');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5, 6, 7]);

  useEffect(() => {
    if (!relay) {
      return;
    }

    const now = new Date();
    setYear(String(now.getFullYear()));
    setMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setDay(String(now.getDate()).padStart(2, '0'));
    setHour(String(now.getHours()).padStart(2, '0'));
    setMinute(String(now.getMinutes()).padStart(2, '0'));
    setValue(!relay.value);
    setRepeatMode('once');
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
  }, [relay]);

  if (!relay) {
    return null;
  }

  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  const hasValidDateText = /^\d{4}$/.test(year) && /^\d{1,2}$/.test(month) && /^\d{1,2}$/.test(day);
  const hasValidHourText = /^\d{1,2}$/.test(hour);
  const hasValidMinuteText = /^\d{1,2}$/.test(minute);
  const dateIsValid = hasValidDateText && isValidDateParts(parsedYear, parsedMonth, parsedDay);
  const timeIsValid =
    hasValidHourText &&
    hasValidMinuteText &&
    Number.isInteger(parsedHour) &&
    Number.isInteger(parsedMinute) &&
    parsedHour >= 0 &&
    parsedHour <= 23 &&
    parsedMinute >= 0 &&
    parsedMinute <= 59;
  const repeatDaysBitmap = getRepeatDaysBitmap(repeatMode, selectedDays);
  const formIsValid = dateIsValid && timeIsValid && (repeatMode !== 'custom' || repeatDaysBitmap > 0);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text numberOfLines={2} adjustsFontSizeToFit style={styles.modalTitle}>
            {relay.displayName}
          </Text>
          <Text style={styles.modalText}>Set date and clock time</Text>

          <View style={styles.dateRow}>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
              style={[styles.dateInput, styles.yearInput]}
            />
            <Text style={styles.dateSeparator}>-</Text>
            <TextInput
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.dateInput}
            />
            <Text style={styles.dateSeparator}>-</Text>
            <TextInput
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.dateInput}
            />
          </View>

          <View style={styles.timeRow}>
            <TextInput
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.timeInput}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={styles.timeInput}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setValue(true)}
              style={[styles.actionButton, value ? styles.activeActionButton : null]}
            >
              <Text style={[styles.actionText, value ? styles.activeActionText : null]}>Turn ON</Text>
            </Pressable>
            <Pressable
              onPress={() => setValue(false)}
              style={[styles.actionButton, !value ? styles.activeActionButton : null]}
            >
              <Text style={[styles.actionText, !value ? styles.activeActionText : null]}>Turn OFF</Text>
            </Pressable>
          </View>

          <View style={styles.repeatSection}>
            <Text style={styles.scheduleMeta}>Repeat</Text>
            <View style={styles.repeatGrid}>
              <RepeatOption label="Once" value="once" active={repeatMode} onPress={setRepeatMode} />
              <RepeatOption label="Daily" value="daily" active={repeatMode} onPress={setRepeatMode} />
              <RepeatOption label="Weekdays" value="weekdays" active={repeatMode} onPress={setRepeatMode} />
              <RepeatOption label="Weekends" value="weekends" active={repeatMode} onPress={setRepeatMode} />
              <RepeatOption label="Custom" value="custom" active={repeatMode} onPress={setRepeatMode} />
            </View>
            {repeatMode === 'custom' ? (
              <View style={styles.dayGrid}>
                {WEEK_DAYS.map((weekday) => {
                  const selected = selectedDays.includes(weekday.value);

                  return (
                    <Pressable
                      key={weekday.value}
                      onPress={() =>
                        setSelectedDays((current) =>
                          current.includes(weekday.value)
                            ? current.filter((value) => value !== weekday.value)
                            : [...current, weekday.value],
                        )
                      }
                      style={[styles.dayButton, selected ? styles.activeDayButton : null]}
                    >
                      <Text style={[styles.dayText, selected ? styles.activeDayText : null]}>
                        {weekday.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          {!dateIsValid ? <Text style={styles.errorText}>Use a valid date as YYYY-MM-DD.</Text> : null}
          {!timeIsValid ? <Text style={styles.errorText}>Use 24-hour time from 00:00 to 23:59.</Text> : null}
          {repeatMode === 'custom' && repeatDaysBitmap === 0 ? (
            <Text style={styles.errorText}>Select at least one repeat day.</Text>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!formIsValid}
              onPress={() =>
                onSave({
                  minutes: parsedHour * 60 + parsedMinute,
                  day: parsedDay,
                  month: parsedMonth,
                  year: parsedYear,
                  dateLabel: `${String(parsedYear)}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`,
                  timeLabel: `${String(parsedHour).padStart(2, '0')}:${String(parsedMinute).padStart(2, '0')}`,
                  repeatLabel: getRepeatLabel(repeatMode, selectedDays),
                  trigger: buildScheduleTrigger({
                    year: parsedYear,
                    month: parsedMonth,
                    day: parsedDay,
                    hour: parsedHour,
                    minute: parsedMinute,
                    repeatMode,
                    selectedDays,
                  }),
                  value,
                })
              }
              style={[styles.saveScheduleButton, !formIsValid ? styles.disabledButton : null]}
            >
              <Text style={styles.saveScheduleText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RepeatOption({ label, value, active, onPress }) {
  const selected = active === value;

  return (
    <Pressable
      onPress={() => onPress(value)}
      style={[styles.repeatOption, selected ? styles.activeRepeatOption : null]}
    >
      <Text style={[styles.repeatOptionText, selected ? styles.activeRepeatOptionText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}
