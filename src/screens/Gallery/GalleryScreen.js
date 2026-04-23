import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {
  fetchEvents,
  fetchAlbums,
  fetchMedia,
  deleteAlbum,
  fetchCategoriesFromAPI,
  fetchGalleryStats,
} from './GalleryAPI';
import GalleryLightbox from './GalleryLightbox';
import GalleryUploadSheet from './GalleryUploadSheet';
import CreateAlbumSheet from './CreateAlbumSheet';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import FastImage from 'react-native-fast-image';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import GallerySearchScreen from './GallerySearchScreen';
import {IMAGE_URL} from '../../connection/Config';
import {getData} from '../../utils/Storage';
import {NOTIFY_MESSAGE} from '../../constant/Module';
import CustomModal from '../../components/root/CustomModal';
import {createThumbnail} from 'react-native-create-thumbnail';
import {
  subscribeUpload,
  clearCompleted,
  cancelUpload,
} from './GalleryUploadQueue';

const {width: SW, height: SH} = Dimensions.get('window');
const TILE = (SW - 4) / 3.02;

const SkeletonTile = React.memo(() => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: TILE,
        height: TILE,
        margin: 1,
        backgroundColor: '#c0c0cc',
        opacity,
      }}
    />
  );
});

const PLACEHOLDER_IMG = require('../../assets/images/Image_placeholder.png');

const loadedMediaIds = new Set();
const videoThumbCache = new Map();

let thumbGenerating = 0;
const MAX_THUMB_CONCURRENT = 3;
const thumbQueue = [];

function enqueueThumb(fn) {
  if (thumbGenerating < MAX_THUMB_CONCURRENT) {
    thumbGenerating++;
    fn().finally(() => {
      thumbGenerating--;
      if (thumbQueue.length > 0) {
        const next = thumbQueue.shift();
        enqueueThumb(next);
      }
    });
  } else {
    thumbQueue.push(fn);
  }
}

const MediaTile = React.memo(
  ({item, onPress}) => {
    const shimmerOpacity = useRef(new Animated.Value(0.4)).current;
    const shimmerAnim = useRef(null);
    const isVideo = item.mediaType === 'video';
    const uri = item.filePath ? IMAGE_URL + item.filePath : null;

    const [imgState, setImgState] = useState(() => {
      if (!isVideo) {
        return loadedMediaIds.has(item.mediaId) ? 'loaded' : 'loading';
      }
      const cached = videoThumbCache.get(item.mediaId);
      if (cached && cached !== 'loading' && cached !== 'error') return 'loaded';
      if (cached === 'error') return 'videoFallback';
      return 'loading';
    });

    const [thumbUri, setThumbUri] = useState(() => {
      const cached = videoThumbCache.get(item.mediaId);
      if (cached && cached !== 'loading' && cached !== 'error') return cached;
      return null;
    });

    useEffect(() => {
      if (!isVideo) {
        setImgState(loadedMediaIds.has(item.mediaId) ? 'loaded' : 'loading');
        setThumbUri(null);
        return;
      }

      const cached = videoThumbCache.get(item.mediaId);
      if (cached && cached !== 'loading' && cached !== 'error') {
        setThumbUri(cached);
        setImgState('loaded');
        return;
      }
      if (cached === 'error') {
        setImgState('videoFallback');
        return;
      }
      if (cached === 'loading') return;

      videoThumbCache.set(item.mediaId, 'loading');
      setImgState('loading');

      const capturedId = item.mediaId;
      const capturedUri = uri;

      enqueueThumb(() =>
        createThumbnail({url: capturedUri, timeStamp: 0})
          .then(res => {
            videoThumbCache.set(capturedId, res.path);
            setThumbUri(res.path);
            setImgState('loaded');
          })
          .catch(() => {
            videoThumbCache.set(capturedId, 'error');
            setImgState('videoFallback');
          }),
      );

      return () => {
        if (videoThumbCache.get(capturedId) === 'loading') {
          videoThumbCache.delete(capturedId);
        }
      };
    }, [item.mediaId, isVideo, uri]);

    useEffect(() => {
      if (imgState === 'loading') {
        shimmerOpacity.setValue(0.4);
        shimmerAnim.current = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerOpacity, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerOpacity, {
              toValue: 0.4,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        );
        shimmerAnim.current.start();
      } else {
        shimmerAnim.current?.stop();
      }
      return () => shimmerAnim.current?.stop();
    }, [imgState]);

    const handleLoad = () => {
      if (!isVideo) loadedMediaIds.add(item.mediaId);
      setImgState('loaded');
    };
    const handleError = () => {
      if (!isVideo) loadedMediaIds.add(item.mediaId);
      setImgState('error');
    };

    const displayUri = isVideo ? thumbUri : uri;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[gs.tile, {width: TILE, height: TILE}]}
        onPress={() => onPress(item)}>
        {imgState === 'loading' && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {backgroundColor: '#c0c0cc', opacity: shimmerOpacity},
            ]}
          />
        )}

        {imgState === 'videoFallback' ||
        (imgState === 'error' && !isVideo) ||
        (!displayUri && !isVideo) ? (
          imgState === 'videoFallback' ? (
            <View style={gs.videoThumb}>
              <View style={gs.videoThumbInner}>
                <Text style={gs.videoThumbIcon}>🎬</Text>
              </View>
            </View>
          ) : (
            <View style={gs.tileErrorWrap}>
              <Image
                source={PLACEHOLDER_IMG}
                style={gs.tileErrorImg}
                resizeMode="contain"
              />
            </View>
          )
        ) : displayUri ? (
          <FastImage
            source={{uri: displayUri, priority: FastImage.priority.normal}}
            style={gs.tileImg}
            resizeMode={FastImage.resizeMode.cover}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : null}

        {isVideo && imgState !== 'loading' && (
          <View style={gs.playOverlay}>
            <View style={gs.playIconCircle}>
              <Text style={gs.playIconTxt}>▶</Text>
            </View>
          </View>
        )}

        {item.isLiked && (
          <View style={gs.likedBadge}>
            <Text style={gs.likedBadgeTxt}>♥</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.mediaId === next.item.mediaId &&
    prev.item.isLiked === next.item.isLiked &&
    prev.item.likeCount === next.item.likeCount,
);

const CategoryBubble = React.memo(({cat, selected, onPress}) => (
  <TouchableOpacity
    style={gs.catItem}
    activeOpacity={0.8}
    onPress={() => onPress(cat.categoryId)}>
    <View style={[gs.catBubble, selected && gs.catBubbleActive]}>
      {cat.coverUrl ? (
        <FastImage
          source={{uri: cat.coverUrl}}
          style={gs.catBubbleImg}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            gs.catBubblePlaceholder,
            selected && {backgroundColor: COLORS.TITLECOLOR},
          ]}>
          <Text style={gs.catBubbleEmoji}>{cat.icon || '📁'}</Text>
        </View>
      )}
    </View>
    <Text
      style={[gs.catLabel, selected && gs.catLabelActive]}
      numberOfLines={1}>
      {cat.name}
    </Text>
  </TouchableOpacity>
));

