import React, {useState, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import FONTS from '../../../theme/Fonts';
import {IMAGE_URL} from '../../../connection/Config';
import COLORS from '../../../theme/Color';

const GOLD_BORDER = '#E8C87A';

const TIER_CONFIG = {
  'Grand Sponsor': {
    emoji: '💎',
    order: 0,
    tabLabel: 'Grand',
    iconBg: COLORS.TABLEROW,
  },
  'Platinum Sponsor': {
    emoji: '🥇',
    order: 1,
    tabLabel: 'Platinum',
    iconBg: '#E0E0E0',
  },
  'Gold Sponsor': {emoji: '🏅', order: 2, tabLabel: 'Gold', iconBg: '#f9edbf'},
  'Silver Sponsor': {
    emoji: '🥈',
    order: 3,
    tabLabel: 'Silver',
    iconBg: '#F0F0F0',
  },
};
const getTierConf = t =>
  TIER_CONFIG[t] || {emoji: '🏷️', order: 99, tabLabel: t, iconBg: '#F5F5F5'};

function SponsorLogo({sponsor, size, radius, bgColor, textColor}) {
  const [failed, setFailed] = useState(false);
  const r = radius != null ? radius : size * 0.2;
  if (sponsor.logo && !failed) {
    return (
      <FastImage
        source={{
          uri: `${IMAGE_URL}${sponsor.logo}`,
          cache: FastImage.cacheControl.immutable,
          priority: FastImage.priority.normal,
        }}
        style={{width: size, height: size, borderRadius: r}}
        resizeMode={FastImage.resizeMode.contain}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: bgColor || '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          fontSize: size * 0.28,
          fontFamily: FONTS.FONT_FAMILY.BOLD,
          color: textColor || COLORS.TITLECOLOR,
        }}>
        {sponsor.initials ||
          (sponsor.name ? sponsor.name.slice(0, 2).toUpperCase() : '?')}
      </Text>
    </View>
  );
}

function parseSponsors(rawData) {
  return rawData
    .map(record => {
      let content = {};
      try {
        content = JSON.parse(record.content);
      } catch {}

      const businessName = content?.businessName?.value || '';
      const tier = content?.grandSponsors?.value || '';
      const description = content?.shortBusinessDescription?.value || null;
      const website = content?.websiteLink?.value || null;

      let logoPath = null;
      try {
        const picRaw = content?.picture?.value;
        if (picRaw && picRaw !== '[]') {
          const picArr = JSON.parse(picRaw);
          if (picArr?.length > 0) logoPath = picArr[0];
        }
      } catch {}

      return {
        id: record.configurationId,
        name: businessName,
        description,
        tier,
        logo: logoPath,
        website,
        initials: businessName
          .split(' ')
          .map(w => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 3),
      };
    })
    .filter(s => s.name && s.tier);
}

