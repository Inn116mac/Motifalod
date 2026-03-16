// src/screens/PollComments.js
import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import NetInfo from '@react-native-community/netinfo';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import httpClientV3 from '../connection/httpClientV3';
import {NOTIFY_MESSAGE} from '../constant/Module';
import {timeAgo, timeLeft} from '../utils/dateUtils';
import {getData} from '../utils/Storage';

// ── Constants ──────────────────────────────────────────
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
const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 10000; // refresh every 10 seconds silently

// ── Helpers ─────────────────────────────────────────────
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

// ── CommentItem ─────────────────────────────────────────
function CommentItem({comment, isAdmin, currentUserId, onDelete}) {
  const name = comment.author?.username || 'Community';
  const authorId = comment.author?.configurationId ?? comment.author?.userId;
  const isOwn = currentUserId && authorId === currentUserId;
  const avColor = avatarColor(authorId);
  const avInitials = initials(comment.author?.username);

  const onPressDelete = () => {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(comment.commentId),
      },
    ]);
  };

  return (
    <View style={styles.commentRow}>
      <View style={[styles.commentAvatar, {backgroundColor: avColor}]}>
        <Text style={styles.commentAvatarTxt}>{avInitials}</Text>
      </View>

      <View style={[styles.commentBubble, isOwn && styles.commentBubbleOwn]}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{name}</Text>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentBody}>{comment.body}</Text>

        {/* Delete — shown to admin or comment owner */}
        {(isAdmin || isOwn) && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onPressDelete}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Text style={styles.deleteTxt}>🗑 Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────
