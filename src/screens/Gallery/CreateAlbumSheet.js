import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import {uploadFileToServer, createAlbum, editAlbum} from './GalleryAPI';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {IMAGE_URL} from '../../connection/Config';

const PLACEHOLDER = require('../../assets/images/Image_placeholder.png');

let launchImageLibrary = null;
try {
  ({launchImageLibrary} = require('react-native-image-picker'));
} catch {}

const {height: SH} = Dimensions.get('window');

export default function CreateAlbumSheet({
  visible,
  onClose,
  onCreated,
  onEdited,
  album = null,
  selectedEvent,
}) {
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const isEdit = !!album;

  const [name, setName] = useState('');
  const [coverAsset, setCoverAsset] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Populate fields in edit mode
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      if (isEdit && album) {
        setName(album.name || '');
        setCoverUrl(album.coverUrl || null);
        setCoverAsset(null);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: SH,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const pickCover = () => {
    if (!launchImageLibrary) {
      Alert.alert('Package missing', 'Install react-native-image-picker.');
      return;
    }
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.85, selectionLimit: 1},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset) {
          setCoverAsset(asset);
          setCoverUrl(null); // replace existing
        }
      },
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Album name is required.');
      return;
    }
    setSaving(true);
    try {
      let finalCoverUrl = coverUrl;

      // Upload new cover if picked
      if (coverAsset) {
        setUploadingCover(true);
        const upRes = await uploadFileToServer(coverAsset, 'gallery-covers');
        setUploadingCover(false);
        if (upRes.status) {
          const result = Array.isArray(upRes.result)
            ? upRes.result[0]
            : upRes.result;
          finalCoverUrl = result.imagePath || result.imageUrl || null;
        } else {
          Alert.alert(
            'Upload failed',
            upRes.message || 'Cover photo upload failed.',
          );
          setSaving(false);
          return;
        }
      }

      if (isEdit) {
        // Edit: only name, description, coverUrl
        const dto = {
          name: name.trim(),
          description: null,
          coverUrl: finalCoverUrl || null,
        };
        const res = await editAlbum(album.albumId, dto);
        if (res.status) {
          onEdited?.(res.result || {...album, ...dto});
          resetAndClose();
        } else {
          Alert.alert('Error', res.message || 'Failed to update album.');
        }
      } else {
        // Create
        const dto = {
          name: name.trim(),
          description: null,
          coverUrl: finalCoverUrl || null,
          eventId: selectedEvent?.id || 0,
          eventName: selectedEvent?.name || '',
        };

        const res = await createAlbum(dto);
        if (res.status) {
          onCreated?.(res.result);
          resetAndClose();
        } else {
          Alert.alert('Error', res.message || 'Failed to create album.');
        }
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
      setUploadingCover(false);
    }
  };

  const resetAndClose = () => {
    setName('');
    setCoverAsset(null);
    setCoverUrl(null);
    onClose();
  };

  if (!visible) return null;

  const coverPreviewUri = coverAsset?.uri || IMAGE_URL + coverUrl || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={saving ? undefined : resetAndClose}>
      <TouchableOpacity
        style={cas.backdrop}
        activeOpacity={1}
        onPress={saving ? undefined : resetAndClose}
      />
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={cas.safeAreaWrapper}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={cas.kavWrapper}
          pointerEvents="box-none">
          <Animated.View
            style={[
              cas.sheet,
              {
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <View style={cas.handle} />
            <Text style={cas.title}>{isEdit ? 'Edit Album' : 'New Album'}</Text>

            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={cas.scrollContent}
              style={cas.scrollView}
              scrollIndicatorInsets={{right: 1}}>
              <Text style={cas.label}>Album Name *</Text>
              <TextInput
                style={cas.input}
                placeholder="e.g. Summer Retreat 2025"
                placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                value={name}
                onChangeText={setName}
                maxLength={120}
                returnKeyType="next"
              />

              <Text style={cas.label}>Cover Photo</Text>
              <TouchableOpacity
                style={cas.coverPicker}
                onPress={pickCover}
                activeOpacity={0.8}>
                {coverPreviewUri ? (
                  <>
                    <FastImage
                      source={{uri: coverPreviewUri}}
                      style={cas.coverPreview}
                      resizeMode={FastImage.resizeMode.cover}
                      defaultSource={PLACEHOLDER}
                    />
                    <View style={cas.coverOverlay}>
                      <Text style={cas.coverOverlayTxt}>Tap to change</Text>
                    </View>
                  </>
                ) : (
                  <View style={cas.coverPlaceholder}>
                    <FastImage
                      source={PLACEHOLDER}
                      style={cas.coverPlaceholderImg}
                      resizeMode="contain"
                    />
                    <Text style={cas.coverPlaceholderTxt}>Add cover photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={[cas.actions, {}]}>
              <TouchableOpacity
                style={cas.cancelBtn}
                onPress={resetAndClose}
                disabled={saving}>
                <Text style={cas.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cas.saveBtn, saving && cas.btnDisabled]}
                onPress={handleSave}
                disabled={saving}>
                {saving ? (
                  <View style={cas.savingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[cas.saveTxt, {marginLeft: 8}]}>
                      {uploadingCover
                        ? 'Uploading…'
                        : isEdit
                        ? 'Saving…'
                        : 'Creating…'}
                    </Text>
                  </View>
                ) : (
                  <Text style={cas.saveTxt}>
                    {isEdit ? 'Save Changes' : 'Create Album'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const cas = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  safeAreaWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flex: 1,
    maxHeight: SH * 0.85,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.INPUTBORDER || '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    color: COLORS.PRIMARYBLACK,
    fontSize: FONTS.FONTSIZE.MEDIUM || 17,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 50,
    flexGrow: 1,
  },
  label: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#e0e0ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    height: 38,
    paddingVertical: 0,
  },
  inputMulti: {minHeight: 72, textAlignVertical: 'top', paddingVertical: 4},
  // Cover photo
  coverPicker: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    borderStyle: 'dashed',
  },
  coverPreview: {width: '100%', height: '100%'},
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.139)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOverlayTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.SEMIMINI || 13,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPlaceholderImg: {width: 48, height: 48, opacity: 0.35},
  coverPlaceholderTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.INPUTBORDER || '#eee',
    backgroundColor: COLORS.PRIMARYWHITE,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    alignItems: 'center',
  },
  cancelTxt: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnDisabled: {opacity: 0.5},
  saveTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  savingRow: {flexDirection: 'row', alignItems: 'center'},
});
