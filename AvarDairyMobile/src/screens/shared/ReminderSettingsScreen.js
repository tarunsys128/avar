import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Switch, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PREMADE_TUNES = [
  { name: 'Gentle Wake', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Crystal Chime', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { name: 'Digital Alert', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
];

const ReminderSettingsScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState(DAYS);
  const [sound, setSound] = useState({ name: 'Default', url: null });
  
  const [playbackInstance, setPlaybackInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchSettings();
    return () => {
      stopPlayback();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (data) {
        setEnabled(data.is_enabled);
        setSelectedDays(data.days || DAYS);
        if (data.sound_name) {
           setSound({ name: data.sound_name, url: data.sound_url });
        }
        
        if (data.time) {
          const [h, m] = data.time.split(':');
          const d = new Date();
          d.setHours(parseInt(h), parseInt(m), 0, 0);
          setTime(d);
        }
      }
    } catch (err) {
      console.log("No existing reminder found or error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      const payload = {
        user_id: currentUser.id,
        time: timeStr,
        days: selectedDays,
        is_enabled: enabled,
        sound_name: sound.name,
        sound_url: sound.url,
        updated_at: new Date().toISOString()
      };

      // Ensure upsert works with the unique constraint
      const { data, error } = await supabase
        .from('reminders')
        .upsert(payload, { onConflict: 'user_id' })
        .select();

      if (error) throw error;
      
      if (enabled) {
        await scheduleNotification(time);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      Alert.alert("Success", "Reminder settings saved successfully!");
    } catch (err) {
      console.error("Save Error:", err);
      Alert.alert("Error", err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleNotification = async (date) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Cross-platform daily trigger
    const trigger = {
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Avar Dairy Reminder 🥛",
        body: "Time to check your daily orders!",
        sound: true,
        priority: 'high',
      },
      trigger,
    });
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSoundPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSound({ name: file.name, url: file.uri });
        Alert.alert("Sound Loaded", `Selected: ${file.name}. Click Save to apply.`);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const playSound = async (url) => {
    try {
      await stopPlayback();
      if (!url) return;
      
      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url }, 
        { shouldPlay: true }
      );
      setPlaybackInstance(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.log("Playback error:", err);
      setIsPlaying(false);
    }
  };

  const stopPlayback = async () => {
    if (playbackInstance) {
      await playbackInstance.stopAsync();
      await playbackInstance.unloadAsync();
      setPlaybackInstance(null);
    }
    setIsPlaying(false);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Reminders</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.section}>
          <View style={s.row}>
            <View>
              <Text style={s.sectionTitle}>Enable Alarms</Text>
              <Text style={s.sectionDesc}>Get notified for regular orders</Text>
            </View>
            <Switch 
              value={enabled} 
              onValueChange={setEnabled}
              trackColor={{ false: '#767577', true: COLORS.primaryLight }}
              thumbColor={enabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Reminder Time</Text>
          <TouchableOpacity style={s.timeDisplay} onPress={() => setShowTimePicker(true)}>
            <Text style={s.timeText}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={s.editLink}>Change</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </View>

        <View style={s.section}>
          <Text style={s.label}>Repeat On</Text>
          <View style={s.daysRow}>
            {DAYS.map(day => {
              const active = selectedDays.includes(day);
              return (
                <TouchableOpacity 
                  key={day} 
                  style={[s.dayCircle, active && s.dayCircleActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[s.dayText, active && s.dayTextActive]}>{day[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.label}>Alarm Sound</Text>
            {isPlaying && (
              <TouchableOpacity style={s.stopBtn} onPress={stopPlayback}>
                <Text style={s.stopBtnTxt}>⏹ Stop Preview</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={s.soundList}>
            {PREMADE_TUNES.map(t => (
              <TouchableOpacity 
                key={t.name} 
                style={[s.soundItem, sound.name === t.name && s.soundItemActive]}
                onPress={() => { setSound(t); playSound(t.url); }}
              >
                <Text style={[s.soundName, sound.name === t.name && s.soundNameActive]}>{t.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  {sound.name === t.name && <Text style={s.check}>✓ </Text>}
                  <Text style={{fontSize: 12}}>▶</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.uploadBtn} onPress={handleSoundPick}>
              <Text style={s.uploadBtnTxt}>{sound.url ? `Selected: ${sound.name}` : '+ Upload Custom Sound'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={saveSettings} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>Save Settings</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, 
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border 
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 20, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  scroll: { padding: SPACING.lg },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textDark },
  sectionDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },

  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textDark },
  timeDisplay: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: COLORS.bgLight, padding: SPACING.md, borderRadius: RADIUS.md, marginTop: 10
  },
  timeText: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  editLink: { color: COLORS.primary, fontWeight: '600' },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  dayCircleActive: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  dayTextActive: { color: COLORS.white },

  soundList: { marginTop: 10 },
  soundItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border 
  },
  soundItemActive: { borderBottomColor: COLORS.primary },
  soundName: { fontSize: FONTS.sizes.sm, color: COLORS.textMed },
  soundNameActive: { color: COLORS.primary, fontWeight: '700' },
  check: { color: COLORS.primary, fontWeight: 'bold' },
  
  stopBtn: { backgroundColor: COLORS.danger + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  stopBtnTxt: { color: COLORS.danger, fontSize: 10, fontWeight: 'bold' },

  uploadBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md },
  uploadBtnTxt: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },

  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.lg, ...SHADOW.md },
  saveBtnTxt: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: 'bold' },
});

export default ReminderSettingsScreen;
