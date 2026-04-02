// src/screens/EventTemplatePickerScreen.js
import React, {useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {NOTIFY_MESSAGE} from '../constant/Module';
import RNShare from 'react-native-share';

import {
  TemplateLuxury,
  TemplateFestive,
  TemplateMinimal,
  TemplateBold,
  TemplateNature,
  TemplateMidnight,
  TemplateRetro,
  TemplateRangoli,
  TemplateSacred,
  TemplateKids,
} from '../components/eventTemplates/EventTemplates';

// ── Template registry ────────────────────────────────────
const TEMPLATES = [
  {
    id: 'luxury',
    name: 'Luxury Gold',
    description: 'Elegant dark, gold accents',
    emoji: '✨',
    bg: '#12100e',
    Component: TemplateLuxury,
  },
  {
    id: 'festive',
    name: 'Festive',
    description: 'Vibrant celebration',
    emoji: '🎉',
    bg: '#fff8f3',
    Component: TemplateFestive,
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    description: 'Sharp modern typography',
    emoji: '🤍',
    bg: '#ffffff',
    Component: TemplateMinimal,
  },
  {
    id: 'bold',
    name: 'Bold & Bright',
    description: 'High energy, navy + red',
    emoji: '🔥',
    bg: '#1d3557',
    Component: TemplateBold,
  },
  {
    id: 'nature',
    name: 'Garden Fresh',
    description: 'Soft greens, organic',
    emoji: '🌿',
    bg: '#f0f7f4',
    Component: TemplateNature,
  },
  {
    id: 'midnight',
    name: 'Midnight Neon',
    description: 'Dark, electric glow',
    emoji: '⚡',
    bg: '#060910',
    Component: TemplateMidnight,
  },
  {
    id: 'retro',
    name: 'Retro Sunset',
    description: '70s warm retro vibes',
    emoji: '🌅',
    bg: '#fdf6ec',
    Component: TemplateRetro,
  },
  {
    id: 'rangoli',
    name: 'Fiesta Bright',
    description: 'Colorful Indian festival',
    emoji: '🌸',
    bg: '#fffbf0',
    Component: TemplateRangoli,
  },
  {
    id: 'sacred',
    name: 'Sacred Calm',
    description: 'Spiritual & religious',
    emoji: '🙏',
    bg: '#fdf8f0',
    Component: TemplateSacred,
  },
  {
    id: 'kids',
    name: 'Kids Party',
    description: 'Fun & playful for kids',
    emoji: '🎈',
    bg: '#fffdf0',
    Component: TemplateKids,
  },
];

// The template renders at `screenWidth` and we scale it to `thumbW`
const THUMB_SCALE_RATIO = 0.42; // thumb is 42% of screen width

export default function EventTemplatePickerScreen({route, navigation}) {
  const {event, allowedTemplateIds} = route?.params ?? {};
  const {width: screenW} = useWindowDimensions();

  const VISIBLE_TEMPLATES = useMemo(() => {
    if (!allowedTemplateIds || allowedTemplateIds.length === 0)
      return TEMPLATES;
    // Show allowed ones first, then rest dimmed
    const allowed = TEMPLATES.filter(t => allowedTemplateIds.includes(t.id));
    const rest = TEMPLATES.filter(t => !allowedTemplateIds.includes(t.id));
    return [...allowed, ...rest];
  }, [allowedTemplateIds]);

  const thumbW = screenW * THUMB_SCALE_RATIO;
  const thumbScale = thumbW / screenW;
  const templateNaturalH = screenW * 1.45; // estimated full template height
  const thumbH = templateNaturalH * thumbScale - 60;

  const [selectedId, setSelectedId] = useState(
    allowedTemplateIds?.[0] ?? TEMPLATES[0].id,
  );
  const [previewVisible, setPreviewVisible] = useState(false);
  const [sharing, setSharing] = useState(false);

  const viewShotRef = useRef(null);

  const selected = TEMPLATES.find(t => t.id === selectedId) ?? TEMPLATES[0];
  const SelectedComponent = selected.Component;

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture();

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(
        now.getHours(),
      ).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
        now.getSeconds(),
      ).padStart(2, '0')}`;
      const safeName = event?.name
        ? event.name
            .replace(/[^a-zA-Z0-9_\- ]/g, '')
            .trim()
            .replace(/\s+/g, '_')
        : 'Event';
      const fileName = `${safeName}_Invitation_${dateStr}.png`;

      const destPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.copyFile(uri, destPath);

      await RNShare.open({
        url: `file://${destPath}`,
        type: 'image/png',
        failOnCancel: false,
      });
    } catch (e) {
      if (e?.message !== 'User did not share') {
        NOTIFY_MESSAGE('Could not share. Please try again.');
      }
    } finally {
      setSharing(false);
    }
  }, [event]);

  const renderThumb = ({item: tpl}) => {
    const isActive = tpl.id === selectedId;
    const ThumbComp = tpl.Component;
    const isRecommended = allowedTemplateIds?.includes(tpl.id);
    const isDimmed = !!allowedTemplateIds && !isRecommended;

    // ── ADD THIS: calculate card width from screen ──
    const CARD_W = (screenW - 48) / 2;
    const CARD_H = templateNaturalH * (CARD_W / screenW) - 60;

    return (
      <TouchableOpacity
        key={tpl.id}
        style={[
          styles.thumbWrap,
          {flex: 1, height: CARD_H + 34, opacity: isDimmed ? 0.45 : 1}, // flex:1 instead of fixed width
          isActive && styles.thumbActive,
        ]}
        onPress={() => setSelectedId(tpl.id)}
        activeOpacity={0.82}>
        {/* Preview clip */}
        <View style={{overflow: 'hidden', height: CARD_H}}>
          {/* no fixed width */}
          <View
            style={{
              height: CARD_H,
              backgroundColor: tpl.bg,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: screenW,
                height: templateNaturalH,
                transform: [
                  {translateX: -(screenW * (1 - CARD_W / screenW)) / 2},
                  {
                    translateY:
                      -(templateNaturalH * (1 - CARD_W / screenW)) / 2,
                  },
                  {scale: CARD_W / screenW},
                ],
              }}
              pointerEvents="none">
              <ThumbComp event={event} />
            </View>
          </View>
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedTxt}>⭐ Best</Text>
            </View>
          )}
        </View>

        {/* Info row */}
        <View
          style={[
            styles.thumbInfo,
            {
              backgroundColor: isActive
                ? COLORS.LABELCOLOR
                : COLORS.PRIMARYWHITE,
            },
          ]}>
          <Text style={styles.thumbEmoji}>{tpl.emoji}</Text>
          <View style={{flex: 1}}>
            <Text
              style={[
                styles.thumbName,
                {color: isActive ? '#fff' : COLORS.PRIMARYBLACK},
              ]}
              numberOfLines={1}>
              {tpl.name}
            </Text>
          </View>
          {isActive && <Text style={styles.thumbCheckmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <CustomHeader
        leftOnPress={() => navigation.goBack()}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title="Choose Template"
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Template picker ── */}
        {allowedTemplateIds && (
          <Text style={styles.sectionSub}>
            ⭐ Recommended templates shown first
          </Text>
        )}
        <View style={styles.grid}>
          {VISIBLE_TEMPLATES.reduce((rows, tpl, i) => {
            if (i % 2 === 0) rows.push([tpl]);
            else rows[rows.length - 1].push(tpl);
            return rows;
          }, []).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map(tpl => renderThumb({item: tpl}))}
              {row.length === 1 && <View style={{flex: 1}} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Share button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => setPreviewVisible(true)}
          activeOpacity={0.85}>
          <Text style={styles.shareBtnIcon}>📤</Text>
          <Text style={styles.shareBtnTxt}>Preview and Share</Text>
        </TouchableOpacity>
      </View>

      {/* ── Full-screen preview modal ── */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.modalRoot}>
          {/* Close button — always visible white circle */}
          <View
            style={[
              styles.modalCloseRow,
              {top: Platform.OS === 'ios' ? 52 : 16},
            ]}>
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <View style={styles.modalCloseBg}>
                <Text style={styles.modalCloseTxt}>✕</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.modalTitleTxt} numberOfLines={1}>
              {selected.name}
            </Text>
          </View>

          {/* Template preview — scrollable, centered */}
          <ScrollView
            contentContainerStyle={[
              styles.modalScroll,
              {paddingTop: Platform.OS === 'ios' ? 100 : 72},
            ]}
            showsVerticalScrollIndicator={false}>
            <ViewShot
              ref={viewShotRef}
              options={{format: 'png', quality: 1.0}}
              style={{width: screenW}}>
              <SelectedComponent event={event} />
            </ViewShot>
          </ScrollView>

          {/* Share button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.85}>
              {sharing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.shareBtnIcon}>📤</Text>
                  <Text style={styles.shareBtnTxt}>
                    Download & Share This Template
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 100},
  // ── Grid ──
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sectionSub: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    marginHorizontal: 16,
    marginBottom: 10,
    includeFontPadding: false,
  },
  recommendedTxt: {
    fontSize: 9,
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    includeFontPadding: false,
  },

  // ── Section title ──
  sectionTitle: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    marginHorizontal: 16,
  },

  // ── Thumbnail ──
  thumbList: {paddingHorizontal: 16, gap: 10, paddingBottom: 4},
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  thumbActive: {borderColor: COLORS.LABELCOLOR},
  thumbClip: {overflow: 'hidden'},
  thumbInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 7,
    minHeight: 32,
  },
  thumbEmoji: {fontSize: 15},
  thumbName: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
  thumbDesc: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    includeFontPadding: false,
  },
  thumbCheckmark: {
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.BOLD,
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
  },
  shareBtn: {
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.LABELCOLOR,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  shareBtnIcon: {fontSize: 17},
  shareBtnTxt: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#fff',
    includeFontPadding: false,
  },

  // ── Modal ──
  modalRoot: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalCloseRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCloseBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff', // always white — visible on any template bg
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  modalCloseTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#111', // dark text on white bg — always readable
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    includeFontPadding: false,
  },
  modalTitleTxt: {
    flex: 1,
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
    includeFontPadding: false,
  },
  modalScroll: {
    paddingBottom: 110,
    // No alignItems here — ViewShot must be full width for correct capture
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: 'rgba(10,10,10,0.94)',
  },
});
