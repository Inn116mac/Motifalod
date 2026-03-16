// src/components/VoteOption.js
import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, Animated, StyleSheet} from 'react-native';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';

export default function VoteOption({
  option,
  index,
  isSelected,
  showResults,
  isWinner,
  isUserVoted,
  onPress,
  disabled,
  dashItem,
}) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showResults) {
      Animated.timing(barAnim, {
        toValue: option.percentage,
        duration: 650,
        delay: index * 70,
        useNativeDriver: false,
      }).start();
    } else {
      barAnim.setValue(0);
    }
  }, [showResults, option.percentage]);

  const barBg = isUserVoted
    ? 'rgba(26,95,191,0.09)'
    : isWinner
    ? 'rgba(240,106,26,0.13)'
    : 'rgba(240,106,26,0.06)';

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.optSelected,
          isUserVoted && styles.optUserVoted,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}>
        {/* Progress bar background */}
        <Animated.View
          style={[
            styles.bar,
            {
              width: barAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: barBg,
            },
          ]}
        />

        <View style={styles.inner}>
          <View style={styles.left}>
            <View
              style={[
                styles.check,
                isSelected && styles.checkSel,
                isUserVoted && styles.checkUser,
              ]}>
              {(isSelected || isUserVoted) && (
                <Text
                  style={[styles.checkMark, isUserVoted && {color: '#1a5fbf'}]}>
                  ✓
                </Text>
              )}
            </View>
            <Text style={styles.label}>{option.text}</Text>
          </View>

          {showResults && (
            <View style={styles.right}>
              <Text style={[styles.pct, isWinner && styles.pctWin]}>
                {Math.round(option.percentage)}%
              </Text>
              <Text style={styles.voteCount}>{option.votes}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Admin: voter pills — uses option.voters (admin only, non-anonymous polls) */}
      {dashItem?.write && showResults && option.voters?.length > 0 && (
        <View style={styles.voterRow}>
          {option.voters.slice(0, 3).map((v, i) => (
            <View key={i} style={styles.voterPill}>
              <Text style={styles.voterText}>{v}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 11,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f1ec',
    minHeight: 46,
  },
  optSelected: {
    borderColor: COLORS.LABELCOLOR,
    backgroundColor: COLORS.LABELCOLOR + 15,
  },
  optUserVoted: {borderColor: '#1a5fbf', backgroundColor: '#e8f0fc'},
  bar: {position: 'absolute', top: 0, left: 0, bottom: 0},
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    zIndex: 1,
  },
  left: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  right: {flexDirection: 'row', alignItems: 'center', gap: 6},
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSel: {
    backgroundColor: COLORS.LABELCOLOR,
    borderColor: COLORS.LABELCOLOR,
  },
  checkUser: {backgroundColor: '#e8f0fc', borderColor: '#1a5fbf'},
  checkMark: {fontSize: 10, fontWeight: '800', color: '#fff'},
  label: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    flex: 1,
    includeFontPadding: false,
  },
  pct: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#5a5550',
    minWidth: 34,
    textAlign: 'right',
  },
  pctWin: {color: COLORS.LABELCOLOR},
  voteCount: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    minWidth: 20,
    textAlign: 'right',
  },
  voterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginTop: -4,
  },
  voterPill: {
    backgroundColor: '#f0ece6',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  voterText: {
    fontSize: 10,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#5a5550',
    includeFontPadding: false,
  },
});