const StatPill = React.memo(({icon, label, value}) => (
  <View style={[gs.statPill]} activeOpacity={0.8}>
    <Text style={gs.statPillIcon}>{icon}</Text>
    <View>
      <Text style={[gs.statPillValue]}>{value}</Text>
      <Text style={[gs.statPillLabel]}>{label}</Text>
    </View>
  </View>
));

function EventPickerModal({visible, events, selected, onSelect, onClose}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={gs.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <SafeAreaView style={gs.eventSheetSafeArea} edges={['bottom']}>
        <View style={gs.eventPickerSheet}>
          <View style={gs.sheetHandle} />
          <Text style={gs.eventPickerTitle}>Select Event</Text>
          {events.length === 0 ? (
            <View style={gs.eventPickerEmpty}>
              <Text style={gs.eventPickerEmptyTxt}>No events found</Text>
            </View>
          ) : (
            <ScrollView bounces={false} style={{maxHeight: SH * 0.45}}>
              {events.map(ev => (
                <TouchableOpacity
                  key={ev.id}
                  style={[
                    gs.eventPickerItem,
                    selected === ev.id && gs.eventPickerItemActive,
                  ]}
                  onPress={() => {
                    onSelect(ev.id);
                    onClose();
                  }}>
                  <Text
                    style={[
                      gs.eventPickerItemTxt,
                      selected === ev.id && gs.eventPickerItemTxtActive,
                    ]}
                    numberOfLines={1}>
                    {ev.name}
                  </Text>
                  {selected === ev.id && <Text style={gs.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function AlbumsOverlay({
  visible,
  albums,
  loading,
  canWrite,
  isAdmin,
  onClose,
  onCreateAlbum,
  onAlbumPress,
  onEditAlbum,
  onDeleteAlbum,
  createAlbum,
  editAlbum,
  currentUserId,
}) {
  if (!visible) return null;
  const [coverErrors, setCoverErrors] = useState({});

  const renderAlbum = album => (
    <TouchableOpacity
      key={String(album.albumId)}
      style={[gs2.albumCard, {width: (SW - 36) / 2}]}
      activeOpacity={0.88}
      onPress={() => onAlbumPress(album)}>
      {/* Cover */}
      <View style={[gs2.albumCoverWrap]}>
        {album.coverUrl && !coverErrors[album.albumId] ? (
          <FastImage
            defaultSource={require('../../assets/images/Image_placeholder.png')}
            source={{
              uri: IMAGE_URL + album.coverUrl,
              priority: FastImage.priority.normal,
            }}
            style={gs2.albumCover}
            resizeMode={FastImage.resizeMode.cover}
            onError={() =>
              setCoverErrors(prev => ({...prev, [album.albumId]: true}))
            }
          />
        ) : (
          <Image
            source={require('../../assets/images/Image_placeholder.png')}
            style={gs2.albumCover}
            resizeMode="cover"
          />
        )}
        {/* Count badge */}
        <View style={gs2.albumCountBadge}>
          <Text style={gs2.albumCountBadgeTxt}>{album.mediaCount ?? 0}</Text>
        </View>
      </View>

      <View style={gs2.albumInfoRow}>
        <View style={{flex: 1}}>
          <Text style={gs2.albumName} numberOfLines={1}>
            {album.name}
          </Text>
        </View>
      </View>
      {(isAdmin ||
        (canWrite &&
          String(album.configurationId) === String(currentUserId))) && (
        <View style={gs2.albumActions}>
          <TouchableOpacity
            style={gs2.albumActionBtn}
            onPress={e => {
              e.stopPropagation?.();
              onEditAlbum(album);
            }}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Text style={gs2.albumActionTxt}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[gs2.albumActionBtn, gs2.albumDeleteActionBtn]}
            onPress={e => {
              e.stopPropagation?.();
              onDeleteAlbum(album);
            }}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Text style={gs2.albumActionTxt}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <CustomModal
      visible={visible}
      justifyContent={'center'}
      modalcontent={
        <SafeAreaProvider style={gs2.albumsRoot}>
          <SafeAreaView style={{flex: 1}}>
            <View style={gs2.albumsHeader}>
              <TouchableOpacity onPress={onClose} style={{padding: 6}}>
                <FontAwesome6
                  name="angle-left"
                  size={22}
                  color={COLORS.TITLECOLOR}
                  iconStyle="solid"
                />
              </TouchableOpacity>
              <Text style={gs2.albumsHeaderTitle}>Albums</Text>
              {(isAdmin || canWrite) && (
                <TouchableOpacity
                  style={gs2.albumsNewBtn}
                  onPress={onCreateAlbum}>
                  <Text style={gs2.albumsNewBtnTxt}>＋ New</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={gs2.centred}>
                <ActivityIndicator color={COLORS.TITLECOLOR} size="large" />
              </View>
            ) : albums.length === 0 ? (
              <View style={gs2.centred}>
                <Text style={{fontSize: 48}}>📁</Text>
                <Text style={gs2.emptyTxt}>No albums yet</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={gs2.albumList}
                showsVerticalScrollIndicator={false}>
                {albums.map(renderAlbum)}
              </ScrollView>
            )}
            {createAlbum}
            {editAlbum}
          </SafeAreaView>
        </SafeAreaProvider>
      }
    />
  );
}

const TABS = [
  {idx: 0, icon: '🏠', label: 'Home'},
  {idx: 1, icon: '🔍', label: 'Search'},
  {idx: 2, icon: '⬆️', label: 'Upload'},
  {idx: 3, icon: '📁', label: 'Albums'},
];

const gs2 = StyleSheet.create({
  albumsRoot: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    width: '100%',
  },
  centred: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  emptyTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
  },
  albumsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
    gap: 10,
  },
  albumsHeaderTitle: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.LARGE,
  },
  albumsNewBtn: {
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  albumsNewBtnTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
  },
  albumList: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // Full-width card
  albumCard: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
  },
  albumCoverWrap: {width: '100%', aspectRatio: 16 / 9, position: 'relative'},
  albumCover: {width: '100%', height: '100%'},
  albumCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  albumCountBadgeTxt: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
  albumInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 10,
  },
  albumName: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  albumSub: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    includeFontPadding: false,
  },
  albumActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 10,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  albumActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumDeleteActionBtn: {
    backgroundColor: '#fff0f0',
    borderColor: '#fecaca',
  },
  albumActionTxt: {fontSize: 12},
});

function formatStorage(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── Main GalleryScreen ───────────────────────────────────────────────────────
export default function GalleryScreen({route, navigation}) {
  const {item, isAdmin} = route?.params?.data;

  const [user, setUser] = useState(null);

  const [events, setEvents] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [media, setMedia] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const [totalMedia, setTotalMedia] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [totalStorage, setTotalStorage] = useState(0);

  const [initialising, setInitialising] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(false);

  const [selEventId, setSelEventId] = useState(null);

  const [selCategory, setSelCategory] = useState('all');
  const [selType, setSelType] = useState('');
  const [keyword, setKeyword] = useState('');
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [albumsOpen, setAlbumsOpen] = useState(false);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editAlbumOpen, setEditAlbumOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [expectedCount, setExpectedCount] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState(0);

  const selectedEventName = useMemo(
    () => events.find(e => e.id === selEventId)?.name || null,
    [selEventId, events],
  );

  const [uploadQueue, setUploadQueue] = useState({
    running: false,
    done: 0,
    total: 0,
    errors: [],
  });

  useEffect(() => {
    const unsub = subscribeUpload(setUploadQueue);
    return unsub;
  }, []);

  const showUploadBanner = uploadQueue.total > 0;

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const user = await getData('user');
    setUser(user);
  };

  useEffect(() => {
    return () => {
      if (Platform.OS === 'ios') {
        FastImage.clearMemoryCache();
      }
    };
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchGalleryStats(selEventId);
      if (res.status && res.result) {
        setTotalMedia(res.result.totalMedia || 0);
        setPhotosCount(res.result.totalPhotos || 0);
        setVideosCount(res.result.totalVideos || 0);
        setTotalStorage(res.result.totalFileSize || 0);
      }
    } catch {}
  }, [selEventId]);

  const loadCategories = useCallback(async () => {
    try {
      const cRes = await fetchCategoriesFromAPI();
      const raw = cRes.status ? cRes.result?.data || [] : [];
      setCategories([
        {categoryId: 'all', name: 'All', emoji: '🌐', icon: '🌐'},
        ...raw,
      ]);
    } catch {}
  }, []);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        try {
          const eRes = await fetchEvents();
          if (
            eRes.status &&
            Array.isArray(eRes.result) &&
            eRes.result.length > 0
          ) {
            setEvents(eRes.result);
            // ← default to first event
            setSelEventId(eRes.result[0].id);
          }
        } catch {}
        await loadCategories();
      } finally {
        setInitialising(false);
      }
    })();
  }, []);

  const loadAlbums = useCallback(
    async eventId => {
      setAlbumsLoading(true);
      try {
        const id = eventId !== undefined ? eventId : selEventId;

        const aRes = await fetchAlbums(id || '');
        if (aRes.status) setAlbums(aRes.result?.data || []);
      } catch {
      } finally {
        setAlbumsLoading(false);
      }
    },
    [selEventId],
  );

  const loadMedia = useCallback(
    async pageNumber => {
      if (loadingRef.current) {
        loadingRef.current = false;
      }
      loadingRef.current = true;
      setMediaLoading(true);
      setMedia([]);

      try {
        const res = await fetchMedia({
          pageNumber,
          pageSize: 25,
          eventId: selEventId,
          albumId: selectedAlbumId,
          categoryId: selCategory !== 'all' ? selCategory : '',
          keyword,
          mediaType: selType === 'starred' ? '' : selType,
          StarredOnly: selType === 'starred' ? true : false,
        });
        if (!mountedRef.current) return;
        if (res.status) {
          const rows = res.result?.data || [];
          setMedia(rows);
          setExpectedCount(rows.length || 20);
          setTotalPages(res.result?.totalPage || 1);
          setHasMore(pageNumber < (res.result?.totalPage || 1));
        }
        loadStats();
      } catch (e) {
        console.warn('loadMedia error', e);
      } finally {
        if (mountedRef.current) {
          setMediaLoading(false);
        }
        loadingRef.current = false;
      }
    },
    [selEventId, selectedAlbumId, keyword, selType, selCategory, loadStats],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    loadingRef.current = false;
    await Promise.all([loadAlbums(selEventId), loadMedia(page)]);
    setRefreshing(false);
  }, [selEventId, loadAlbums, loadMedia, page]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isFilterResetRef = useRef(false);

  // Effect 1: filters changed
  useEffect(() => {
    if (initialising) return;
    loadAlbums(selEventId);
    isFilterResetRef.current = true;
    setPage(1);
    loadMedia(1);
  }, [
    selEventId,
    selCategory,
    selType,
    keyword,
    selectedAlbumId,
    refreshKey,
    initialising,
  ]);

  // Effect 2: page arrow navigation only
  const prevPageRef = useRef(1);
  useEffect(() => {
    if (initialising) return;
    if (isFilterResetRef.current) {
      isFilterResetRef.current = false;
      prevPageRef.current = 1;
      return; // filter effect already called loadMedia(1)
    }
    if (page === prevPageRef.current) return;
    prevPageRef.current = page;
    loadMedia(page);
  }, [page, loadMedia, initialising]);

  const handleTabPress = useCallback(
    idx => {
      if (idx === 1) {
        setSearchOpen(true);
        setActiveTab(1);
      } else if (idx === 2) {
        setUploadOpen(true);
        setActiveTab(0);
      } else if (idx === 3) {
        loadAlbums(selEventId);
        setAlbumsOpen(true);
        setActiveTab(3);
      } else {
        // Home tab — reset everything and force reload
        setActiveTab(0);
        setSearchOpen(false);
        setKeyword('');
        setSelType('');
        setSelCategory('all');
        setSelectedAlbumId(null);
        loadingRef.current = false;
        setRefreshKey(k => k + 1); // force reload even if all filters already at default
      }
    },
    [loadAlbums, selEventId],
  );

  const handleLightboxLike = useCallback(result => {
    setMedia(prev =>
      prev.map(m =>
        m.mediaId === result.mediaId
          ? {...m, isLiked: result.isLiked, likeCount: result.likeCount}
          : m,
      ),
    );
  }, []);

  const handleMediaDeleted = useCallback(
    mediaId => {
      setLightboxMedia(null);
      setMedia(prev => prev.filter(m => m.mediaId !== mediaId));
      loadStats();
    },
    [loadStats],
  );

  const handleAllUploaded = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleAlbumCreated = useCallback(
    album => {
      if (album) {
        setAlbums(prev => [album, ...prev]);
        loadAlbums(selEventId);
      }
    },
    [loadAlbums, selEventId],
  );

  const handleAlbumEdited = useCallback(updatedAlbum => {
    if (updatedAlbum) {
      setAlbums(prev =>
        prev.map(a =>
          a.albumId === updatedAlbum.albumId ? {...a, ...updatedAlbum} : a,
        ),
      );
    }
  }, []);

  const handleAlbumPress = useCallback(album => {
    setSelectedAlbumId(album.albumId);
    setAlbumsOpen(false);
    setActiveTab(0);
  }, []);

  const handleDeleteAlbum = useCallback(
    async album => {
      Alert.alert('Delete Album', 'Are you sure?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteAlbum(album.albumId);
              if (res.status) {
                NOTIFY_MESSAGE(res?.message || 'Album deleted successfully.');
                loadAlbums(selEventId);
              } else {
                NOTIFY_MESSAGE(res?.message || 'Failed to delete album.');
              }
            } catch (error) {
              NOTIFY_MESSAGE(error?.message || 'Failed to delete album.');
            }
          },
        },
      ]);
    },
    [loadAlbums, selEventId],
  );

  // ── List header ─────────────────────────────────────────────────────────────
  const ListHeader = useCallback(
    () => (
      <View style={{backgroundColor: COLORS.BACKGROUNDCOLOR, marginBottom: 2}}>
        {/* Stats pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={gs.statsRow}>
          <StatPill icon="🖼️" label="Total" value={totalMedia} />
          <StatPill icon="📷" label="Photos" value={photosCount} />
          <StatPill icon="🎬" label="Videos" value={videosCount} />
          <StatPill icon="⭐" label="Starred" value="–" />
          <StatPill
            icon="💾"
            label="Storage"
            value={formatStorage(totalStorage)}
          />
        </ScrollView>

        {/* Type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={gs.filterRow}>
          {[
            {key: '', label: '🌐  All'},
            {key: 'image', label: '📷  Photos'},
            {key: 'video', label: '🎬  Videos'},
            {key: 'starred', label: '⭐  Starred'},
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[gs.filterChip, selType === f.key && gs.filterChipActive]}
              onPress={() => {
                setPage(1);
                setSelType(f.key);
              }}
              activeOpacity={0.8}>
              <Text
                style={[
                  gs.filterChipTxt,
                  selType === f.key && gs.filterChipTxtActive,
                ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Album filter banner */}
        {selectedAlbumId ? (
          <View style={gs.albumFilterBanner}>
            <Text style={gs.albumFilterTxt}>
              📁{' '}
              {albums.find(a => a.albumId === selectedAlbumId)?.name || 'Album'}
            </Text>
            <TouchableOpacity onPress={() => setSelectedAlbumId(null)}>
              <Text style={gs.albumFilterClear}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {/* NEW — Keyword filter banner */}
        {keyword ? (
          <View style={gs.albumFilterBanner}>
            <Text style={gs.albumFilterTxt}>🔍 "{keyword}"</Text>
            <TouchableOpacity onPress={() => setKeyword('')}>
              <Text style={gs.albumFilterClear}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    ),
    [
      categories,
      selCategory,
      selEventId,
      selectedEventName,
      totalMedia,
      photosCount,
      videosCount,
      totalStorage,
      selType,
      selectedAlbumId,
      albums,
      keyword,
    ],
  );

  if (initialising) {
    return (
      <View style={[gs.root, gs.centred]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.BACKGROUNDCOLOR}
        />
        <ActivityIndicator color={COLORS.TITLECOLOR} size="large" />
        <Text style={gs.initTxt}>Loading gallery…</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      {/* ── Header ── */}

      <View style={gs.header}>
        <View style={gs.headerLeft}>
          <TouchableOpacity
            style={gs.headerIconBtn}
            onPress={() => navigation.goBack()}>
            <FontAwesome6
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
              iconStyle="solid"
            />
          </TouchableOpacity>
          <View style={gs.logoCircle}>
            <Text style={gs.logoTxt}>EMS</Text>
          </View>
          <TouchableOpacity
            style={gs.eventPickerBtn}
            onPress={() => events.length > 0 && setEventPickerOpen(true)}
            activeOpacity={events.length > 0 ? 0.8 : 1}>
            <Text style={gs.eventPickerName} numberOfLines={1}>
              {selectedEventName ||
                (events.length === 0 ? 'No events' : 'Event')}
            </Text>
            {events.length > 0 && <Text style={gs.eventPickerArrow}>▾</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={gs.headerIconBtn}
          onPress={() => handleTabPress(1)}
          disabled={uploadQueue.running}
          activeOpacity={0.8}>
          <Text
            style={[gs.headerIconTxt, uploadQueue.running && {opacity: 0.35}]}>
            🔍
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category story row */}
      {categories?.length > 0 && (
        <View style={gs.catRow}>
          <ScrollView
            horizontal
            style={{height: 94}} // Fixed ScrollView height
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{}}>
            {categories.map(cat => (
              <CategoryBubble
                key={cat.categoryId}
                cat={cat}
                selected={selCategory === cat.categoryId}
                // onPress={setSelCategory}
                onPress={id => {
                  setKeyword('');
                  setPage(1);
                  setSelCategory(prev => (prev === id ? 'all' : id));
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Media grid ── */}
      <View style={{flex: 1}}>
        <FlatList
          // refreshing={refreshing}
          // onRefresh={handleRefresh}
          data={media}
          numColumns={3}
          keyExtractor={item => String(item.mediaId)}
          renderItem={({item: mediaItem, index}) => (
            <MediaTile
              item={mediaItem}
              onPress={setLightboxMedia}
              index={index}
            />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={gs.gridContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          ListEmptyComponent={() => {
            if (mediaLoading) {
              return (
                <View style={gs.skeletonGrid}>
                  {Array.from({length: expectedCount}).map((_, i) => (
                    <SkeletonTile key={i} />
                  ))}
                </View>
              );
            }

            // Filter-aware empty states
            const emptyConfig = (() => {
              if (selType === 'starred') {
                return {
                  emoji: '⭐',
                  title: 'No starred media',
                  sub: 'Star photos or videos to find them here quickly',
                };
              }
              if (selType === 'image') {
                return {
                  emoji: '📷',
                  title: 'No photos yet',
                  sub:
                    item?.write || isAdmin
                      ? 'Tap ⬆️ to upload your first photo'
                      : 'No photos have been shared yet',
                };
              }
              if (selType === 'video') {
                return {
                  emoji: '🎬',
                  title: 'No videos yet',
                  sub:
                    item?.write || isAdmin
                      ? 'Tap ⬆️ to upload your first video'
                      : 'No videos have been shared yet',
                };
              }
              if (keyword) {
                return {
                  emoji: '🔍',
                  title: `No results for "${keyword}"`,
                  sub: 'Try a different search term',
                };
              }
              if (selectedAlbumId) {
                return {
                  emoji: '📁',
                  title: 'This album is empty',
                  sub:
                    item?.write || isAdmin
                      ? 'Tap ⬆️ to add media to this album'
                      : 'No media has been added to this album yet',
                };
              }
              if (selCategory !== 'all') {
                return {
                  emoji: '📂',
                  title: 'No media in this category',
                  sub: 'Try selecting a different category',
                };
              }
              return {
                emoji: '🖼️',
                title: 'No media yet',
                sub:
                  item?.write || isAdmin
                    ? 'Tap ⬆️ to upload your first photo or video'
                    : 'No media has been shared yet',
              };
            })();

            return (
              <View style={gs.emptyState}>
                <Text style={gs.emptyStateEmoji}>{emptyConfig.emoji}</Text>
                <Text style={gs.emptyStateTitle}>{emptyConfig.title}</Text>
                <Text style={gs.emptyStateSub}>{emptyConfig.sub}</Text>
              </View>
            );
          }}
        />
        {/* Floating pagination arrows */}
        {!mediaLoading && totalPages > 1 && (
          <View
            style={[
              gs.floatPaginationRow,
              {bottom: showUploadBanner ? 120 : 70},
            ]}
            pointerEvents="box-none">
            {/* Left arrow */}
            <TouchableOpacity
              style={[
                gs.floatArrow,
                (page === 1 || mediaLoading) && gs.floatArrowDisabled,
              ]}
              disabled={page === 1 || mediaLoading}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              activeOpacity={0.8}>
              <Text style={gs.floatArrowTxt}>‹</Text>
            </TouchableOpacity>

            {/* Page pill */}
            <View style={gs.floatPagePill}>
              <Text style={gs.floatPagePillTxt}>
                {page} / {totalPages}
              </Text>
            </View>

            {/* Right arrow */}
            <TouchableOpacity
              style={[
                gs.floatArrow,
                (!hasMore || mediaLoading) && gs.floatArrowDisabled,
              ]}
              disabled={!hasMore || mediaLoading}
              onPress={() => setPage(p => p + 1)}
              activeOpacity={0.8}>
              <Text style={gs.floatArrowTxt}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showUploadBanner && (
        <View style={gs.uploadBanner}>
          {uploadQueue.running ? (
            <>
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{marginRight: 8}}
              />
              <Text style={gs.uploadBannerTxt}>
                Uploading {uploadQueue.done}/{uploadQueue.total}…
              </Text>
              {/* Cancel button */}
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Cancel Upload',
                    'Stop uploading remaining files?',
                    [
                      {text: 'Continue', style: 'cancel'},
                      {
                        text: 'Stop',
                        style: 'destructive',
                        onPress: () => {
                          cancelUpload();
                          clearCompleted();
                        },
                      },
                    ],
                  );
                }}
                style={gs.uploadBannerCancelBtn}
                activeOpacity={0.8}>
                <Text style={gs.uploadBannerCancelTxt}>✕ Stop</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
              activeOpacity={0.85}
              onPress={clearCompleted}>
              <Text style={gs.uploadBannerTxt}>
                ✓ {uploadQueue.done}/{uploadQueue.total} uploaded
                {uploadQueue.errors.length > 0
                  ? ` · ${uploadQueue.errors.length} failed`
                  : ''}
              </Text>
              <Text style={gs.uploadBannerDismiss}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Custom bottom tab bar ── */}
      <View style={gs.bottomTabBar}>
        {TABS.filter(
          tab =>
            !(
              (tab.label === 'Upload' || tab.label === 'Albums') &&
              events.length === 0
            ) && !(tab.label === 'Upload' && !item?.write && !isAdmin),
        ).map(tab => {
          const isDisabled = uploadQueue.running && tab.label !== 'Home';
          return (
            <TouchableOpacity
              key={tab.idx}
              style={[gs.tabItem, isDisabled && {opacity: 0.35}]}
              onPress={() => handleTabPress(tab.idx)}
              disabled={isDisabled}
              activeOpacity={0.8}>
              <Text
                style={[gs.tabIcon, activeTab === tab.idx && gs.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text
                style={[
                  gs.tabLabel,
                  activeTab === tab.idx && gs.tabLabelActive,
                ]}>
                {tab.label}
              </Text>
              {activeTab === tab.idx && <View style={gs.tabActiveBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {searchOpen && (
        <Modal
          visible={searchOpen}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setSearchOpen(false)}>
          <GallerySearchScreen
            onClose={() => {
              setSearchOpen(false);
              setActiveTab(0);
              setKeyword('');
            }}
            onMediaPress={(item, searchQuery) => {
              setSearchOpen(false);
              setActiveTab(0);
              setKeyword(searchQuery);
            }}
            onAlbumPress={album => {
              setSearchOpen(false);
              setActiveTab(0);
              setKeyword('');
              setSelectedAlbumId(album.albumId);
            }}
            onCategorySelect={cat => {
              setSearchOpen(false);
              setActiveTab(0);
              setKeyword('');
              setSelCategory(cat.categoryId);
            }}
            eventId={selEventId}
          />
        </Modal>
      )}
      {/* ── Modals / Overlays ── */}
      <EventPickerModal
        visible={eventPickerOpen}
        events={events}
        selected={selEventId}
        onSelect={id => {
          setSelEventId(id);
          setPage(1);
          setMedia([]);
          setSelType('');
          setKeyword('');
          setSelCategory('all');
          setSelectedAlbumId(null);
          setRefreshKey(k => k + 1);
        }}
        onClose={() => setEventPickerOpen(false)}
      />

      <GalleryUploadSheet
        visible={uploadOpen}
        onClose={() => setUploadOpen(false)}
        events={events}
        albums={albums}
        selectedEventId={selEventId}
        onAllDone={handleAllUploaded}
        onCategoriesChanged={loadCategories}
        canWrite={item?.write}
        isAdmin={isAdmin}
        currentUserId={
          user?.user ? user?.user?.userId : user?.member?.configurationId
        }
      />
      <AlbumsOverlay
        visible={albumsOpen}
        albums={albums}
        loading={albumsLoading}
        canWrite={item?.write}
        isAdmin={isAdmin}
        onClose={() => {
          setAlbumsOpen(false);
          setActiveTab(0);
        }}
        onCreateAlbum={() => {
          setCreateAlbumOpen(true);
        }}
        onAlbumPress={handleAlbumPress}
        onEditAlbum={album => {
          setEditingAlbum(album);
          setEditAlbumOpen(true);
        }}
        onDeleteAlbum={handleDeleteAlbum}
        createAlbum={
          <CreateAlbumSheet
            visible={createAlbumOpen}
            onClose={() => setCreateAlbumOpen(false)}
            onCreated={handleAlbumCreated}
            selectedEvent={events?.find(item => item.id == selEventId)}
          />
        }
        editAlbum={
          <CreateAlbumSheet
            visible={editAlbumOpen}
            album={editingAlbum}
            onClose={() => {
              setEditAlbumOpen(false);
              setEditingAlbum(null);
            }}
            onEdited={handleAlbumEdited}
            selectedEvent={events?.find(item => item.id == selEventId)}
          />
        }
        currentUserId={
          user?.user ? user?.user?.userId : user?.member?.configurationId
        }
      />

      {lightboxMedia && (
        <GalleryLightbox
          media={lightboxMedia}
          mediaList={media}
          initialIndex={media.findIndex(
            m => m.mediaId === lightboxMedia.mediaId,
          )}
          user={user}
          currentUserId={
            user?.user ? user?.user?.userId : user?.member?.configurationId
          }
          canWrite={item?.write}
          onClose={() => setLightboxMedia(null)}
          onLikeToggled={handleLightboxLike}
          onDeleted={handleMediaDeleted}
          isAdmin={isAdmin}
          filterType={selType}
          onStarToggled={(mediaId, isStarred) => {
            if (selType === 'starred' && !isStarred) {
              setMedia(prev => prev.filter(m => m.mediaId !== mediaId));
              setLightboxMedia(null);
              loadStats();
            }
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  uploadBannerCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  uploadBannerCancelTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    includeFontPadding: false,
  },
  uploadBanner: {
    position: 'absolute',
    bottom: 64, // just above tab bar
    left: 12,
    right: 12,
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  uploadBannerTxt: {
    flex: 1,
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
    includeFontPadding: false,
  },
  uploadBannerDismiss: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONTS.FONTSIZE.SMALL,
    paddingLeft: 8,
  },
  floatPaginationRow: {
    position: 'absolute',
    bottom: 70, // ← above the tab bar
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  floatArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatArrowDisabled: {
    backgroundColor: 'rgba(220,220,228,0.7)',
    shadowOpacity: 0,
    elevation: 0,
  },
  floatArrowTxt: {
    color: COLORS.TITLECOLOR,
    fontSize: 28,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 32,
    textAlign: 'center',
  },
  floatPagePill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  floatPagePillTxt: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
    includeFontPadding: false,
  },
  root: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  centred: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  initTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#e8e8ee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.TITLECOLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
  },
  eventPickerBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1},
  eventPickerName: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    flex: 1,
    includeFontPadding: false,
  },
  eventPickerArrow: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.MINI,
  },
  headerIconBtn: {padding: 6},
  headerIconTxt: {fontSize: FONTS.FONTSIZE.SEMI},

  // Category bubbles
  catRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderBottomWidth: 1,
    borderColor: COLORS.INPUTBORDER,
    height: 94,
  },
  catItem: {alignItems: 'center', gap: 5, width: 64},
  catBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    overflow: 'hidden',
  },
  catBubbleActive: {borderColor: COLORS.TITLECOLOR, borderWidth: 3},
  catBubbleImg: {width: '100%', height: '100%'},
  catBubblePlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBubbleEmoji: {fontSize: FONTS.FONTSIZE.LARGE},
  catLabel: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    textAlign: 'center',
  },
  catLabelActive: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },

  // Stats pills
  statsRow: {
    gap: 10,
    padding: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARYWHITE || '#f5f5fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
  },
  statPillIcon: {fontSize: FONTS.FONTSIZE.MEDIUM},
  statPillValue: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  statPillLabel: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    includeFontPadding: false,
  },
  statPillLabelActive: {color: 'rgba(255,255,255,0.8)'},

  // Filter chips
  filterRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    backgroundColor: COLORS.PRIMARYWHITE,
  },
  filterChipActive: {
    backgroundColor: COLORS.TITLECOLOR,
    borderColor: COLORS.TITLECOLOR,
  },
  filterChipTxt: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.MINI,
    includeFontPadding: false,
  },
  filterChipTxtActive: {color: '#fff'},
  // Album filter banner
  albumFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.TITLECOLOR + '12',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.TITLECOLOR + '44',
  },
  albumFilterTxt: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.MINI,
  },
  albumFilterClear: {
    color: COLORS.PRIMARYRED || '#e05c5c',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
  },

  // Grid
  gridContent: {paddingBottom: 120},
  tile: {margin: 1, backgroundColor: '#eee'},
  tileImg: {width: '100%', height: '100%'},
  videoTileBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconTxt: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    marginLeft: 2,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#12121e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbInner: {
    alignItems: 'center',
    gap: 4,
  },
  videoThumbIcon: {
    fontSize: 44,
  },
  likedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  likedBadgeTxt: {color: 'red', fontSize: FONTS.FONTSIZE.TOOSMALL},
  footerLoader: {paddingVertical: 18, alignItems: 'center'},
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyStateEmoji: {fontSize: 40, marginBottom: 4},
  emptyStateTitle: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MEDIUM,
    includeFontPadding: false,
  },
  emptyStateSub: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    textAlign: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SW,
    gap: 0,
  },
  tileErrorWrap: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileErrorImg: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  // Bottom tab bar
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.INPUTBORDER || '#eee',
    paddingBottom: 4,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 2,
  },
  tabIcon: {fontSize: FONTS.FONTSIZE.LARGE},
  tabIconActive: {},
  tabLabel: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -2,
    left: '30%',
    right: '30%',
    height: 3,
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 2,
  },

  // Event picker modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  eventSheetSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Shadow
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  eventPickerSheet: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.INPUTBORDER || '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  eventPickerTitle: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
  },
  eventPickerEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  eventPickerEmptyTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL,
  },
  eventPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
  },
  eventPickerItemActive: {backgroundColor: COLORS.TITLECOLOR + '0D'},
  eventPickerItemTxt: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL,
  },
  eventPickerItemTxtActive: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  checkmark: {
    color: COLORS.TITLECOLOR,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
});