/* ── Main component ── */
const SponserLayout = ({data: rawData = [], item = {}}) => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('all');

  /* render all records received from ViewScreen (server-side pagination) */
  const data = useMemo(() => parseSponsors(rawData), [rawData]);

  const openUrl = url => {
    const link = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(link);
  };

  /* group and sort by tier order */
  const groupedTiers = useMemo(() => {
    const map = {};
    data.forEach(s => {
      if (!map[s.tier]) {
        map[s.tier] = [];
      }
      map[s.tier].push(s);
    });
    return Object.entries(map).sort(
      ([a], [b]) => getTierConf(a).order - getTierConf(b).order,
    );
  }, [data]);

  const renderGrandCard = s => (
    <View key={s.id} style={styles.grandCard}>
      <View style={styles.grandTopBar} />
      <View style={styles.grandLogoRow}>
        <View style={styles.grandLogoWrap}>
          <SponsorLogo
            sponsor={s}
            size={66}
            radius={12}
            bgColor="#fff"
            textColor={COLORS.TITLECOLOR}
          />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.grandName}>{s.name}</Text>
          {s.description && (
            <Text style={styles.grandTagline} numberOfLines={2}>
              {s.description}
            </Text>
          )}
          <View style={styles.grandBadgePill}>
            <Text style={styles.grandBadgeText}>💎 {s.tier}</Text>
          </View>
        </View>
      </View>
      {s.website && (
        <TouchableOpacity
          style={styles.grandCta}
          onPress={() => openUrl(s.website)}>
          <Text style={styles.grandCtaText}>Visit Website →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPlatinumCard = s => (
    <View key={s.id} style={styles.platCard}>
      <View style={styles.platTopBar} />
      <View style={styles.platRow}>
        <View style={styles.platLogoWrap}>
          <SponsorLogo
            sponsor={s}
            size={52}
            radius={10}
            bgColor={'white'}
            textColor={COLORS.TITLECOLOR}
          />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.platName}>{s.name}</Text>
          {s.description && (
            <Text style={styles.platDesc} numberOfLines={2}>
              {s.description}
            </Text>
          )}
          <View style={styles.platBadgePill}>
            <Text style={styles.platBadgeText}>🥇 {s.tier}</Text>
          </View>
        </View>
      </View>
      {s.website && (
        <TouchableOpacity
          style={styles.platCta}
          onPress={() => openUrl(s.website)}>
          <Text style={styles.platCtaText}>Visit Website →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderGoldCard = s => (
    <View style={styles.goldCard}>
      <View style={styles.goldTopBar} />
      <View style={styles.goldLogoWrap}>
        <SponsorLogo
          sponsor={s}
          size={44}
          radius={8}
          bgColor="#FFFBEC"
          textColor={COLORS.TITLECOLOR}
        />
      </View>
      <Text style={styles.goldName} numberOfLines={2}>
        {s.name}
      </Text>
      {s.description && (
        <Text style={styles.goldDesc} numberOfLines={2}>
          {s.description}
        </Text>
      )}
      <View style={styles.goldBadgePill}>
        <Text style={styles.goldBadgeText}>🏅 {s.tier}</Text>
      </View>
      {s.website && (
        <TouchableOpacity onPress={() => openUrl(s.website)}>
          <Text style={styles.goldLink}>Visit →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSilverCard = s => (
    <View key={s.id} style={styles.silverCard}>
      <View style={styles.silverLogoWrap}>
        <SponsorLogo
          sponsor={s}
          size={42}
          radius={10}
          bgColor="#F8F8F8"
          textColor={COLORS.TITLECOLOR}
        />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.silverName}>{s.name}</Text>
        {s.description ? (
          <Text style={styles.silverDesc}>{s.description}</Text>
        ) : null}
        <View style={styles.silverBadgePill}>
          <Text style={styles.silverBadgeText}>🥈 {s.tier}</Text>
        </View>
      </View>
      {s.website ? (
        <TouchableOpacity onPress={() => openUrl(s.website)}>
          <Text style={styles.silverLink}>Visit →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderCard = s => {
    if (s.tier === 'Grand Sponsor') return renderGrandCard(s);
    if (s.tier === 'Platinum Sponsor') return renderPlatinumCard(s);
    if (s.tier === 'Gold Sponsor') return renderGoldCard(s);
    return renderSilverCard(s);
  };

  const renderTierSection = ([tier, list]) => {
    const conf = getTierConf(tier);
    const isGold = tier === 'Gold Sponsor';
    return (
      <View
        key={tier}
        style={[
          styles.tierBlock,
          activeTab !== 'all' && styles.tierBlockTabPadding,
        ]}>
        {activeTab === 'all' && (
          <>
            <View style={styles.tierHeader}>
              <View
                style={[styles.tierIconWrap, {backgroundColor: conf.iconBg}]}>
                <Text style={{fontSize: FONTS.FONTSIZE.MEDIUM}}>
                  {conf.emoji}
                </Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.tierName}>{tier}</Text>
                <Text style={styles.tierCount}>
                  {list.length} {list.length === 1 ? 'Partner' : 'Partners'}
                </Text>
              </View>
            </View>
            <View style={styles.tierDivider} />
          </>
        )}
        {isGold ? (
          <View style={styles.goldGrid}>
            {list.map(s => (
              <View key={s.id} style={styles.goldCardWrapper}>
                {renderGoldCard(s)}
              </View>
            ))}
          </View>
        ) : (
          list.map(s => renderCard(s))
        )}
      </View>
    );
  };

  const tabContent = useMemo(() => {
    if (activeTab === 'all') return groupedTiers;
    return groupedTiers.filter(([tier]) => tier === activeTab);
  }, [activeTab, groupedTiers]);

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <FontAwesome6
            name="angle-left"
            size={20}
            color="#fff"
            iconStyle="solid"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item?.name || 'Sponsors'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* ── Hero text ── */}
      <View style={styles.heroSection}>
        <Text style={styles.heroSub}>PROUDLY SUPPORTED BY</Text>
        <Text style={styles.heroHeadline}>
          Community partners who make Moti Falod events possible
        </Text>
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabsWrap}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'all' && styles.tabTextActive,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            All Sponsors
          </Text>
        </TouchableOpacity>
        {groupedTiers.map(([tier]) => {
          const conf = getTierConf(tier);
          return (
            <TouchableOpacity
              key={tier}
              style={[styles.tab, activeTab === tier && styles.tabActive]}
              onPress={() => setActiveTab(tier)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tier && styles.tabTextActive,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {conf.emoji} {conf.tabLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        {tabContent.map(renderTierSection)}

        {activeTab === 'all' && (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Become a Sponsor</Text>
            <Text style={styles.ctaSub}>
              Support the community of Moti Falod and grow your business
            </Text>
            <View style={styles.ctaTiers}>
              {[
                {
                  label: '💎 Grand',
                  border: '#F4A820',
                  bg: '#FFF3DC',
                  text: '#8B6914',
                },
                {
                  label: '🥇 Platinum',
                  border: '#C0C0C0',
                  bg: '#F0F0F0',
                  text: '#4A4A4A',
                },
                {
                  label: '🏅 Gold',
                  border: '#F0C040',
                  bg: '#FFF8DC',
                  text: '#8B6914',
                },
              ].map(t => (
                <View
                  key={t.label}
                  style={[
                    styles.ctaTierPill,
                    {borderColor: t.border, backgroundColor: t.bg},
                  ]}>
                  <Text style={[styles.ctaTierText, {color: t.text}]}>
                    {t.label}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => {
                navigation.navigate('Form', {
                  data: {
                    item: {
                      ...item,
                      constantName: 'CONTACT US',
                      name: 'Contact Us',
                    },
                    isTabView: true,
                  },
                });
              }}>
              <Text style={styles.ctaBtnText}>Contact Us →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SponserLayout;

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  headerBar: {
    backgroundColor: COLORS.TITLECOLOR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    paddingHorizontal: 8,
  },
  headerRight: {width: 36},
  heroSection: {
    backgroundColor: COLORS.TITLECOLOR,
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroHeadline: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    textAlign: 'center',
    maxWidth: 350,
  },
  tabsWrap: {
    backgroundColor: COLORS.TITLECOLOR,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: '#F4A820',
    borderRadius: 8,
  },
  tabText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    includeFontPadding: false,
    textAlign: 'center',
  },
  tabTextActive: {color: '#fff'},
  content: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  contentContainer: {paddingBottom: 28},
  tierBlock: {paddingHorizontal: 14, paddingBottom: 6},
  tierBlockTabPadding: {paddingTop: 16},
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  tierIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.TITLECOLOR,
  },
  tierCount: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: COLORS.LABELCOLOR,
    marginTop: 0,
  },
  tierDivider: {height: 1, backgroundColor: COLORS.TABLEBORDER, marginBottom: 12},
  grandCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F4A820',
  },
  grandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  grandLogoWrap: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F4A820',
    flexShrink: 0,
    overflow: 'hidden',
  },
  grandName: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  grandTagline: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: COLORS.LABELCOLOR,
    marginTop: 3,
  },
  grandBadgePill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f4a6201b',
    borderWidth: 1,
    borderColor: '#F4A820',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  grandTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#F4A820',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  grandBadgeText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#8B6914',
    includeFontPadding: false,
  },
  grandCta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4A82033',
    alignItems: 'center',
  },
  grandCtaText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.TITLECOLOR,
    includeFontPadding: false,
  },
  platCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#D0CCC8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  platTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#BDBDBD',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  platRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  platLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  platName: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  platDesc: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: COLORS.LABELCOLOR,
    marginTop: 2,
  },
  platBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 5,
  },
  platBadgeText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#4A4A4A',
    includeFontPadding: false,
  },
  platCta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  platCtaText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.TITLECOLOR,
    includeFontPadding: false,
  },
  goldGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4},
  goldCardWrapper: {width: '48.5%'},
  goldCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: GOLD_BORDER,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
    flex: 1,
  },
  goldTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#F0C040',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  goldLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0C040',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  goldName: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  goldDesc: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    color: COLORS.LABELCOLOR,
    marginTop: 3,
  },
  goldBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#F0C040',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  goldBadgeText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#8B6914',
    includeFontPadding: false,
  },
  goldLink: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.TITLECOLOR,
    marginTop: 8,
    includeFontPadding: false,
  },
  silverCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  silverLogoWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  silverName: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: COLORS.TITLECOLOR,
  },
  silverDesc: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    color: COLORS.LABELCOLOR,
    marginTop: 2,
  },
  silverBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  silverBadgeText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#5A5A5A',
  },
  silverLink: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.TITLECOLOR,
    marginTop: 4,
  },
  ctaCard: {
    marginHorizontal: 14,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3af8f',
  },
  ctaTitle: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    marginBottom: 6,
  },
  ctaSub: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    textAlign: 'center',
    marginBottom: 14,
  },
  ctaTiers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  ctaTierPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ctaTierText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    includeFontPadding: false,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    includeFontPadding: false,
  },
});
