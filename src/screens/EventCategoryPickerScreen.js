// src/screens/EventCategoryPickerScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import CustomHeader from '../components/root/CustomHeader';

// ── Category definitions ─────────────────────────────────
// Each category has: id, label, emoji, gradient colors,
// keywords (used to auto-detect from event name),
// and templateIds (which templates from EventTemplates.js suit this category)
const CATEGORIES = [
  {
    id: 'cultural',
    label: 'Cultural & Festivals',
    emoji: '🎊',
    colors: ['#f06a1a', '#f5a623'],
    bg: '#fff5ee',
    description: 'Holi, Navratri, Garba, Janmastami & more',
    keywords: [
      'holi',
      'dhuleti',
      'navratri',
      'garba',
      'janmastami',
      'diwali',
      'eid',
      'christmas',
      'festival',
      'cultural',
      'aatham',
      'onam',
      'pongal',
      'bihu',
      'baisakhi',
    ],
    // templateIds: ['festive', 'retro', 'luxury'],
    templateIds: ['rangoli', 'festive', 'retro', 'luxury'],
  },
  {
    id: 'religious',
    label: 'Religious & Spiritual',
    emoji: '🙏',
    colors: ['#7c3aed', '#a855f7'],
    bg: '#f5f0ff',
    description: 'Temple events, pooja, spiritual gatherings',
    keywords: [
      'temple',
      'pooja',
      'puja',
      'prayer',
      'mandir',
      'church',
      'mosque',
      'gurudwara',
      'spiritual',
      'religious',
      'someshvara',
      'somsvara',
      'janmastami',
      'navratri',
    ],
    // templateIds: ['minimal', 'luxury', 'nature'],
    templateIds: ['sacred', 'luxury', 'minimal', 'nature'],
  },
  {
    id: 'family',
    label: 'Family & Kids',
    emoji: '👨‍👩‍👧‍👦',
    colors: ['#0ea5e9', '#38bdf8'],
    bg: '#f0f9ff',
    description: 'Kids events, family outings, school activities',
    keywords: [
      'kids',
      'children',
      'bowling',
      'zoo',
      'family',
      'birthday',
      'school',
      'picnic',
      'playground',
      'park',
      'mother',
      'father',
      'parents',
      'day',
    ],
    // templateIds: ['bold', 'festive', 'nature'],
    templateIds: ['kids', 'festive', 'nature', 'bold'],
  },
  {
    id: 'outdoor',
    label: 'Outdoor & Nature',
    emoji: '🌿',
    colors: ['#16a34a', '#4ade80'],
    bg: '#f0fdf4',
    description: 'Treks, zoo visits, outdoor activities',
    keywords: [
      'zoo',
      'trek',
      'hike',
      'nature',
      'outdoor',
      'garden',
      'park',
      'picnic',
      'camp',
      'adventure',
      'asheboro',
      'wildlife',
    ],
    templateIds: ['nature', 'retro', 'minimal'],
  },
  {
    id: 'holidays',
    label: 'Holidays & Occasions',
    emoji: '🎁',
    colors: ['#dc2626', '#f87171'],
    bg: '#fff5f5',
    description: "Mother's Day, Father's Day, special occasions",
    keywords: [
      "mother's",
      "father's",
      'mothers',
      'fathers',
      'valentine',
      'halloween',
      'thanksgiving',
      'new year',
      'anniversary',
      'occasion',
      'holiday',
      'celebration',
    ],
    templateIds: ['retro', 'festive', 'luxury'],
  },
  {
    id: 'sports',
    label: 'Sports & Recreation',
    emoji: '🎳',
    colors: ['#0891b2', '#22d3ee'],
    bg: '#f0fdff',
    description: 'Bowling, games, sports tournaments',
    keywords: [
      'bowling',
      'cricket',
      'football',
      'soccer',
      'basketball',
      'tournament',
      'sports',
      'game',
      'match',
      'league',
      'gym',
      'fitness',
      'race',
      'marathon',
    ],
    templateIds: ['bold', 'midnight', 'retro'],
  },
  {
    id: 'party',
    label: 'Party & Social',
    emoji: '🎉',
    colors: ['#db2777', '#f472b6'],
    bg: '#fff0f8',
    description: 'Birthday parties, get-togethers, reunions',
    keywords: [
      'party',
      'birthday',
      'reunion',
      'gathering',
      'social',
      'meetup',
      'hangout',
      'get together',
      'bash',
      'fiesta',
      'celebration',
    ],
    templateIds: ['midnight', 'bold', 'festive'],
  },
  {
    id: 'professional',
    label: 'Professional & Community',
    emoji: '🏛️',
    colors: ['#1d4ed8', '#60a5fa'],
    bg: '#eff6ff',
    description: 'Town halls, community drives, meetings',
    keywords: [
      'town hall',
      'meeting',
      'community',
      'seminar',
      'conference',
      'workshop',
      'cleanup',
      'drive',
      'volunteer',
      'charity',
      'fundraiser',
      'business',
    ],
    templateIds: ['minimal', 'bold', 'luxury'],
  },
];

