import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Image,
} from 'react-native';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {SafeAreaView} from 'react-native-safe-area-context';

const APP_ICON = require('../../assets/images/Image.png');

const UpdateModal = ({
  visible,
  forceUpdate,
  latestVersion,
  message,
  storeUrl,
  updatedDate,
  appName,
  onDismiss,
}) => {
  const [whatsNewExpanded, setWhatsNewExpanded] = useState(false);

  const handleUpdate = async () => {
    if (storeUrl) {
      try {
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
        }
      } catch (_) {}
    }
  };

  const displayAppName = appName || 'Inngenius Community';
  const displayDate = updatedDate || '';
  const whatsNewText = message || 'Bug fixes and performance improvements.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        if (!forceUpdate && onDismiss) onDismiss();
      }}>
      <View style={styles.modalContainer}>
        {/* Backdrop — tap to dismiss if not force update */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            if (!forceUpdate && onDismiss) onDismiss();
          }}
        />
        {/* Bottom Sheet */}
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Update available</Text>
            {!forceUpdate && onDismiss && (
              <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
                <AntDesign
                  name="close"
                  size={20}
                  color={COLORS.PLACEHOLDERCOLOR}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {forceUpdate
              ? 'A required update is available. Please update the app to continue using it.'
              : 'To use this app, download the latest version. You can keep using this app while downloading the update.'}
          </Text>

          <View style={styles.divider} />

          {/* App info row */}
          <View style={styles.appRow}>
            <Image source={APP_ICON} style={styles.appIcon} />
            <View style={styles.appInfo}>
              <Text style={styles.appName} numberOfLines={1}>
                {displayAppName}
              </Text>
              <View style={styles.chipsRow}>
                {latestVersion ? (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>v{latestVersion}</Text>
                  </View>
                ) : null}
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {Platform.OS === 'android' ? 'Android' : 'iOS'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* What's new section */}
          <TouchableOpacity
            style={styles.whatsNewHeader}
            onPress={() => setWhatsNewExpanded(p => !p)}
            activeOpacity={0.7}>
            <View>
              <Text style={styles.whatsNewTitle}>What's new</Text>
              {displayDate ? (
                <Text style={styles.whatsNewDate}>{displayDate}</Text>
              ) : null}
            </View>
            <AntDesign
              name={whatsNewExpanded ? 'up' : 'down'}
              size={16}
              color={COLORS.grey500}
            />
          </TouchableOpacity>

          {whatsNewExpanded && (
            <Text style={styles.whatsNewText}>{whatsNewText}</Text>
          )}

          <View style={styles.divider} />

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            {!forceUpdate && onDismiss ? (
              <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
                <Text style={styles.laterBtnText}>Later</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.updateBtn,
                !forceUpdate && onDismiss
                  ? styles.updateBtnFlex
                  : styles.updateBtnFull,
              ]}
              onPress={handleUpdate}>
              <Text style={styles.updateBtnText}>Update</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.LIGHTGREY,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    fontSize: FONTS.FONTSIZE.SEMI,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.PLACEHOLDERCOLOR,
    lineHeight: 22,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appInfo: {
    flex: 1,
    gap: 6,
  },
  appName: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    color: COLORS.PLACEHOLDERCOLOR,
    includeFontPadding: false,
  },
  whatsNewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whatsNewTitle: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  whatsNewDate: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    color: COLORS.grey500,
    marginTop: 2,
  },
  whatsNewText: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.grey500,
    lineHeight: 22,
    marginTop: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PLACEHOLDERCOLOR,
    includeFontPadding: false,
  },
  updateBtn: {
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: COLORS.TITLECOLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnFlex: {
    flex: 1,
  },
  updateBtnFull: {
    flex: 1,
  },
  updateBtnText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYWHITE,
    includeFontPadding: false,
  },
});

export default UpdateModal;
