import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Share,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import {
  toggleLike,
  toggleStar,
  fetchComments,
  addComment,
  deleteComment,
  deleteMedia,
  fetchSingleMedia,
} from './GalleryAPI';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {IMAGE_URL} from '../../connection/Config';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';
import {downloadFile} from '../../utils/CustomDowenload';
import {NOTIFY_MESSAGE} from '../../constant/Module';
import ZoomableView from '../../components/root/ZoomableView';

const PLACEHOLDER = require('../../assets/images/Image_placeholder.png');

let Video;
try {
  Video = require('react-native-video').default;
} catch {
  Video = null;
}

const {width: SW, height: SH} = Dimensions.get('window');

function fmtDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return (
    d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})
  );
}

const CommentItem = React.memo(({item, canDelete, onDelete}) => (
  <View style={cs.cItem}>
    <View style={cs.cAvatar}>
      <Text style={cs.cAvatarTxt}>
        {(item.username || 'M')[0].toUpperCase()}
      </Text>
    </View>
    <View style={cs.cBody}>
      <View style={cs.cNameRow}>
        <Text style={cs.cName}>{item.username || 'Member'}</Text>
        {canDelete && (
          <TouchableOpacity
            onPress={() => onDelete(item.commentId)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={[cs.cDelete, {color: '#e05c5c'}]}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={cs.cText}>{item.body}</Text>
      <Text style={cs.cTime}>{fmtDate(item.createdAt)}</Text>
    </View>
  </View>
));

export default function GalleryLightbox({
  media,
  mediaList,
  initialIndex,
  user,
  currentUserId,
  canWrite,
  onClose,
  onLikeToggled,
  onDeleted,
  isAdmin,
  filterType,
  onStarToggled,
}) {
  const list = mediaList || (Array.isArray(media) ? media : [media]);
  const startIdx =
    initialIndex != null
      ? initialIndex
      : list.findIndex(m => m.mediaId === media?.mediaId);
  const resolvedStart = Math.max(0, startIdx === -1 ? 0 : startIdx);

  const [idx, setIdx] = useState(resolvedStart);
  const [item, setItem] = useState(list[resolvedStart] || media);
  const [comments, setComments] = useState([]);
  const [commentTxt, setCommentTxt] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentLoadingMore, setCommentLoadingMore] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [commentHasMore, setCommentHasMore] = useState(true);
  const [liking, setLiking] = useState(false);
  const [starring, setStarring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [sendingComment, setSendingComment] = useState(false);
  const [mediaState, setMediaState] = useState('loading');
  const shimmer = useRef(new Animated.Value(0.4)).current;
  const commentsAnim = useRef(new Animated.Value(0)).current;
  const commentInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

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

  const isOwner =
    currentUserId != null && currentUserId === item.configurationId;
  const showDelete = (canWrite && isOwner) || isAdmin;

  useEffect(() => {
    setMediaState('loading');
    setIsZoomedIn(false);
    if (scrollViewRef.current?.setNativeProps) {
      scrollViewRef.current.setNativeProps({zoomScale: 1});
    }
  }, [item.mediaId]);

  useEffect(() => {
    if (mediaState !== 'loading') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.85,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [mediaState, shimmer]);

  const refreshCounts = useCallback(
    async mediaId => {
      try {
        const res = await fetchSingleMedia(mediaId || item.mediaId);
        if (res.status && res.result) {
          setItem(prev => ({
            ...prev,
            likeCount: res.result.likeCount ?? prev.likeCount,
            isLiked: res.result.isLiked ?? prev.isLiked,
            commentCount: res.result.commentCount ?? prev.commentCount,
            isStarred: res.result.isStarred ?? prev.isStarred,
          }));
        }
      } catch {}
    },
    [item.mediaId],
  );

  const navCounterRef = useRef(0);
  const goTo = useCallback(
    async newIdx => {
      const clamped = ((newIdx % list.length) + list.length) % list.length;
      const baseItem = list[clamped];
      const myNav = ++navCounterRef.current;

      shimmer.setValue(0.4);
      setIdx(clamped);
      setItem(baseItem);
      setComments([]);
      setCommentsOpen(false);
      commentsAnim.setValue(0);

      try {
        const res = await fetchSingleMedia(baseItem.mediaId);
        if (myNav === navCounterRef.current && res.status && res.result) {
          setItem({...baseItem, ...res.result});
        }
      } catch {}
    },
    [list, commentsAnim, shimmer],
  );

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() => {
      if (!isZoomedIn) goTo(idx + 1);
    });

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .runOnJS(true)
    .onEnd(() => {
      if (!isZoomedIn) goTo(idx - 1);
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(e => {
      if (isZoomedIn) {
        scrollViewRef.current?.scrollResponderZoomTo({
          x: 0,
          y: 0,
          width: SW,
          height: SH * 0.62,
          animated: true,
        });
        setTimeout(() => setIsZoomedIn(false), 300);
      } else {
        const tapX = e.absoluteX;
        const tapY = e.absoluteY;
        const zoomScale = 2.5;
        const w = SW / zoomScale;
        const h = (SH * 0.62) / zoomScale;
        scrollViewRef.current?.scrollResponderZoomTo({
          x: tapX - w / 2,
          y: tapY - h / 2,
          width: w,
          height: h,
          animated: true,
        });
        setTimeout(() => setIsZoomedIn(true), 300);
      }
    });

  const swipeGesture = Gesture.Race(doubleTap, flingLeft, flingRight);

  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);
    const wasLiked = item.isLiked;
    setItem(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likeCount: Math.max(0, (prev.likeCount || 0) + (prev.isLiked ? -1 : 1)),
    }));
    try {
      const res = await toggleLike(item.mediaId);
      if (res.status) {
        setItem(prev => ({
          ...prev,
          likeCount: res.result?.likeCount ?? prev.likeCount,
          isLiked: res.result?.isLiked ?? prev.isLiked,
        }));
        onLikeToggled?.(res.result);
      } else {
        NOTIFY_MESSAGE(res.message || 'Could not update like status.');
        setItem(prev => ({
          ...prev,
          isLiked: wasLiked,
          likeCount: Math.max(0, (prev.likeCount || 0) + (wasLiked ? 1 : -1)),
        }));
      }
    } catch {
      await refreshCounts();
    } finally {
      setLiking(false);
    }
  }, [liking, item, onLikeToggled, refreshCounts]);

  const handleStar = useCallback(async () => {
    if (starring) return;
    setStarring(true);
    const wasStarred = item.isStarred;
    setItem(prev => ({...prev, isStarred: !prev.isStarred}));
    try {
      const res = await toggleStar(item.mediaId);
      if (res.status) {
        const newIsStarred = res.result?.isStarred ?? !wasStarred;
        setItem(prev => ({
          ...prev,
          isStarred: newIsStarred,
        }));
        onStarToggled?.(item.mediaId, newIsStarred);

        if (filterType === 'starred' && !newIsStarred) {
          onClose();
        }
      } else {
        NOTIFY_MESSAGE(res.message || 'Could not update star status.');
        setItem(prev => ({...prev, isStarred: wasStarred}));
      }
    } catch {
      await refreshCounts();
    } finally {
      setStarring(false);
    }
  }, [starring, item, refreshCounts, filterType, onStarToggled, onClose]);

  const loadComments = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) setCommentLoading(true);
      else setCommentLoadingMore(true);
      try {
        const res = await fetchComments(item.mediaId, page, 20);
        if (res.status) {
          const rows = res.result?.data || [];
          setComments(prev => (append ? [...prev, ...rows] : rows));
          setCommentHasMore(page < (res.result?.totalPage || 1));
          setCommentPage(page);
        }
      } finally {
        setCommentLoading(false);
        setCommentLoadingMore(false);
      }
    },
    [item.mediaId],
  );

  const openComments = useCallback(async () => {
    setCommentsOpen(true);
    Animated.spring(commentsAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    await loadComments(1, false);
  }, [commentsAnim, loadComments]);

  const closeComments = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(commentsAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setCommentsOpen(false));
  }, [commentsAnim]);

  const handleLoadMore = useCallback(() => {
    if (!commentLoadingMore && commentHasMore)
      loadComments(commentPage + 1, true);
  }, [commentLoadingMore, commentHasMore, commentPage, loadComments]);

  const handleAddComment = useCallback(async () => {
    const body = commentTxt.trim();
    if (!body || sendingComment) return;
    setSendingComment(true);
    setCommentTxt('');
    try {
      const res = await addComment(item.mediaId, body);
      if (res.status) {
        setComments(prev => [res.result, ...prev]);
        await refreshCounts();
      } else {
        NOTIFY_MESSAGE(res.message || 'Could not add comment.');
      }
    } catch {
      NOTIFY_MESSAGE('An error occurred while adding the comment.');
    } finally {
      setSendingComment(false);
    }
  }, [commentTxt, sendingComment, item.mediaId, refreshCounts]);

  const handleDeleteComment = useCallback(
    async commentId => {
      try {
        const res = await deleteComment(item.mediaId, commentId);
        if (res.status) {
          setComments(prev => prev.filter(c => c.commentId !== commentId));
          await refreshCounts();
        } else {
          NOTIFY_MESSAGE(res.message || 'Could not delete comment.');
        }
      } catch {}
    },
    [item.mediaId, refreshCounts],
  );

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Media', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await deleteMedia(item.mediaId);
            if (res.status) {
              onDeleted?.(item.mediaId);
              onClose();
            } else Alert.alert('Error', res.message || 'Failed to delete.');
          } catch {
            Alert.alert('Error', 'Network error.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [item, onDeleted, onClose]);

  const handleDownload = useCallback(() => {
    const url = item.filePath ? IMAGE_URL + item.filePath : null;
    if (!url) {
      Alert.alert('Error', 'No file available to download.');
      return;
    }
    const fileId = String(item.mediaId);
    downloadFile(url, fileId, setDownloadProgress);
  }, [item]);

  const handleShare = useCallback(() => {
    const url = item.filePath ? IMAGE_URL + item.filePath : '';
    const caption = item.caption || '';
    if (Platform.OS === 'ios') {
      Share.share({url, message: caption});
    } else {
      Share.share({message: [caption, url].filter(Boolean).join('\n')});
    }
  }, [item]);

  const commentsTranslate = commentsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SH, 0],
  });
  const isVideo = item.mediaType === 'video';
  const mediaUri = item.filePath ? IMAGE_URL + item.filePath : null;

  return (
    <Modal visible animationType="fade" presentationStyle="overFullScreen">
      <SafeAreaProvider style={{flex: 1}}>
        <GestureHandlerRootView style={{flex: 1}}>
          <View style={cs.root}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <SafeAreaView
              edges={['top']}
              style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <View style={cs.topBar}>
                <TouchableOpacity onPress={onClose} style={cs.topBtn}>
                  <Text style={cs.topBtnTxt}>✕</Text>
                </TouchableOpacity>
                <View style={{flex: 1}} />
                <TouchableOpacity
                  style={cs.topBtn}
                  onPress={handleDownload}
                  disabled={downloadProgress[String(item.mediaId)] > 0}
                  activeOpacity={0.8}>
                  {downloadProgress[String(item.mediaId)] > 0 ? (
                    <View style={cs.downloadProgressWrap}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={cs.downloadProgressTxt}>
                        {Math.round(
                          downloadProgress[String(item.mediaId)] * 100,
                        )}
                        %
                      </Text>
                    </View>
                  ) : (
                    <Text style={cs.topBtnTxt}>⬇️</Text>
                  )}
                </TouchableOpacity>
                {showDelete && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={cs.topBtn}
                    disabled={deleting}>
                    {deleting ? (
                      <ActivityIndicator size="small" color="#e05c5c" />
                    ) : (
                      <Text style={[cs.topBtnTxt, {color: '#e05c5c'}]}>🗑</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>

            <GestureDetector gesture={swipeGesture}>
              <View style={cs.mediaContainer}>
                {mediaState === 'loading' && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {backgroundColor: '#1a1a24', opacity: shimmer},
                      cs.mediaShimmer,
                    ]}
                  />
                )}

                {mediaState === 'error' && (
                  <View style={cs.mediaErrorWrap}>
                    <Text style={cs.mediaErrorEmoji}>
                      {isVideo ? '🎬' : '🖼️'}
                    </Text>
                    <Text style={cs.mediaErrorTxt}>
                      {isVideo
                        ? 'Video could not be loaded'
                        : 'Image could not be loaded'}
                    </Text>
                  </View>
                )}

                {mediaState !== 'error' && (
                  <>
                    {isVideo && Video ? (
                      <Video
                        source={{uri: mediaUri}}
                        style={[
                          cs.mediaImg,
                          mediaState === 'loading' && {opacity: 0},
                        ]}
                        resizeMode="contain"
                        controls
                        paused={false}
                        onLoad={() => setMediaState('loaded')}
                        onError={() => setMediaState('error')}
                      />
                    ) : mediaUri ? (
                      Platform.OS === 'ios' ? (
                        <ScrollView
                          ref={scrollViewRef}
                          style={{width: SW, flex: 1}}
                          contentContainerStyle={cs.zoomContentContainer}
                          maximumZoomScale={4}
                          minimumZoomScale={1}
                          pinchGestureEnabled={true}
                          scrollEnabled={isZoomedIn}
                          showsHorizontalScrollIndicator={false}
                          showsVerticalScrollIndicator={false}
                          centerContent={true}
                          bouncesZoom={true}
                          scrollEventThrottle={16}
                          onScrollEndDrag={e => {
                            const scale = e.nativeEvent.zoomScale ?? 1;
                            setIsZoomedIn(scale > 1.05);
                          }}>
                          <FastImage
                            source={{
                              uri: mediaUri,
                              priority: FastImage.priority.high,
                            }}
                            style={[
                              cs.mediaImg,
                              mediaState === 'loading' && {opacity: 0},
                            ]}
                            resizeMode={FastImage.resizeMode.contain}
                            onLoadStart={() => setMediaState('loading')}
                            onLoad={() => setMediaState('loaded')}
                            onError={() => setMediaState('error')}
                          />
                        </ScrollView>
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: SW,
                          }}>
                          <ZoomableView key={`zoom-${item.mediaId}`}>
                            <FastImage
                              source={{
                                uri: mediaUri,
                                priority: FastImage.priority.high,
                              }}
                              style={[
                                cs.mediaImg,
                                mediaState === 'loading' && {opacity: 0},
                              ]}
                              resizeMode={FastImage.resizeMode.contain}
                              onLoadStart={() => setMediaState('loading')}
                              onLoad={() => setMediaState('loaded')}
                              onError={() => setMediaState('error')}
                            />
                          </ZoomableView>
                        </View>
                      )
                    ) : (
                      <View style={cs.mediaErrorWrap}>
                        <Image
                          source={PLACEHOLDER}
                          style={cs.mediaErrorImg}
                          resizeMode="contain"
                        />
                        <Text style={cs.mediaErrorTxt}>No media available</Text>
                      </View>
                    )}
                  </>
                )}

                {list.length > 1 && (
                  <TouchableOpacity
                    style={cs.arrowLeft}
                    onPress={() => !isZoomedIn && goTo(idx - 1)}
                    activeOpacity={0.8}>
                    <View style={cs.arrowCircle}>
                      <Text style={cs.arrowTxt}>‹</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {list.length > 1 && (
                  <TouchableOpacity
                    style={cs.arrowRight}
                    onPress={() => !isZoomedIn && goTo(idx + 1)}
                    activeOpacity={0.8}>
                    <View style={cs.arrowCircle}>
                      <Text style={cs.arrowTxt}>›</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {list.length > 1 && (
                  <View style={cs.indexPill}>
                    <Text style={cs.indexPillTxt}>
                      {idx + 1} / {list.length}
                    </Text>
                  </View>
                )}
              </View>
            </GestureDetector>

            <SafeAreaView
              edges={['bottom']}
              style={{backgroundColor: 'rgba(0,0,0,0.92)'}}>
              <View style={cs.infoBar}>
                <View style={cs.uploaderRow}>
                  <View style={cs.uploaderAvatar}>
                    <Text style={cs.uploaderAvatarTxt}>
                      {(item.uploadedByName || 'M')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={cs.uploaderName} numberOfLines={1}>
                      {item.uploadedByName || 'Member'}
                    </Text>
                    <Text style={cs.uploaderMeta}>
                      {fmtDate(item.uploadedAt)}
                      {item.fileSize
                        ? ` · ${(item.fileSize / (1024 * 1024)).toFixed(2)} MB`
                        : ''}
                    </Text>
                  </View>
                  {item.categoryName ? (
                    <View style={cs.badge}>
                      <Text style={cs.badgeTxt} numberOfLines={1}>
                        {item.categoryName || ''}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {!!item.caption && (
                  <Text style={cs.caption}>{item.caption}</Text>
                )}

                <View style={cs.actionsRow}>
                  <TouchableOpacity
                    style={cs.actionBtn}
                    onPress={handleLike}
                    disabled={liking}>
                    <Text style={[cs.actionIcon, item.isLiked && cs.likedIcon]}>
                      {item.isLiked ? '♥' : '♡'}
                    </Text>
                    <Text style={cs.actionTxt}>{item.likeCount || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={cs.actionBtn} onPress={openComments}>
                    <Text style={cs.actionIcon}>💬</Text>
                    <Text style={cs.actionTxt}>{item.commentCount || 0}</Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity style={cs.actionBtn} onPress={handleShare}>
                    <Text style={cs.actionIcon}>🔗</Text>
                    <Text style={cs.actionTxt}>Share</Text>
                  </TouchableOpacity> */}
                  <TouchableOpacity
                    style={cs.actionBtn}
                    onPress={handleStar}
                    disabled={starring}>
                    <Text
                      style={[cs.actionIcon, item.isStarred && cs.starredIcon]}>
                      {item.isStarred ? '★' : '☆'}
                    </Text>
                    <Text
                      style={[
                        cs.actionTxt,
                        {
                          marginTop: Platform.OS == 'android' && 4,
                        },
                      ]}>
                      {item.isStarred ? 'Starred' : 'Star'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>

            {commentsOpen && (
              <Animated.View
                style={[
                  cs.commentsPanel,
                  {transform: [{translateY: commentsTranslate}]},
                ]}>
                <KeyboardAvoidingView
                  style={{flex: 1}}
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={0}>
                  <View style={cs.commentsPanelHandle} />

                  <View style={cs.commentsPanelHeader}>
                    <Text style={cs.commentsPanelTitle}>
                      Comments ({item.commentCount || 0})
                    </Text>
                    <TouchableOpacity
                      onPress={closeComments}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <Text style={cs.commentsPanelClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{flex: 1}}>
                    {commentLoading ? (
                      <View
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <ActivityIndicator color={COLORS.TITLECOLOR} />
                      </View>
                    ) : (
                      <FlatList
                        data={comments}
                        keyExtractor={c => String(c.commentId)}
                        style={{flex: 1}}
                        contentContainerStyle={{
                          paddingVertical: 4,
                          flexGrow: 1,
                        }}
                        keyboardShouldPersistTaps="handled"
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.3}
                        renderItem={({item: c}) => (
                          <CommentItem
                            item={c}
                            canDelete={
                              c.configurationId === currentUserId || isAdmin
                            }
                            onDelete={handleDeleteComment}
                          />
                        )}
                        ListEmptyComponent={
                          <View
                            style={{
                              flex: 1,
                              alignItems: 'center',
                              paddingTop: 40,
                            }}>
                            <Text style={cs.noComments}>
                              No comments yet. Be the first!
                            </Text>
                          </View>
                        }
                        ListFooterComponent={
                          commentLoadingMore ? (
                            <ActivityIndicator
                              color={COLORS.TITLECOLOR}
                              style={{marginVertical: 10}}
                            />
                          ) : null
                        }
                      />
                    )}
                  </View>

                  <View
                    style={[
                      cs.commentInputRow,
                      {
                        paddingBottom:
                          keyboardOpen && Platform.OS == 'ios' ? 50 : 20,
                      },
                    ]}>
                    <View style={cs.commentInputAvatar}>
                      <Text style={cs.commentInputAvatarTxt}>
                        {(user?.user?.firstName ||
                          user?.member?.name ||
                          'Y')[0].toUpperCase()}
                      </Text>
                    </View>
                    <TextInput
                      ref={commentInputRef}
                      style={cs.commentTextInput}
                      placeholder="Add a comment…"
                      placeholderTextColor="#aaa"
                      value={commentTxt}
                      onChangeText={setCommentTxt}
                      maxLength={500}
                      onSubmitEditing={handleAddComment}
                      returnKeyType="done"
                      multiline
                      textAlignVertical="top"
                      blurOnSubmit={true}
                    />
                    <TouchableOpacity
                      style={[
                        cs.commentSendBtn,
                        (!commentTxt.trim() || sendingComment) && {
                          opacity: 0.4,
                        },
                      ]}
                      onPress={handleAddComment}
                      disabled={!commentTxt.trim() || sendingComment}>
                      {sendingComment ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={cs.commentSendTxt}>Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </Animated.View>
            )}
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
}

const cs = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topBtn: {padding: 8},
  zoomContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minHeight: SH * 0.62,
  },
  topBtnTxt: {color: '#fff', fontSize: FONTS.FONTSIZE.MEDIUM || 18},
  mediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  mediaImg: {
    width: SW,
    height: Platform.OS === 'ios' ? SH * 0.62 : undefined,
    flex: Platform.OS === 'android' ? 1 : undefined,
    alignSelf: 'center',
  },
  mediaShimmer: {borderRadius: 0},
  mediaErrorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  mediaErrorImg: {width: 100, height: 100, opacity: 0.25},
  mediaErrorEmoji: {fontSize: 36, opacity: 0.6},
  mediaErrorTxt: {
    color: '#888',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL || 14,
    textAlign: 'center',
  },
  arrowLeft: {position: 'absolute', left: 12, top: '50%', marginTop: -22},
  arrowRight: {position: 'absolute', right: 12, top: '50%', marginTop: -22},
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  arrowTxt: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
  },
  indexPill: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  indexPillTxt: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  infoBar: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4},
  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  uploaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.TITLECOLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploaderAvatarTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL || 14,
  },
  uploaderName: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI || 14,
    includeFontPadding: false,
  },
  uploaderMeta: {
    color: '#aaa',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
  },
  badge: {
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 130,
  },
  badgeTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    includeFontPadding: false,
  },
  caption: {
    color: '#ddd',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionIcon: {fontSize: FONTS.FONTSIZE.MEDIUM, color: '#fff'},
  likedIcon: {color: '#ff4d6d'},
  starredIcon: {color: '#f59e0b'},
  actionTxt: {
    color: '#ccc',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    includeFontPadding: false,
  },
  commentsPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  commentsPanelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  commentsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentsPanelTitle: {
    color: COLORS.PRIMARYBLACK || '#111',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL || 15,
  },
  commentsPanelClose: {
    color: '#aaa',
    fontSize: FONTS.FONTSIZE.MEDIUM || 18,
    padding: 4,
  },
  noComments: {
    textAlign: 'center',
    color: '#aaa',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  cItem: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
  },
  cAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.TITLECOLOR,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cAvatarTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI || 12,
  },
  cBody: {flex: 1},
  cNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cName: {
    color: COLORS.PRIMARYBLACK || '#111',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    includeFontPadding: false,
  },
  cDelete: {color: '#ccc', fontSize: FONTS.FONTSIZE.EXTRAMINI, padding: 4},
  cText: {
    color: '#555',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
  },
  cTime: {
    color: '#bbb',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.TITLECOLOR,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  commentInputAvatarTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI || 12,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#f5f5f8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    color: COLORS.PRIMARYBLACK || '#111',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI || 13,
    borderWidth: 1,
    borderColor: '#e8e8ee',
    maxHeight: 90,
  },
  commentSendBtn: {
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 52,
    alignItems: 'center',
    marginBottom: 2,
  },
  commentSendTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  downloadProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadProgressTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
    includeFontPadding: false,
  },
});
