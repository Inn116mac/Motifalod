// src/components/eventTemplates/EventTemplates.js
import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import FONTS from '../../theme/Fonts';

// ── Shared helper ────────────────────────────────────────
function getEventLines(event) {
  return [
    {
      icon: '📅',
      value: [
        event?.date,
        event?.time,
        event?.endTime ? `– ${event.endTime}` : null,
      ]
        .filter(Boolean)
        .join('  '),
    },
    {
      icon: '📍',
      value: [event?.venue, event?.location].filter(Boolean).join(', '),
    },
    {icon: '👤', value: event?.eventCoordinator},
  ].filter(l => l.value);
}

// ─────────────────────────────────────────────────────────
// TEMPLATE 1: LUXURY GOLD
// ─────────────────────────────────────────────────────────
export function TemplateLuxury({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[lux.card, {width}]}>
      <View style={lux.topOrnament}>
        <View style={lux.ornLine} />
        <Text style={lux.ornDiamond}>◆</Text>
        <View style={lux.ornLine} />
      </View>

      <Text style={lux.subheading}>— YOU ARE CORDIALLY INVITED —</Text>
      <Text style={lux.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>
      <View style={lux.divider} />

      {lines.map((l, i) => (
        <View key={i} style={lux.lineRow}>
          <Text style={lux.lineIcon}>{l.icon}</Text>
          <Text style={lux.lineValue}>{l.value}</Text>
        </View>
      ))}

      {!!event?.details && (
        <Text style={lux.details} numberOfLines={4}>
          {event.details}
        </Text>
      )}
      {!!event?.messagefromtheHost && (
        <Text style={lux.hostMsg} numberOfLines={3}>
          "{event.messagefromtheHost}"
        </Text>
      )}

      <View style={lux.bottomOrnament}>
        <View style={lux.ornLine} />
        <Text style={lux.ornDiamond}>◆ ◆ ◆</Text>
        <View style={lux.ornLine} />
      </View>

      {event?.isRSVPEnable === 'Yes' && (
        <View style={lux.rsvpStrip}>
          <Text style={lux.rsvpTxt}>RSVP by {event.rsvpenddate}</Text>
        </View>
      )}
    </View>
  );
}

