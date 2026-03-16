import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import VoteOption from './VoteOption';
import {timeAgo, timeLeft} from '../../utils/dateUtils';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';

const AVATAR_COLORS = [
  '#f06a1a',
  '#1a5fbf',
  '#7c3aed',
  '#0ea5a0',
  '#d94040',
  '#1d8a55',
  '#c2860c',
  '#e5386e',
];

export default function PollCard({
  poll: initialPoll,
  onDelete,
  onEdit,
  onVote,
  onClosePoll, // admin only — (pollId) => void
  onNotifyAll, // admin only — (pollId) => void
  onOpenComments, // all users  — (poll) => void
  dashItem,
  isAdmin,
  userData,
}) {
  const [poll, setPoll] = useState(initialPoll);

  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const hasVoted = poll.userVotedOptionIds?.length > 0;
  // const hasVoted = true;
  const isClosed = poll.status === 'closed';
  const showResults = hasVoted || isClosed;
  const maxVotes =
    poll.options?.length > 0
      ? Math.max(...poll.options.map(o => o.votes ?? 0), 0)
      : 0;

  const currentUserId = userData?.user
    ? userData?.user?.userId
    : userData?.member?.configurationId;

  const isOwn = currentUserId == poll.createdBy?.configurationId;

  function avatarColor(id) {
    const safeId = typeof id === 'number' ? id : 0;
    return AVATAR_COLORS[safeId % AVATAR_COLORS.length];
  }

  function initials(name) {
    if (!name || typeof name !== 'string') return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  const avColor = avatarColor(
    poll.createdBy?.configurationId ?? poll.createdBy?.userId,
  );
  const avInitials = initials(poll.createdBy?.username);
  const displayName = poll.createdBy?.username || 'Community';

  // ── Option select ──────────────────────────────────────
  const handleSelect = optId => {
    if (showResults || submitting) return;
    if (poll.allowMultiple) {
      setSelected(prev =>
        prev.includes(optId)
          ? prev.filter(id => id !== optId)
          : [...prev, optId],
      );
    } else {
      setSelected([optId]);
    }
  };

  // ── Optimistic vote ────────────────────────────────────
  const handleVote = async () => {
    if (!selected.length || submitting) return;
    setSubmitting(true);
    try {
      // const newCounts = poll.options.map(o =>
      //   selected.includes(o.optionId) ? (o.votes ?? 0) + 1 : o.votes ?? 0,
      // );
      // const newTotal = newCounts.reduce((a, b) => a + b, 0);
      // const updated = {
      //   ...poll,
      //   userVotedOptionIds: selected,
      //   totalVotes: newTotal,
      //   options: poll.options.map((o, i) => ({
      //     ...o,
      //     votes: newCounts[i],
      //     percentage:
      //       newTotal > 0 ? +((newCounts[i] / newTotal) * 100).toFixed(1) : 0,
      //   })),
      // };
      // setPoll(updated);
      onVote?.(poll.pollId, selected);
      setSelected([]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert('Delete Poll', 'Are you sure you want to delete this poll?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // Animated.timing(fadeAnim, {
          //   toValue: 0,
          //   duration: 280,
          //   useNativeDriver: true,
          // }).start(() => onDelete?.(poll.pollId));
          onDelete?.(poll.pollId);
        },
      },
    ]);
  };

  const statusConfig = isClosed
    ? {label: 'Closed', bg: '#f0ece6', color: '#9a948e', dot: '#9a948e'}
    : hasVoted
    ? {label: 'Voted', bg: '#e8f0fc', color: '#1a5fbf', dot: '#1a5fbf'}
    : {label: 'Live', bg: '#e6f5ee', color: '#1d8a55', dot: '#1d8a55'};

  const commentCount = poll.commentCount ?? 0;

  return (
    <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.head}>
        <View style={[styles.avatar, {backgroundColor: avColor}]}>
          <Text style={styles.avatarTxt}>{avInitials}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.author}>{displayName}</Text>
          <Text style={styles.time}>{timeAgo(poll.createdAt)}</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.badge, {backgroundColor: statusConfig.bg}]}>
          <View
            style={[styles.statusDot, {backgroundColor: statusConfig.dot}]}
          />
          <Text style={[styles.badgeTxt, {color: statusConfig.color}]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* ── Admin action row ────────────────────────────── */}
      {dashItem?.write && (
        <View style={styles.adminRow}>
          {/* Edit — hidden when closed */}
          {!isClosed && (isOwn || isAdmin) && (
            <TouchableOpacity
              style={styles.actBtn}
              onPress={() => onEdit?.(poll)}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={styles.actIcon}>✏️</Text>
              <Text style={styles.actLabel}>Edit</Text>
            </TouchableOpacity>
          )}

          {/* Close poll — admin only, active polls */}
          {isAdmin && !isClosed && (
            <TouchableOpacity
              style={styles.actBtn}
              onPress={() => onClosePoll?.(poll.pollId)}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={styles.actIcon}>🔒</Text>
              <Text style={styles.actLabel}>Close</Text>
            </TouchableOpacity>
          )}

          {/* Notify all — admin only */}
          {/* {isAdmin && !isClosed && (
            <TouchableOpacity
              style={styles.actBtn}
              onPress={() => onNotifyAll?.(poll.pollId)}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={styles.actIcon}>🔔</Text>
              <Text style={styles.actLabel}>Notify</Text>
            </TouchableOpacity>
          )} */}

          {/* Delete */}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.actBtn, styles.actBtnDanger]}
              onPress={handleDelete}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={styles.actIcon}>🗑️</Text>
              <Text style={[styles.actLabel, {color: COLORS.PRIMARYRED}]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Title ──────────────────────────────────────── */}
      <Text style={styles.question}>{poll.title}</Text>

      {/* ── Description ────────────────────────────────── */}
      {poll.description ? (
        <Text style={styles.description}>{poll.description}</Text>
      ) : null}

      {/* ── Options ────────────────────────────────────── */}
      {poll.options?.length > 0 ? (
        poll.options.map((opt, i) => (
          <VoteOption
            key={opt.optionId}
            option={opt}
            index={i}
            isSelected={selected.includes(opt.optionId)}
            showResults={showResults || isAdmin}
            isWinner={opt.votes === maxVotes && maxVotes > 0}
            isUserVoted={poll.userVotedOptionIds?.includes(opt.optionId)}
            onPress={() => handleSelect(opt.optionId)}
            disabled={showResults || submitting}
            dashItem={dashItem}
          />
        ))
      ) : (
        <View style={styles.noOptions}>
          <Text style={styles.noOptionsTxt}>No options available</Text>
        </View>
      )}

      {/* ── Footer ─────────────────────────────────────── */}
      <View style={styles.foot}>
        {/* Left: votes + expiry */}
        <View>
          <Text style={styles.stats}>
            <Text style={styles.statsNum}>{poll.totalVotes ?? 0}</Text>
            {' votes'}
          </Text>
          {!isClosed && poll.endsAt && (
            <Text style={styles.expiry}>{timeLeft(poll.endsAt)}</Text>
          )}
        </View>

        {/* Right: comment button + vote/status */}
        <View style={styles.footRight}>
          {/* Comment button — visible to everyone */}
          {/* {dashItem?.write && ( */}
          {!isClosed && (
            <TouchableOpacity
              style={styles.commentBtn}
              onPress={() => onOpenComments?.(poll)}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={styles.commentIcon}>💬</Text>
              {commentCount > 0 && (
                <Text style={styles.commentCount}>{commentCount}</Text>
              )}
            </TouchableOpacity>
          )}
          {/* )} */}

          {/* Vote button / voted state */}
          {showResults ? (
            hasVoted ? (
              <View style={styles.votedTag}>
                <Text style={styles.votedTxt}>✓ Voted</Text>
              </View>
            ) : (
              <Text style={styles.closedTxt}>Closed</Text>
            )
          ) : (
            <TouchableOpacity
              style={[
                styles.voteBtn,
                (!selected.length || submitting) && styles.voteBtnDis,
              ]}
              onPress={handleVote}
              disabled={!selected.length || submitting}>
              <Text style={styles.voteBtnTxt}>
                {submitting ? '...' : selected.length ? 'Cast Vote' : 'Select'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYWHITE,
    includeFontPadding: false,
  },
  meta: {flex: 1},
  author: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    includeFontPadding: false,
  },
  time: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {width: 6, height: 6, borderRadius: 99},
  badgeTxt: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },

  // ── Admin action row ──
  adminRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.TABLEBORDER,
  },
  actBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f1ec',
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
  },
  actBtnDanger: {backgroundColor: '#fff0f0', borderColor: '#fcd5d5'},
  actIcon: {fontSize: 11},
  actLabel: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#5a5550',
    includeFontPadding: false,
  },

  question: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    marginBottom: 4,
  },
  description: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    marginBottom: 10,
  },
  noOptions: {paddingVertical: 12, alignItems: 'center'},
  noOptionsTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    color: COLORS.grey500,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
  },
  footRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f5f1ec',
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
  },
  commentIcon: {fontSize: 13},
  commentCount: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  stats: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  statsNum: {fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD, color: '#5a5550'},
  expiry: {
    fontSize: FONTS.FONTSIZE.MICRO,
    color: COLORS.grey500,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    marginTop: 1,
  },
  votedTag: {
    backgroundColor: '#e8f0fc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  votedTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#1a5fbf',
    includeFontPadding: false,
  },
  closedTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  voteBtn: {
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: COLORS.LABELCOLOR,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  voteBtnDis: {opacity: 0.35, shadowOpacity: 0},
  voteBtnTxt: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#fff',
    includeFontPadding: false,
  },
});
