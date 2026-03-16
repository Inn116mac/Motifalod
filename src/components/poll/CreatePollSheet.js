import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Keyboard,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import FONTS from '../../theme/Fonts';
import COLORS from '../../theme/Color';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function CreatePollSheet({
  visible,
  onClose,
  onPublish,
  onUpdate,
  editingPoll,
}) {
  const isEditMode = !!editingPoll;
  const slideAnim = useRef(new Animated.Value(600)).current;

  // ── Form state ─────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endsAt, setEndsAt] = useState(null); // Date | null
  const [options, setOptions] = useState(['', '']);

  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // ── Populate / reset form when sheet opens ─────────────
  useEffect(() => {
    if (visible && isEditMode && editingPoll) {
      setTitle(editingPoll.title || '');
      setDescription(editingPoll.description || '');
      setEndsAt(editingPoll.endsAt ? new Date(editingPoll.endsAt) : null);
      setOptions(editingPoll.options?.map(o => o.text) || ['', '']);
      setAllowMultiple(editingPoll.allowMultiple || false);
      setIsAnonymous(editingPoll.isAnonymous || false);
    } else if (visible && !isEditMode) {
      resetForm();
    }
  }, [visible, isEditMode, editingPoll]);

  // ── Slide animation ────────────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 160,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Reset ──────────────────────────────────────────────
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEndsAt(null);
    setOptions(['', '']);
    setAllowMultiple(false);
    setIsAnonymous(false);
  };

  // Close always resets so drafts never persist
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── Options helpers ────────────────────────────────────
  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };
  const removeOption = i => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  // ── Date picker ────────────────────────────────────────
  const handleDateConfirm = date => {
    setEndsAt(date);
    setDatePickerVisible(false);
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const validOpts = options.filter(o => o.trim());
    if (!title.trim() || (!isEditMode && validOpts.length < 2)) return;

    setPublishing(true);
    await new Promise(r => setTimeout(r, 300));

    if (isEditMode) {
      // PUT payload — all 6 editable fields, no category
      onUpdate?.(editingPoll.pollId, {
        title: title.trim(),
        description: description.trim() || null,
        endsAt: endsAt ? endsAt.toISOString() : null,
        isAnonymous,
        allowMultiple,
      });
    } else {
      // POST payload — no category (always sent as '' from screen)
      onPublish?.({
        title: title.trim(),
        description: description.trim() || null,
        endsAt: endsAt ? endsAt.toISOString() : null,
        isAnonymous,
        allowMultiple,
        options: validOpts,
      });
    }

    setPublishing(false);
    resetForm();
    onClose();
  };

  const canSubmit = isEditMode
    ? title.trim().length > 0 && !publishing
    : title.trim().length > 0 &&
      options.filter(o => o.trim()).length >= 2 &&
      !publishing;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none">
        <Animated.View
          style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.head}>
            <Text style={styles.headTitle}>
              {isEditMode ? 'Edit Poll' : 'Create Poll'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.textarea}
              placeholder="What would you like to ask the community?"
              placeholderTextColor={COLORS.grey500}
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={200}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Add context to help members decide..."
              placeholderTextColor={COLORS.grey500}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />

            {/* Ends At — date picker (both create and edit) */}
            <Text style={styles.label}>Ends At (optional)</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                Keyboard.dismiss();
                setDatePickerVisible(true);
              }}
              activeOpacity={0.7}>
              <Text
                style={[styles.dateText, !endsAt && {color: COLORS.grey500}]}>
                {endsAt
                  ? moment(endsAt).format('MMM DD, YYYY')
                  : 'Select end date'}
              </Text>
              <Text style={styles.calIcon}>📅</Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={datePickerVisible}
              mode="date"
              display="inline"
              minimumDate={new Date()}
              date={endsAt || new Date()}
              onConfirm={handleDateConfirm}
              onCancel={() => setDatePickerVisible(false)}
            />

            {endsAt && (
              <TouchableOpacity
                style={styles.clearDate}
                onPress={() => setEndsAt(null)}>
                <Text style={styles.clearDateTxt}>✕ Remove end date</Text>
              </TouchableOpacity>
            )}

            {/* Options — read-only in edit mode */}
            <Text style={styles.label}>
              {isEditMode ? 'Options (read-only)' : 'Options * (min 2, max 6)'}
            </Text>
            {options.map((opt, i) => (
              <View key={i} style={styles.optRow}>
                <View style={styles.optLbl}>
                  <Text style={styles.optLblTxt}>{LABELS[i]}</Text>
                </View>
                <TextInput
                  style={[
                    styles.optInput,
                    isEditMode && styles.optInputDisabled,
                  ]}
                  placeholder={`Option ${LABELS[i]}`}
                  placeholderTextColor={COLORS.grey500}
                  value={opt}
                  onChangeText={v => {
                    if (isEditMode) return;
                    const u = [...options];
                    u[i] = v;
                    setOptions(u);
                  }}
                  editable={!isEditMode}
                  maxLength={100}
                />
                {!isEditMode && (
                  <TouchableOpacity
                    style={[styles.optRm, options.length <= 2 && {opacity: 0}]}
                    onPress={() => removeOption(i)}
                    disabled={options.length <= 2}>
                    <Text style={styles.optRmTxt}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {!isEditMode && options.length < 6 && (
              <TouchableOpacity style={styles.addOptBtn} onPress={addOption}>
                <Text style={styles.addOptTxt}>＋ Add option</Text>
              </TouchableOpacity>
            )}

            {/* Toggles — shown in BOTH create and edit */}
            <View style={styles.tglRow}>
              <View style={{flex: 1, paddingRight: 10}}>
                <Text style={styles.tglLbl}>Allow multiple selections</Text>
                <Text style={styles.tglSub}>
                  Members can pick more than one option
                </Text>
              </View>
              <Switch
                value={allowMultiple}
                onValueChange={setAllowMultiple}
                trackColor={{
                  false: '#f0ece6',
                  true: 'rgba(240,106,26,0.3)',
                }}
                thumbColor={allowMultiple ? COLORS.LABELCOLOR : COLORS.grey500}
              />
            </View>
            <View
              style={[styles.tglRow, {borderBottomWidth: 0, marginBottom: 10}]}>
              <View style={{flex: 1, paddingRight: 10}}>
                <Text style={styles.tglLbl}>Anonymous voting</Text>
                <Text style={styles.tglSub}>Hide voter names in results</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{
                  false: '#f0ece6',
                  true: 'rgba(240,106,26,0.3)',
                }}
                thumbColor={isAnonymous ? COLORS.LABELCOLOR : COLORS.grey500}
              />
            </View>

            {isEditMode && (
              <View style={styles.editNote}>
                <Text style={styles.editNoteTxt}>
                  ℹ️ Options cannot be changed after a poll is published.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.foot}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishBtn, !canSubmit && styles.publishBtnDis]}
              onPress={handleSubmit}
              disabled={!canSubmit}>
              <Text style={styles.publishTxt}>
                {publishing
                  ? isEditMode
                    ? 'Saving...'
                    : 'Publishing...'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Publish Poll'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(26,23,20,0.5)',
  },
  kav: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.TABLEBORDER,
    alignSelf: 'center',
    marginTop: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.TABLEBORDER,
  },
  headTitle: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f5f1ec',
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {fontSize: 14, color: '#5a5550'},
  body: {paddingHorizontal: 20, paddingTop: 16},
  label: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.grey500,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  textarea: {
    backgroundColor: '#f5f1ec',
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 14,
    includeFontPadding: false,
  },
  dateInput: {
    backgroundColor: '#f5f1ec',
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    includeFontPadding: false,
  },
  calIcon: {fontSize: 16},
  clearDate: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    marginTop: 2,
  },
  clearDateTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYRED,
    includeFontPadding: false,
  },
  optRow: {flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8},
  optLbl: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f0ece6',
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optLblTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.grey500,
  },
  optInput: {
    flex: 1,
    backgroundColor: '#f5f1ec',
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    height: 34,
    includeFontPadding: false,
  },
  optInputDisabled: {
    opacity: 0.6,
    backgroundColor: '#eeebe6',
  },
  optRm: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optRmTxt: {fontSize: 18, color: COLORS.PRIMARYRED, lineHeight: 22},
  addOptBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addOptTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  tglRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
  },
  tglLbl: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
  },
  tglSub: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
  },
  editNote: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d0dbf5',
  },
  editNoteTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#4a6abf',
    includeFontPadding: false,
  },
  foot: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f5f1ec',
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#5a5550',
    includeFontPadding: false,
  },
  publishBtn: {
    flex: 2,
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: COLORS.LABELCOLOR,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  publishBtnDis: {opacity: 0.4, shadowOpacity: 0},
  publishTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#fff',
    includeFontPadding: false,
  },
});