const lux = StyleSheet.create({
  card: {
    // width set dynamically above
    backgroundColor: '#12100e',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 50,
    paddingBottom: 60,
  },
  topOrnament: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  ornLine: {flex: 1, height: 1, backgroundColor: '#c9a84c66'},
  ornDiamond: {
    color: '#c9a84c',
    fontSize: FONTS.FONTSIZE.SMALL,
    marginHorizontal: 10,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  subheading: {
    color: '#c9a84c',
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 3,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    marginBottom: 20,
    textAlign: 'center',
  },
  eventName: {
    color: '#f5e6c8',
    fontSize: FONTS.FONTSIZE.BIGLARGE,
    fontFamily: FONTS.FONT_FAMILY.LIGHT,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 28,
  },
  divider: {width: 60, height: 2, backgroundColor: '#c9a84c', marginBottom: 28},
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  lineIcon: {fontSize: FONTS.FONTSIZE.SMALL},
  lineValue: {
    color: '#d4c5a9',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.LIGHT,
    letterSpacing: 0.3,
    flex: 1,
  },
  details: {
    color: '#9a8c7a',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
    width: '100%',
  },
  hostMsg: {
    color: '#c9a84c99',
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
    textAlign: 'center',
    marginTop: 20,
    width: '100%',
  },
  bottomOrnament: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
  },
  rsvpStrip: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#c9a84c66',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  rsvpTxt: {
    color: '#c9a84c',
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 2.5,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 2: FESTIVE
// ─────────────────────────────────────────────────────────
export function TemplateFestive({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[fest.card, {width}]}>
      <View style={[fest.circle, fest.circleTopLeft]} />
      <View style={[fest.circle, fest.circleTopRight]} />
      <View style={[fest.circle, fest.circleBotRight]} />

      <View style={[fest.headerBand, {width}]}>
        <Text style={fest.headerEmoji}>🎉 🥳 🎊</Text>
        <Text style={fest.headerTxt}>CELEBRATE WITH US</Text>
      </View>

      <Text style={fest.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>
      <Text style={fest.waveDivider}>〰〰〰〰〰〰〰〰</Text>

      <View style={fest.pills}>
        {lines.map((l, i) => (
          <View key={i} style={fest.pill}>
            <Text style={fest.pillIcon}>{l.icon}</Text>
            <Text style={fest.pillTxt} numberOfLines={2}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>

      {!!event?.details && (
        <View style={fest.messageBubble}>
          <Text style={fest.messageTxt} numberOfLines={4}>
            {event.details}
          </Text>
        </View>
      )}

      <View style={fest.footer}>
        <Text style={fest.footerTxt}>We can't wait to see you! 🎈</Text>
        {event?.isRSVPEnable === 'Yes' && (
          <View style={fest.rsvpBadge}>
            <Text style={fest.rsvpTxt}>RSVP by {event.rsvpenddate}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const fest = StyleSheet.create({
  card: {
    backgroundColor: '#fff8f3',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 50,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#f06a1a22',
  },
  circleTopLeft: {width: 180, height: 180, top: -60, left: -60},
  circleTopRight: {width: 120, height: 120, top: -30, right: -20},
  circleBotRight: {width: 200, height: 200, bottom: -80, right: -60},
  headerBand: {
    backgroundColor: '#f06a1a',
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {fontSize: 22, marginBottom: 4, marginTop: 6},
  headerTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 3,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
  },
  eventName: {
    color: '#1a1208',
    fontSize: FONTS.FONTSIZE.BIGLARGE,
    fontFamily: FONTS.FONT_FAMILY.EXTRA_BOLD,
    textAlign: 'center',
    marginBottom: 12,
  },
  waveDivider: {
    color: '#f06a1a88',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    marginBottom: 24,
    letterSpacing: -2,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  pills: {width: '100%', gap: 10, marginBottom: 20},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    elevation: 2,
  },
  pillIcon: {fontSize: 16},
  pillTxt: {
    flex: 1,
    color: '#3d2b1a',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  messageBubble: {
    backgroundColor: '#fff3eb',
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#f06a1a',
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  messageTxt: {
    color: '#5a3a1a',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
  },
  footer: {alignItems: 'center', gap: 14},
  footerTxt: {
    color: '#f06a1a',
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  rsvpBadge: {
    backgroundColor: '#f06a1a',
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  rsvpTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    letterSpacing: 1,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 3: CLEAN MINIMAL
// ─────────────────────────────────────────────────────────
export function TemplateMinimal({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[min.card, {width}]}>
      <View style={min.accentBar} />
      <View style={min.body}>
        <Text style={min.label}>INVITATION</Text>
        <Text style={min.eventName} numberOfLines={3}>
          {event?.name ?? 'Your Event'}
        </Text>
        <View style={min.separator} />

        {lines.map((l, i) => (
          <View key={i} style={min.row}>
            <Text style={min.rowIcon}>{l.icon}</Text>
            <Text style={min.rowValue}>{l.value}</Text>
          </View>
        ))}

        {!!event?.details && (
          <>
            <View style={min.separator} />
            <Text style={min.detailsLabel}>NOTE</Text>
            <Text style={min.detailsTxt} numberOfLines={5}>
              {event.details}
            </Text>
          </>
        )}
        {!!event?.messagefromtheHost && (
          <Text style={min.hostMsg} numberOfLines={3}>
            "{event.messagefromtheHost}"
          </Text>
        )}
      </View>
      <View style={min.bottomRow}>
        <View style={min.bottomLine} />
        {event?.isRSVPEnable === 'Yes' && (
          <Text style={min.rsvpTxt}>RSVP · {event.rsvpenddate}</Text>
        )}
        <View style={min.bottomLine} />
      </View>
    </View>
  );
}

const min = StyleSheet.create({
  card: {backgroundColor: '#fff'},
  accentBar: {height: 8, backgroundColor: '#111'},
  body: {paddingHorizontal: 40, paddingTop: 48, paddingBottom: 32},
  label: {
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 5,
    color: '#aaa',
    marginBottom: 14,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  eventName: {
    fontSize: FONTS.FONTSIZE.EXTRALARGE,
    fontFamily: FONTS.FONT_FAMILY.BLACK,
    color: '#111',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  separator: {height: 1, backgroundColor: '#eee', marginVertical: 20},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  rowIcon: {fontSize: FONTS.FONTSIZE.MEDIUM},
  rowValue: {
    flex: 1,
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#444',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  detailsLabel: {
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 4,
    color: '#aaa',
    marginBottom: 8,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  detailsTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#666',
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
  },
  hostMsg: {
    marginTop: 20,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: '#222',
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
    gap: 12,
  },
  bottomLine: {flex: 1, height: 1, backgroundColor: '#ddd'},
  rsvpTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 2.5,
    color: '#888',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 4: BOLD & BRIGHT
// ─────────────────────────────────────────────────────────
export function TemplateBold({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[bld.card, {width}]}>
      <View style={bld.bgShape} />
      <View style={bld.bgShapeBottom} />

      <View style={bld.header}>
        <View style={bld.headerTag}>
          <Text style={bld.headerTagTxt}>EVENT</Text>
        </View>
        <Text style={bld.eventName} numberOfLines={3}>
          {event?.name ?? 'Your Event'}
        </Text>
      </View>

      <View style={[bld.redStrip, {width}]}>
        {lines.slice(0, 1).map((l, i) => (
          <Text key={i} style={bld.stripTxt}>
            {l.icon} {l.value}
          </Text>
        ))}
      </View>

      <View style={bld.detailsGrid}>
        {lines.map((l, i) => (
          <View key={i} style={bld.detailBlock}>
            <Text style={bld.detailBlockIcon}>{l.icon}</Text>
            <Text style={bld.detailBlockTxt} numberOfLines={3}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>

      {!!event?.details && (
        <View style={bld.msgBlock}>
          <Text style={bld.msgTxt} numberOfLines={4}>
            {event.details}
          </Text>
        </View>
      )}

      <View style={[bld.footer, {width}]}>
        <Text style={bld.footerTxt}>JOIN US</Text>
        {event?.isRSVPEnable === 'Yes' && (
          <Text style={bld.rsvpTxt}>RSVP by {event.rsvpenddate}</Text>
        )}
      </View>
    </View>
  );
}

const bld = StyleSheet.create({
  card: {
    backgroundColor: '#1d3557',
    overflow: 'hidden',
    paddingBottom: 0,
  },
  bgShape: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#457b9d22',
    top: -100,
    right: -80,
  },
  bgShapeBottom: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e6394622',
    bottom: 30,
    left: -60,
  },
  header: {paddingHorizontal: 28, paddingTop: 52, paddingBottom: 24},
  headerTag: {
    backgroundColor: '#e63946',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  headerTagTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 4,
    fontFamily: FONTS.FONT_FAMILY.EXTRA_BOLD,
  },
  eventName: {
    color: '#f1faee',
    fontSize: FONTS.FONTSIZE.BIGLARGE,
    fontFamily: FONTS.FONT_FAMILY.BLACK,
    letterSpacing: -1,
  },
  redStrip: {
    backgroundColor: '#e63946',
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 28,
  },
  stripTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    letterSpacing: 0.5,
  },
  detailsGrid: {paddingHorizontal: 28, gap: 18, marginBottom: 28},
  detailBlock: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  detailBlockIcon: {fontSize: 16, color: '#a8dadc'},
  detailBlockTxt: {
    flex: 1,
    color: '#a8dadc',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  msgBlock: {
    marginHorizontal: 28,
    borderLeftWidth: 3,
    borderLeftColor: '#e63946',
    paddingLeft: 14,
    marginBottom: 32,
  },
  msgTxt: {
    color: '#f1faee99',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
  },
  footer: {
    backgroundColor: '#457b9d',
    paddingHorizontal: 28,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.BLACK,
    letterSpacing: 3,
  },
  rsvpTxt: {
    color: '#f1faee88',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 5: GARDEN / NATURE
// ─────────────────────────────────────────────────────────
export function TemplateNature({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[nat.card, {width}]}>
      <View style={nat.topDecor}>
        <Text style={nat.leaf}>🌿</Text>
        <Text style={nat.leaf}>🌸</Text>
        <Text style={nat.leaf}>🌿</Text>
      </View>

      <View style={nat.badge}>
        <Text style={nat.badgeTxt}>AN INVITATION</Text>
      </View>

      <Text style={nat.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>
      <Text style={nat.botanical}>· ❀ · ❀ · ❀ ·</Text>

      {lines.map((l, i) => (
        <View key={i} style={nat.detailRow}>
          <View style={nat.detailDot} />
          <Text style={nat.detailTxt}>{l.value}</Text>
        </View>
      ))}

      {!!event?.details && (
        <View style={nat.messageCard}>
          <Text style={nat.messageTitle}>A NOTE FROM THE HOST</Text>
          <Text style={nat.messageTxt} numberOfLines={5}>
            {event.details}
          </Text>
        </View>
      )}

      <View style={nat.bottomDecor}>
        <Text style={nat.leaf}>🌿</Text>
        <View style={nat.bottomLine} />
        {event?.isRSVPEnable === 'Yes' && (
          <Text style={nat.rsvpTxt}>RSVP by {event.rsvpenddate}</Text>
        )}
        <View style={nat.bottomLine} />
        <Text style={nat.leaf}>🌿</Text>
      </View>
    </View>
  );
}

const nat = StyleSheet.create({
  card: {
    backgroundColor: '#f0f7f4',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 56,
  },
  topDecor: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 44,
    paddingBottom: 24,
  },
  leaf: {fontSize: 28},
  badge: {
    borderWidth: 1.5,
    borderColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 24,
  },
  badgeTxt: {
    color: '#2d6a4f',
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 4,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
  },
  eventName: {
    fontSize: FONTS.FONTSIZE.SEMILARGE,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#1b4332',
    textAlign: 'center',
    marginBottom: 16,
  },
  botanical: {
    color: '#2d6a4f',
    fontSize: FONTS.FONTSIZE.SMALL,
    letterSpacing: 4,
    marginBottom: 28,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    width: '100%',
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#52b788',
    marginTop: 7,
    flexShrink: 0,
  },
  detailTxt: {
    flex: 1,
    color: '#2d4a38',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  messageCard: {
    backgroundColor: '#d8f3dc',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 8,
    marginBottom: 28,
  },
  messageTitle: {
    fontSize: FONTS.FONTSIZE.MICRO,
    letterSpacing: 3,
    color: '#2d6a4f',
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    marginBottom: 8,
  },
  messageTxt: {
    color: '#1b4332',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
  },
  bottomDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginTop: 20,
  },
  bottomLine: {flex: 1, height: 1, backgroundColor: '#52b78860'},
  rsvpTxt: {
    color: '#2d6a4f',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 6: MIDNIGHT NEON
// ─────────────────────────────────────────────────────────
export function TemplateMidnight({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[mid.card, {width}]}>
      <View style={mid.glowLeft} />
      <View style={mid.glowRight} />

      <View style={mid.topBar}>
        <View style={mid.topBarLine} />
        <Text style={mid.topBarTxt}>◈ SPECIAL EVENT ◈</Text>
        <View style={mid.topBarLine} />
      </View>

      <Text style={mid.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>
      <View style={mid.neonLine} />

      <View style={mid.details}>
        {lines.map((l, i) => (
          <View key={i} style={mid.detailRow}>
            <View style={mid.detailTag}>
              <Text style={mid.detailIcon}>{l.icon}</Text>
            </View>
            <Text style={mid.detailTxt} numberOfLines={2}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>

      {!!event?.details && (
        <View style={mid.noteBox}>
          <Text style={mid.noteLabel}>// NOTE</Text>
          <Text style={mid.noteTxt} numberOfLines={4}>
            {event.details}
          </Text>
        </View>
      )}

      <View style={mid.footer}>
        <Text style={mid.footerLine}>━━━━━━━━━━━━━━━━━</Text>
        {event?.isRSVPEnable === 'Yes' ? (
          <Text style={mid.rsvpTxt}>RSVP DEADLINE {event.rsvpenddate}</Text>
        ) : (
          <Text style={mid.rsvpTxt}>YOU'RE INVITED</Text>
        )}
        <Text style={mid.footerLine}>━━━━━━━━━━━━━━━━━</Text>
      </View>
    </View>
  );
}

const mid = StyleSheet.create({
  card: {
    backgroundColor: '#060910',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 52,
    paddingBottom: 60,
    overflow: 'hidden',
  },
  glowLeft: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0ef',
    opacity: 0.06,
    top: 40,
    left: -80,
  },
  glowRight: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#a855f7',
    opacity: 0.09,
    top: 60,
    right: -60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 32,
  },
  topBarLine: {flex: 1, height: 1, backgroundColor: '#0ef4'},
  topBarTxt: {
    color: '#0ef',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    letterSpacing: 2,
  },
  eventName: {
    color: '#e0f7ff',
    fontSize: FONTS.FONTSIZE.BIGLARGE,
    fontFamily: FONTS.FONT_FAMILY.BLACK,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 16,
    textShadowColor: '#0ef',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 12,
  },
  neonLine: {
    width: 80,
    height: 2,
    backgroundColor: '#0ef',
    marginBottom: 32,
  },
  details: {width: '100%', gap: 14, marginBottom: 26},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailTag: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ef4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {fontSize: 16},
  detailTxt: {
    flex: 1,
    color: '#a0d8ef',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  noteBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#a855f744',
    borderRadius: 10,
    padding: 16,
    marginBottom: 28,
    backgroundColor: '#a855f70a',
  },
  noteLabel: {
    color: '#a855f7',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    letterSpacing: 2,
    marginBottom: 8,
  },
  noteTxt: {
    color: '#c4b5fd',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
  },
  footer: {width: '100%', alignItems: 'center', gap: 10},
  footerLine: {
    color: '#0ef3',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.LIGHT,
    letterSpacing: 2,
  },
  rsvpTxt: {
    color: '#0ef',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    letterSpacing: 3,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 7: RETRO SUNSET
// ─────────────────────────────────────────────────────────
export function TemplateRetro({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[ret.card, {width}]}>
      <View style={ret.sunWrap}>
        <View style={[ret.arc, ret.arc1]} />
        <View style={[ret.arc, ret.arc2]} />
        <View style={[ret.arc, ret.arc3]} />
        <View style={ret.sunCore} />
      </View>

      <View style={[ret.titleBlock, {width}]}>
        <Text style={ret.preTitle}>★ YOU ARE INVITED TO ★</Text>
        <Text style={ret.eventName} numberOfLines={3}>
          {event?.name ?? 'Your Event'}
        </Text>
      </View>

      <View style={[ret.stripes, {width}]}>
        {['#e07a5f', '#f2cc8f', '#81b29a', '#e07a5f', '#f2cc8f'].map((c, i) => (
          <View key={i} style={[ret.stripe, {backgroundColor: c}]} />
        ))}
      </View>

      <View style={ret.detailsWrap}>
        {lines.map((l, i) => (
          <View key={i} style={ret.detailRow}>
            <Text style={ret.detailIcon}>{l.icon}</Text>
            <Text style={ret.detailTxt} numberOfLines={2}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>

      {!!event?.details && (
        <View style={ret.noteWrap}>
          <Text style={ret.noteTxt} numberOfLines={5}>
            {event.details}
          </Text>
        </View>
      )}

      <View style={ret.bottomBadge}>
        <Text style={ret.bottomBadgeTxt}>
          {event?.isRSVPEnable === 'Yes'
            ? `RSVP by ${event.rsvpenddate}`
            : '— See You There —'}
        </Text>
      </View>
    </View>
  );
}

const ret = StyleSheet.create({
  card: {
    backgroundColor: '#fdf6ec',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 50,
  },
  sunWrap: {
    width: 220,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  arc: {position: 'absolute', borderRadius: 999, borderWidth: 1},
  arc1: {
    width: 220,
    height: 220,
    bottom: 0,
    borderColor: '#e07a5f',
    backgroundColor: '#e07a5f22',
  },
  arc2: {
    width: 160,
    height: 160,
    bottom: 0,
    borderColor: '#f2cc8f',
    backgroundColor: '#f2cc8f33',
  },
  arc3: {
    width: 100,
    height: 100,
    bottom: 0,
    borderColor: '#e07a5f',
    backgroundColor: '#e07a5f44',
  },
  sunCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e07a5f',
    position: 'absolute',
    bottom: 0,
  },
  titleBlock: {
    backgroundColor: '#3d405b',
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  preTitle: {
    color: '#f2cc8f',
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  eventName: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.BIGLARGE,
    fontFamily: FONTS.FONT_FAMILY.BLACK,
    textAlign: 'center',
  },
  stripes: {
    flexDirection: 'row',
    height: 8,
    marginBottom: 28,
  },
  stripe: {flex: 1},
  detailsWrap: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 14,
    marginBottom: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
  },
  detailIcon: {fontSize: 18},
  detailTxt: {
    flex: 1,
    color: '#3d405b',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  noteWrap: {
    marginHorizontal: 28,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e07a5f',
    paddingVertical: 14,
    marginBottom: 24,
    width: '85%',
  },
  noteTxt: {
    color: '#5a4a3a',
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
    textAlign: 'center',
  },
  bottomBadge: {
    backgroundColor: '#3d405b',
    borderRadius: 99,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  bottomBadgeTxt: {
    color: '#f2cc8f',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    letterSpacing: 2,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 8: RANGOLI FEST (Cultural & Festivals)
// ─────────────────────────────────────────────────────────
export function TemplateRangoli({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[rang.card, {width}]}>
      {/* Decorative top band */}
      <View style={[rang.topBand, {width}]}>
        <View style={rang.bandStripe1} />
        <View style={rang.bandStripe2} />
        <View style={rang.bandStripe3} />
        <View style={rang.bandStripe2} />
        <View style={rang.bandStripe1} />
      </View>

      {/* Mandala-like ornament */}
      <View style={rang.mandalaWrap}>
        <Text style={rang.mandalaEmoji}>🌸</Text>
        <View style={rang.mandalaRing} />
      </View>

      <Text style={rang.festTag}>✦ FESTIVAL INVITATION ✦</Text>

      <Text style={rang.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>

      <View style={rang.dotRow}>
        {['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#e63946'].map(
          (c, i) => (
            <View key={i} style={[rang.dot, {backgroundColor: c}]} />
          ),
        )}
      </View>

      {/* Detail pills */}
      <View style={rang.details}>
        {lines.map((l, i) => (
          <View
            key={i}
            style={[rang.detailPill, {borderLeftColor: rang.pillColors[i % 3]}]}>
            <Text style={rang.detailIcon}>{l.icon}</Text>
            <Text style={rang.detailTxt} numberOfLines={2}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>

      {!!event?.messagefromtheHost && (
        <View style={rang.hostBox}>
          <Text style={rang.hostBoxLabel}>💬 Message from Host</Text>
          <Text style={rang.hostBoxTxt} numberOfLines={3}>
            {event.messagefromtheHost}
          </Text>
        </View>
      )}

      {!!event?.details && (
        <Text style={rang.details2} numberOfLines={3}>
          {event.details}
        </Text>
      )}

      {event?.isRSVPEnable === 'Yes' && (
        <View style={rang.rsvpBand}>
          <Text style={rang.rsvpTxt}>
            🗓 RSVP by {event.rsvpenddate}
          </Text>
        </View>
      )}

      {/* Bottom decorative band */}
      <View style={[rang.topBand, {width, marginTop: 28}]}>
        <View style={rang.bandStripe1} />
        <View style={rang.bandStripe2} />
        <View style={rang.bandStripe3} />
        <View style={rang.bandStripe2} />
        <View style={rang.bandStripe1} />
      </View>
    </View>
  );
}

const rang = {
  pillColors: ['#e63946', '#2a9d8f', '#f4a261'],
};

Object.assign(
  rang,
  StyleSheet.create({
    card: {
      backgroundColor: '#fffbf0',
      alignItems: 'center',
      paddingBottom: 0,
      overflow: 'hidden',
    },
    topBand: {
      flexDirection: 'row',
      height: 12,
    },
    bandStripe1: {flex: 1, backgroundColor: '#e63946'},
    bandStripe2: {flex: 1, backgroundColor: '#f4a261'},
    bandStripe3: {flex: 2, backgroundColor: '#2a9d8f'},
    mandalaWrap: {
      marginTop: 32,
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    mandalaEmoji: {fontSize: 48, position: 'absolute'},
    mandalaRing: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 1.5,
      borderColor: '#e63946',
      borderStyle: 'dashed',
    },
    festTag: {
      fontSize: FONTS.FONTSIZE.MICRO,
      fontFamily: FONTS.FONT_FAMILY.BOLD,
      color: '#2a9d8f',
      letterSpacing: 2.5,
      marginBottom: 12,
      textAlign: 'center',
    },
    eventName: {
      fontSize: FONTS.FONTSIZE.BIGLARGE,
      fontFamily: FONTS.FONT_FAMILY.BLACK,
      color: '#1a0a00',
      textAlign: 'center',
      letterSpacing: 0.5,
      marginBottom: 16,
      paddingHorizontal: 28,
    },
    dotRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    details: {
      width: '100%',
      paddingHorizontal: 24,
      gap: 10,
      marginBottom: 20,
    },
    detailPill: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#fff',
      borderRadius: 10,
      borderLeftWidth: 3,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    detailIcon: {fontSize: 15, marginTop: 1},
    detailTxt: {
      flex: 1,
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: '#3a2a00',
      lineHeight: 20,
    },
    hostBox: {
      width: '100%',
      paddingHorizontal: 24,
      marginBottom: 14,
    },
    hostBoxLabel: {
      fontSize: FONTS.FONTSIZE.MICRO,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: '#e63946',
      marginBottom: 4,
      includeFontPadding: false,
    },
    hostBoxTxt: {
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.ITALIC,
      color: '#5a3a00',
      lineHeight: 20,
    },
    details2: {
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: '#7a5a30',
      textAlign: 'center',
      paddingHorizontal: 28,
      marginBottom: 16,
      lineHeight: 20,
    },
    rsvpBand: {
      backgroundColor: '#e63946',
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 99,
      marginBottom: 28,
    },
    rsvpTxt: {
      color: '#fff',
      fontSize: FONTS.FONTSIZE.MICRO,
      fontFamily: FONTS.FONT_FAMILY.BOLD,
      letterSpacing: 1.5,
      includeFontPadding: false,
    },
  }),
);

// ─────────────────────────────────────────────────────────
// TEMPLATE 9: SACRED CALM (Religious & Spiritual)
// ─────────────────────────────────────────────────────────
export function TemplateSacred({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[sac.card, {width}]}>
      {/* Soft gradient top */}
      <View style={[sac.topGlow, {width}]} />

      <View style={sac.omWrap}>
        <Text style={sac.omSymbol}>🙏</Text>
      </View>

      <Text style={sac.divineTag}>— A SACRED GATHERING —</Text>

      <Text style={sac.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>

      {/* Lotus divider */}
      <Text style={sac.lotus}>❁ ── ❁ ── ❁</Text>

      <View style={sac.detailsBox}>
        {lines.map((l, i) => (
          <View key={i} style={sac.detailRow}>
            <Text style={sac.detailIcon}>{l.icon}</Text>
            <View style={{flex: 1}}>
              <Text style={sac.detailTxt} numberOfLines={2}>
                {l.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {!!event?.messagefromtheHost && (
        <View style={sac.blessingBox}>
          <Text style={sac.blessingLabel}>✨ Blessings from the Host</Text>
          <Text style={sac.blessingTxt} numberOfLines={4}>
            "{event.messagefromtheHost}"
          </Text>
        </View>
      )}

      {!!event?.details && (
        <Text style={sac.overviewTxt} numberOfLines={4}>
          {event.details}
        </Text>
      )}

      <View style={sac.bottomRow}>
        <View style={sac.bottomLine} />
        <Text style={sac.bottomSymbol}>☸</Text>
        <View style={sac.bottomLine} />
      </View>

      {event?.isRSVPEnable === 'Yes' && (
        <Text style={sac.rsvpTxt}>
          Kindly RSVP by {event.rsvpenddate}
        </Text>
      )}

      <View style={[sac.bottomGlow, {width}]} />
    </View>
  );
}

const sac = StyleSheet.create({
  card: {
    backgroundColor: '#fdf8f0',
    alignItems: 'center',
    paddingBottom: 40,
    overflow: 'hidden',
  },
  topGlow: {
    height: 6,
    backgroundColor: '#c9a84c',
    marginBottom: 0,
  },
  bottomGlow: {
    height: 6,
    backgroundColor: '#c9a84c',
    marginTop: 32,
  },
  omWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff8e7',
    borderWidth: 2,
    borderColor: '#c9a84c44',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 20,
  },
  omSymbol: {
    fontSize: 40,
  },
  divineTag: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#9a7a3a',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
  eventName: {
    fontSize: FONTS.FONTSIZE.BIGLARGE,
    fontFamily: FONTS.FONT_FAMILY.LIGHT,
    color: '#2c1a00',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
    paddingHorizontal: 32,
    lineHeight: 44,
  },
  lotus: {
    fontSize: FONTS.FONTSIZE.SMALL,
    color: '#c9a84c',
    letterSpacing: 4,
    marginBottom: 28,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    includeFontPadding: false,
  },
  detailsBox: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#c9a84c22',
  },
  detailIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  detailTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#4a3000',
    lineHeight: 22,
    includeFontPadding: false,
  },
  blessingBox: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  blessingLabel: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#c9a84c',
    marginBottom: 6,
    includeFontPadding: false,
  },
  blessingTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
    color: '#6a4a10',
    lineHeight: 22,
  },
  overviewTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#7a5a2a',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
    marginBottom: 16,
  },
  bottomLine: {flex: 1, height: 1, backgroundColor: '#c9a84c66'},
  bottomSymbol: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    color: '#c9a84c',
    includeFontPadding: false,
  },
  rsvpTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#9a7a3a',
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

// ─────────────────────────────────────────────────────────
// TEMPLATE 10: KIDS PARTY (Family & Kids)
// ─────────────────────────────────────────────────────────
export function TemplateKids({event, thumbWidth}) {
  const {width: screenWidth} = useWindowDimensions();
  const width = thumbWidth ?? screenWidth;
  const lines = getEventLines(event);

  return (
    <View style={[kid.card, {width}]}>
      {/* Balloon row */}
      <View style={kid.balloonRow}>
        {['#f94144', '#f8961e', '#90be6d', '#4cc9f0', '#f72585'].map(
          (c, i) => (
            <View key={i} style={kid.balloonWrap}>
              <View style={[kid.balloon, {backgroundColor: c}]} />
              <View style={[kid.balloonString, {backgroundColor: c}]} />
            </View>
          ),
        )}
      </View>

      {/* Stars */}
      <Text style={kid.stars}>⭐ 🌟 ✨ 🌟 ⭐</Text>

      <Text style={kid.joinTxt}>YOU'RE INVITED!</Text>

      <Text style={kid.eventName} numberOfLines={3}>
        {event?.name ?? 'Your Event'}
      </Text>

      {/* Wavy divider */}
      <Text style={kid.wave}>🎈 🎁 🎊 🎁 🎈</Text>

      {/* Detail cards */}
      <View style={kid.details}>
        {lines.map((l, i) => (
          <View
            key={i}
            style={[kid.detailCard, {backgroundColor: kid.cardColors[i % 4]}]}>
            <Text style={kid.detailIcon}>{l.icon}</Text>
            <Text style={kid.detailTxt} numberOfLines={2}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>

      {!!event?.details && (
        <View style={kid.noteBox}>
          <Text style={kid.noteTxt} numberOfLines={3}>
            📝 {event.details}
          </Text>
        </View>
      )}

      {!!event?.messagefromtheHost && (
        <Text style={kid.hostTxt} numberOfLines={2}>
          🎤 "{event.messagefromtheHost}"
        </Text>
      )}

      <View style={kid.footer}>
        {event?.isRSVPEnable === 'Yes' ? (
          <View style={kid.rsvpBtn}>
            <Text style={kid.rsvpTxt}>🗓 RSVP by {event.rsvpenddate}</Text>
          </View>
        ) : (
          <View style={kid.rsvpBtn}>
            <Text style={kid.rsvpTxt}>🎉 See You There!</Text>
          </View>
        )}
      </View>

      {/* Bottom confetti row */}
      <Text style={kid.confetti}>🎊 🎀 🎁 🎀 🎊</Text>
    </View>
  );
}

const kid = {
  cardColors: ['#fff0f3', '#fff8e7', '#f0fff4', '#f0f4ff'],
};

Object.assign(
  kid,
  StyleSheet.create({
    card: {
      backgroundColor: '#fffdf0',
      alignItems: 'center',
      paddingBottom: 20,
      overflow: 'hidden',
    },
    balloonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingTop: 16,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    balloonWrap: {
      alignItems: 'center',
    },
    balloon: {
      width: 32,
      height: 40,
      borderRadius: 16,
    },
    balloonString: {
      width: 1.5,
      height: 20,
      opacity: 0.5,
    },
    stars: {
      fontSize: 14,
      letterSpacing: 2,
      marginBottom: 8,
      includeFontPadding: false,
    },
    joinTxt: {
      fontSize: FONTS.FONTSIZE.MICRO,
      fontFamily: FONTS.FONT_FAMILY.EXTRA_BOLD,
      color: '#f72585',
      letterSpacing: 4,
      marginBottom: 8,
      includeFontPadding: false,
    },
    eventName: {
      fontSize: FONTS.FONTSIZE.BIGLARGE,
      fontFamily: FONTS.FONT_FAMILY.BLACK,
      color: '#1a1a2e',
      textAlign: 'center',
      letterSpacing: 0.5,
      marginBottom: 12,
      paddingHorizontal: 24,
      lineHeight: 44,
    },
    wave: {
      fontSize: 18,
      letterSpacing: 2,
      marginBottom: 20,
      includeFontPadding: false,
    },
    details: {
      width: '100%',
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 16,
    },
    detailCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
    },
    detailIcon: {fontSize: 16, marginTop: 1},
    detailTxt: {
      flex: 1,
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: '#1a1a2e',
      lineHeight: 20,
      includeFontPadding: false,
    },
    noteBox: {
      backgroundColor: '#fff0fb',
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 20,
      marginBottom: 12,
      width: '90%',
      borderWidth: 1,
      borderColor: '#f72585',
      borderStyle: 'dashed',
    },
    noteTxt: {
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: '#5a0030',
      lineHeight: 20,
      includeFontPadding: false,
    },
    hostTxt: {
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.ITALIC,
      color: '#4a4a6a',
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
      lineHeight: 20,
      includeFontPadding: false,
    },
    footer: {
      marginBottom: 12,
    },
    rsvpBtn: {
      backgroundColor: '#f72585',
      borderRadius: 99,
      paddingHorizontal: 28,
      paddingVertical: 12,
      elevation: 3,
      shadowColor: '#f72585',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    rsvpTxt: {
      color: '#fff',
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.BOLD,
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
    confetti: {
      fontSize: 18,
      letterSpacing: 4,
      marginBottom: 16,
      includeFontPadding: false,
    },
  }),
);