export default function PollComments({route, navigation}) {
  const {poll, isAdmin, dashItem} = route?.params?.data;

  const [comments, setComments] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState('');

  const flatListRef = useRef(null);
  const pollingRef = useRef(null);

  // ── Fetch page of comments ─────────────────────────────
  // silent=true means no loader — used for background refresh
  const fetchComments = useCallback(
    (page = 1, silent = false) => {
      if (!silent) {
        if (page === 1) setIsLoading(true);
        else setLoadingMore(true);
      }

      httpClientV3
        .get(
          `polls/${poll.pollId}/comments?PageNumber=${page}&PageSize=${PAGE_SIZE}`,
        )
        .then(response => {
          if (response?.data?.status) {
            const {
              data: items = [],
              totalRecord = 0,
              totalPage = 1,
            } = response.data.result;

            if (page === 1) {
              setComments(items);
            } else {
              setComments(prev => [...prev, ...items]);
            }
            setPageNumber(page);
            setTotalCount(totalRecord);
            setHasMore(page < totalPage && items.length > 0);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
          setLoadingMore(false);
        });
    },
    [poll.pollId],
  );

  // Initial load
  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // ── Real-time: silently poll page 1 every 10s ──────────
  // New comments prepended by comparing commentId
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      httpClientV3
        .get(`polls/${poll.pollId}/comments?PageNumber=1&PageSize=${PAGE_SIZE}`)
        .then(response => {
          if (response?.data?.status) {
            const freshItems = response.data.result?.data ?? [];
            // setComments(prev => {
            //   const existingIds = new Set(prev.map(c => c.commentId));
            //   const newOnes = freshItems.filter(
            //     c => !existingIds.has(c.commentId),
            //   );
            //   if (newOnes.length === 0) return prev;
            //   return [...newOnes, ...prev];
            // });
            // setTotalCount(response.data.result?.totalRecord ?? 0);

            setComments(prev => {
              const freshIds = new Set(freshItems.map(c => c.commentId));
              const existingIds = new Set(prev.map(c => c.commentId));

              // New comments to prepend
              const newOnes = freshItems.filter(
                c => !existingIds.has(c.commentId),
              );

              // Remove deleted ones (exist locally but not in fresh fetch)
              // Only remove from the first PAGE_SIZE comments since that's what we fetched
              const prevFirstPage = prev.slice(0, PAGE_SIZE);
              const restPages = prev.slice(PAGE_SIZE);
              const surviving = prevFirstPage.filter(c =>
                freshIds.has(c.commentId),
              );

              if (
                newOnes.length === 0 &&
                surviving.length === prevFirstPage.length
              ) {
                return prev; // nothing changed
              }

              return [...newOnes, ...surviving, ...restPages];
            });
            setTotalCount(response.data.result?.totalRecord ?? 0);
          }
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollingRef.current);
  }, [poll.pollId]);

  // ── Infinite scroll ────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchComments(pageNumber + 1);
  }, [loadingMore, hasMore, pageNumber, fetchComments]);

  // ── Post comment ───────────────────────────────────────
  const handlePost = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || posting) return;

    NetInfo.fetch().then(state => {
      if (!state.isConnected) {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        return;
      }
      setPosting(true);
      httpClientV3
        .post(`polls/${poll.pollId}/comments`, {body: trimmed})
        .then(response => {
          if (response?.data?.status) {
            const newComment = response.data.result;
            // Prepend — newest first
            setComments(prev => [newComment, ...prev]);
            setTotalCount(prev => prev + 1);
            setBody('');
            flatListRef.current?.scrollToOffset({offset: 0, animated: true});
          } else {
            NOTIFY_MESSAGE(response?.data?.message || 'Could not post comment');
          }
        })
        .catch(err => NOTIFY_MESSAGE(err?.message || 'Something Went Wrong'))
        .finally(() => setPosting(false));
    });
  }, [body, posting, poll.pollId]);

  // ── Delete comment ─────────────────────────────────────
  const handleDelete = useCallback(
    commentId => {
      NetInfo.fetch().then(state => {
        if (!state.isConnected) {
          NOTIFY_MESSAGE('Please check your internet connectivity');
          return;
        }
        httpClientV3
          .delete(`polls/${poll.pollId}/comments/${commentId}`)
          .then(response => {
            if (response?.data?.status !== false) {
              setComments(prev => prev.filter(c => c.commentId !== commentId));
              setTotalCount(prev => Math.max(prev - 1, 0));
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message || 'Could not delete comment',
              );
            }
          })
          .catch(err =>
            NOTIFY_MESSAGE(err?.message || 'Could not delete comment'),
          );
      });
    },
    [poll.pollId],
  );

  // ── Poll summary mini-card ─────────────────────────────
  const PollSummary = () => (
    <View style={styles.pollSummary}>
      <View style={styles.pollSummaryRow}>
        <View style={styles.pollStatusRow}>
          <View
            style={[
              styles.pollStatusDot,
              {
                backgroundColor:
                  poll.status === 'active' ? '#1d8a55' : '#9a948e',
              },
            ]}
          />
          <Text style={styles.pollStatusTxt}>
            {poll.status === 'active' ? 'LIVE' : 'CLOSED'}
          </Text>
        </View>
        <Text style={styles.pollVotesTxt}>{poll.totalVotes ?? 0} votes</Text>
      </View>
      <Text style={styles.pollTitle} numberOfLines={3}>
        {poll.title}
      </Text>
    </View>
  );

  //   const PollSummary = () => {
  //     const maxVotes =
  //       poll.options?.length > 0
  //         ? Math.max(...poll.options.map(o => o.votes ?? 0), 0)
  //         : 0;

  //     return (
  //       <View style={styles.pollSummary}>
  //         {/* Header row */}
  //         <View style={styles.pollSummaryRow}>
  //           <View style={styles.pollStatusRow}>
  //             <View
  //               style={[
  //                 styles.pollStatusDot,
  //                 {
  //                   backgroundColor:
  //                     poll.status === 'active' ? '#1d8a55' : '#9a948e',
  //                 },
  //               ]}
  //             />
  //             <Text style={styles.pollStatusTxt}>
  //               {poll.status === 'active' ? 'LIVE' : 'CLOSED'}
  //             </Text>
  //           </View>
  //           <Text style={styles.pollVotesTxt}>{poll.totalVotes ?? 0} votes</Text>
  //         </View>

  //         {/* Title */}
  //         <Text style={styles.pollTitle} numberOfLines={3}>
  //           {poll.title}
  //         </Text>

  //         {/* Options with progress bars */}
  //         {poll.options?.length > 0 && (
  //           <View style={styles.optionsWrap}>
  //             {poll.options.map((opt, i) => {
  //               const pct = opt.percentage ?? 0;
  //               const isWinner = opt.votes === maxVotes && maxVotes > 0;
  //               const isVoted = poll.userVotedOptionIds?.includes(opt.optionId);
  //               return (
  //                 <View key={opt.optionId ?? i} style={styles.optRow}>
  //                   {/* Label */}
  //                   <Text style={styles.optText} numberOfLines={1}>
  //                     {opt.text}
  //                   </Text>
  //                   {/* Bar + percentage */}
  //                   <View style={styles.optBarRow}>
  //                     <View style={styles.optBarBg}>
  //                       <View
  //                         style={[
  //                           styles.optBarFill,
  //                           {
  //                             width: `${pct}%`,
  //                             backgroundColor: isVoted
  //                               ? '#1a5fbf'
  //                               : isWinner
  //                               ? COLORS.LABELCOLOR
  //                               : '#d0ccc8',
  //                           },
  //                         ]}
  //                       />
  //                     </View>
  //                     <Text
  //                       style={[
  //                         styles.optPct,
  //                         isWinner && {color: COLORS.LABELCOLOR},
  //                         isVoted && {color: '#1a5fbf'},
  //                       ]}>
  //                       {Math.round(pct)}%
  //                     </Text>
  //                   </View>
  //                 </View>
  //               );
  //             })}
  //           </View>
  //         )}

  //         {/* Footer */}
  //         <View style={styles.pollSummaryFoot}>
  //           <Text style={styles.pollVotesTxt}>
  //             <Text
  //               style={{
  //                 fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  //                 color: '#5a5550',
  //               }}>
  //               {poll.totalVotes ?? 0}
  //             </Text>
  //             {' votes'}
  //           </Text>
  //           {poll.endsAt && poll.status === 'active' && (
  //             <Text style={styles.pollVotesTxt}>{timeLeft(poll.endsAt)}</Text>
  //           )}
  //           {poll.userVotedOptionIds?.length > 0 && (
  //             <View style={styles.youVotedBadge}>
  //               <Text style={styles.youVotedTxt}>✓ You voted</Text>
  //             </View>
  //           )}
  //         </View>
  //       </View>
  //     );
  //   };

  // ── Comments section header ────────────────────────────

  const SectionHeader = () => (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>Comments</Text>
      {totalCount > 0 && (
        <View style={styles.countPill}>
          <Text style={styles.countPillTxt}>{totalCount}</Text>
        </View>
      )}
    </View>
  );
  useEffect(() => {
    getUser();
  }, []);

  const [userData, setUserData] = useState(null);

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
  };

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ── Render ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
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
        title="Discussion"
      />

      {isLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.LABELCOLOR} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={c => String(c.commentId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <>
              <PollSummary />
              <SectionHeader />
            </>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color={COLORS.LABELCOLOR} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTxt}>No comments yet</Text>
              <Text style={styles.emptySub}>
                Be the first to share your thoughts
              </Text>
            </View>
          }
          renderItem={({item: comment}) => (
            <CommentItem
              comment={comment}
              isAdmin={isAdmin}
              currentUserId={
                userData?.user
                  ? userData?.user?.userId
                  : userData?.member?.configurationId
              }
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {/* ── Input bar ────────────────────────────────────── */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom:
              keyboardOpen && Platform.OS == 'android'
                ? 50
                : keyboardOpen && Platform.OS == 'ios'
                ? 70
                : 10,
          },
        ]}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          placeholderTextColor={COLORS.grey500}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!body.trim() || posting) && styles.sendBtnDis,
          ]}
          onPress={handlePost}
          disabled={!body.trim() || posting}
          activeOpacity={0.8}>
          {posting ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARYWHITE} />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  centerLoader: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContent: {paddingBottom: 8},
  optionsWrap: {
    marginTop: 12,
    gap: 8,
  },
  optRow: {
    gap: 4,
  },
  optText: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    includeFontPadding: false,
  },
  optBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#f0ece6',
    overflow: 'hidden',
  },
  optBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  optPct: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#9a948e',
    minWidth: 32,
    textAlign: 'right',
    includeFontPadding: false,
  },
  pollSummaryFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
  },
  youVotedBadge: {
    backgroundColor: '#e8f0fc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  youVotedTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#1a5fbf',
    includeFontPadding: false,
  },

  // ── Poll summary ──
  pollSummary: {
    backgroundColor: COLORS.PRIMARYWHITE,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 16,
    padding: 14,
  },
  pollSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pollStatusRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  pollStatusDot: {width: 7, height: 7, borderRadius: 99},
  pollStatusTxt: {
    fontSize: 9,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#5a5550',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  pollVotesTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  pollTitle: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    lineHeight: 20,
  },

  // ── Section header ──
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
  },
  countPill: {
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 99,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countPillTxt: {
    fontSize: 10,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYWHITE,
    includeFontPadding: false,
  },

  // ── Comment row ──
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  commentAvatarTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYWHITE,
    includeFontPadding: false,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    padding: 11,
  },
  commentBubbleOwn: {
    backgroundColor: '#fff8f3',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 4,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    includeFontPadding: false,
  },
  commentTime: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.grey500,
    includeFontPadding: false,
  },
  commentBody: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.PRIMARYBLACK,
    lineHeight: 18,
    includeFontPadding: false,
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  deleteTxt: {
    fontSize: FONTS.FONTSIZE.MICRO,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYRED,
    includeFontPadding: false,
  },

  // ── Empty ──
  emptyWrap: {alignItems: 'center', paddingTop: 50, paddingBottom: 20},
  emptyIcon: {fontSize: 36, marginBottom: 8},
  emptyTxt: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
  },
  emptySub: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: COLORS.grey500,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    marginTop: 4,
  },

  loaderWrap: {paddingVertical: 16, alignItems: 'center'},

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.PRIMARYBLACK,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.LABELCOLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.LABELCOLOR,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDis: {opacity: 0.35, shadowOpacity: 0},
  sendIcon: {
    fontSize: 15,
    color: COLORS.PRIMARYWHITE,
    marginLeft: 2,
    includeFontPadding: false,
    top: Platform.OS == 'ios' ? 0 : -3,
  },
});