// ── Auto-detect category from event name ─────────────────
function detectCategory(eventName) {
  if (!eventName) return null;
  const lower = eventName.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    const score = cat.keywords.filter(k => lower.includes(k)).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat.id;
    }
  }
  return bestScore > 0 ? bestMatch : null;
}

export default function EventCategoryPickerScreen({route, navigation}) {
  const {event} = route?.params ?? {};
  const {width} = useWindowDimensions();

  const CARD_W = (width - 48) / 2; // 2 columns with padding

  // Auto-detect and pre-select category
  const [selectedId, setSelectedId] = useState(() =>
    detectCategory(event?.name),
  );

  const handleContinue = () => {
    const cat = CATEGORIES.find(c => c.id === selectedId);
    navigation.navigate('EventTemplates', {
      event,
      categoryId: selectedId,
      allowedTemplateIds: cat?.templateIds ?? null,
    });
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
        title="Choose Category"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header info */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>
            What kind of event is{' '}
            <Text style={styles.headerEventName}>{event?.name ?? 'this'}</Text>?
          </Text>
          <Text style={styles.headerSub}>
            We'll show you the best matching templates
          </Text>
          {selectedId && (
            <View style={styles.autoDetectBadge}>
              <Text style={styles.autoDetectTxt}>
                ✨ Auto-detected from event name
              </Text>
            </View>
          )}
        </View>

        {/* Category grid */}
        <View style={styles.grid}>
          {CATEGORIES.map(cat => {
            const isSelected = cat.id === selectedId;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.card,
                  {borderColor: cat.colors[0]},
                  {width: CARD_W, backgroundColor: cat.bg},
                  isSelected && styles.cardSelected,
                  isSelected && {borderColor: cat.colors[0]},
                ]}
                onPress={() => setSelectedId(cat.id)}
                activeOpacity={0.82}>
                {/* Color band at top */}
                <View
                  style={[
                    styles.cardBand,
                    {
                      backgroundColor: cat.colors[0],
                    },
                  ]}>
                  <Text style={styles.cardEmoji}>{cat.emoji}</Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkTxt}>✓</Text>
                    </View>
                  )}
                </View>

                {/* Card content */}
                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.cardLabel,
                      isSelected && {color: cat.colors[0]},
                    ]}
                    numberOfLines={2}>
                    {cat.label}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {cat.description}
                  </Text>
                  <View style={styles.templateCount}>
                    <Text
                      style={[styles.templateCountTxt, {color: cat.colors[0]}]}>
                      {cat.templateIds.length} templates
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{height: 80}} />
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        {selectedId ? (
          // REPLACE the TouchableOpacity content:
          <TouchableOpacity
            style={[
              styles.continueBtn,
              {
                backgroundColor:
                  CATEGORIES.find(c => c.id === selectedId)?.colors[0] ??
                  COLORS.LABELCOLOR,
              },
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}>
            <Text
              style={styles.continueBtnTxt}
              numberOfLines={1}
              adjustsFontSizeToFit>
              View Templates for{' '}
              {CATEGORIES.find(c => c.id === selectedId)?.label} →
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.continueBtnDisabled}>
            <Text style={styles.continueBtnDisabledTxt}>
              Select a category to continue
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 20},
  // ── Header ──
  headerBox: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
  },
  headerEventName: {
    color: COLORS.LABELCOLOR,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
  },
  headerSub: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    marginBottom: 8,
  },
  autoDetectBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  autoDetectTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#ea580c',
    includeFontPadding: false,
  },

  // ── Grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },

  // ── Card ──
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    backgroundColor: '#fff',
    marginBottom: 0,
  },
  cardSelected: {
    borderWidth: 2.5,
  },
  cardBand: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardEmoji: {
    fontSize: 36,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTxt: {
    fontSize: 12,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#16a34a',
    includeFontPadding: false,
  },
  cardBody: {
    padding: 10,
  },
  cardLabel: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.PRIMARYBLACK,
    marginBottom: 3,
    lineHeight: 18,
    includeFontPadding: false,
  },
  cardDesc: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    lineHeight: 15,
    marginBottom: 6,
    includeFontPadding: false,
  },
  templateCount: {
    alignSelf: 'flex-start',
  },
  templateCountTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
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
  continueBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16, // ← add this
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnTxt: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#fff',
    includeFontPadding: false,
    textAlign: 'center', // ← add this
  },
  continueBtnArrow: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#fff',
    includeFontPadding: false,
  },
  continueBtnDisabled: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.TABLEBORDER,
  },
  continueBtnDisabledTxt: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
});
