import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {fetchMedia, fetchAlbums, fetchCategoriesFromAPI} from './GalleryAPI';
import FastImage from 'react-native-fast-image';
import {IMAGE_URL} from '../../connection/Config';

const {width: SW} = Dimensions.get('window');
const PHOTO_TILE = (SW - 4) / 3.26;

let _recentSearches = [];

const FILTER_TABS = [
  {key: 'all', label: 'All'},
  {key: 'image', label: 'Photos'},
  {key: 'album', label: 'Albums'},
  {key: 'category', label: 'Categories'},
];

const PhotoTile = React.memo(({item, onPress}) => {
  const isVideo = item.mediaType === 'video';
  const uri = item.filePath ? IMAGE_URL + item.filePath : null;
  const [imgState, setImgState] = useState('loading');
  const [thumbUri, setThumbUri] = useState(null);

  useEffect(() => {
    setImgState('loading');
    setThumbUri(null);

    if (!isVideo || !uri) return;

    try {
      const {createThumbnail} = require('react-native-create-thumbnail');
      createThumbnail({url: uri, timeStamp: 0})
        .then(res => {
          setThumbUri(res.path);
          setImgState('loaded');
        })
        .catch(() => setImgState('error'));
    } catch {
      setImgState('error');
    }
  }, [item.mediaId, isVideo, uri]);

  const handleLoad = () => setImgState('loaded');
  const handleError = () => setImgState('error');

  const displayUri = isVideo ? thumbUri : uri;

  return (
    <TouchableOpacity
      style={ss.photoTile}
      activeOpacity={0.85}
      onPress={() => onPress(item)}>
      {imgState === 'loading' && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, {backgroundColor: '#d0d0da'}]}
        />
      )}
      {imgState === 'error' || !displayUri ? (
        <View style={ss.videoFallback}>
          <Text style={{fontSize: 28}}>🎬</Text>
        </View>
      ) : (
        <FastImage
          source={{uri: displayUri}}
          style={ss.photoTileImg}
          resizeMode="cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {isVideo && imgState !== 'error' && (
        <View style={ss.videoOverlay}>
          <Text style={ss.videoIcon}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const AlbumCard = React.memo(({album, onPress}) => (
  <TouchableOpacity
    style={ss.albumCard}
    activeOpacity={0.85}
    onPress={() => onPress(album)}>
    {album.coverUrl ? (
      <FastImage
        source={{uri: IMAGE_URL + album.coverUrl}}
        style={ss.albumCardImg}
        resizeMode="cover"
      />
    ) : (
      <View style={ss.albumCardImgPlaceholder}>
        <Text style={{fontSize: 24}}>📁</Text>
      </View>
    )}
    <View style={ss.albumCardInfo}>
      <Text style={ss.albumCardName} numberOfLines={1}>
        {album.name}
      </Text>
      <Text style={ss.albumCardMeta}>
        {album.mediaCount ?? 0} photos · {album.eventName || 'Category'}
      </Text>
    </View>
  </TouchableOpacity>
));

const CatChip = React.memo(({cat, onPress}) => (
  <TouchableOpacity
    style={ss.catChip}
    activeOpacity={0.8}
    onPress={() => onPress(cat)}>
    <Text style={ss.catChipEmoji}>{cat.icon || cat.emoji || '📁'}</Text>
    <Text style={ss.catChipTxt}>{cat.name}</Text>
  </TouchableOpacity>
));

export default function GallerySearchScreen({
  onClose,
  onMediaPress,
  onAlbumPress,
  onCategorySelect,
  eventId,
}) {
  const inputRef = useRef(null);
  const searchTimer = useRef(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState([..._recentSearches]);
  const [photoResults, setPhotoResults] = useState([]);
  const [photoTotal, setPhotoTotal] = useState(0);
  const [allCategories, setAllCategories] = useState([]);
  const [albumResults, setAlbumResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);

  const hasQuery = query.trim().length > 0;
  const hasResults =
    photoResults.length > 0 ||
    albumResults.length > 0 ||
    categoryResults.length > 0;

  useEffect(() => {
    _recentSearches = [];
    setRecents([]);
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchCategoriesFromAPI();
        if (res.status) setAllCategories(res.result?.data || []);
      } catch {}
    })();
  }, []);

  const saveRecent = useCallback(q => {
    if (!q.trim()) return;
    // Deduplicate, keep newest first, max 4
    _recentSearches = [q, ..._recentSearches.filter(r => r !== q)].slice(0, 4);
    setRecents([..._recentSearches]);
  }, []);

  const runSearch = useCallback(
    async q => {
      if (!q.trim()) {
        setPhotoResults([]);
        setAlbumResults([]);
        setCategoryResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const [mediaRes, albumRes] = await Promise.allSettled([
          fetchMedia({
            pageNumber: 1,
            pageSize: 9,
            keyword: q,
            eventId: eventId || null,
          }),
          fetchAlbums(eventId || ''),
        ]);

        if (mediaRes.status === 'fulfilled' && mediaRes.value?.status) {
          setPhotoResults(mediaRes.value.result?.data || []);
          setPhotoTotal(mediaRes.value.result?.totalRecord || 0); // ← ADD
        }
        if (albumRes.status === 'fulfilled' && albumRes.value?.status) {
          const all = albumRes.value.result?.data || [];

          setAlbumResults(
            all.filter(a => a.name?.toLowerCase().includes(q.toLowerCase())),
          );
        }
        setCategoryResults(
          allCategories.filter(c =>
            c.name?.toLowerCase().includes(q.toLowerCase()),
          ),
        );
      } finally {
        setSearching(false);
      }
    },
    [allCategories],
  );

  const handleQueryChange = useCallback(
    text => {
      setQuery(text);
      clearTimeout(searchTimer.current);
      if (!text.trim()) {
        setPhotoTotal(0);
        setPhotoResults([]);
        setAlbumResults([]);
        setCategoryResults([]);
        return;
      }
      searchTimer.current = setTimeout(() => runSearch(text), 350);
    },
    [runSearch],
  );

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    saveRecent(q);
    runSearch(q);
  }, [query, saveRecent, runSearch]);

  const handleRecentTap = useCallback(
    r => {
      setQuery(r);
      saveRecent(r);
      runSearch(r);
    },
    [saveRecent, runSearch],
  );

  const clearQuery = useCallback(() => {
    setQuery('');
    setPhotoResults([]);
    setAlbumResults([]);
    setCategoryResults([]);
    inputRef.current?.focus();
  }, []);

  const showPhotos = activeFilter === 'all' || activeFilter === 'image';
  const showAlbums = activeFilter === 'all' || activeFilter === 'album';
  const showCats = activeFilter === 'all' || activeFilter === 'category';

  const visPhotos = showPhotos ? photoResults : [];
  const visAlbums = showAlbums ? albumResults : [];
  const visCats = showCats ? categoryResults : [];

  return (
    <SafeAreaProvider style={{flex: 1}}>
      <SafeAreaView style={ss.root} edges={['top', 'bottom']}>
        <View style={ss.searchRow}>
          <View style={ss.searchBox}>
            <Text style={ss.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={ss.searchInput}
              placeholder="Search photos, albums, categories..."
              placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
              value={query}
              onChangeText={handleQueryChange}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={clearQuery}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <View style={ss.clearBtn}>
                  <Text style={ss.clearBtnTxt}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={ss.cancelBtn}>
            <Text style={ss.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={ss.tabRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[ss.tab, activeFilter === tab.key && ss.tabActive]}
              onPress={() => setActiveFilter(tab.key)}
              activeOpacity={0.8}>
              <Text
                style={[
                  ss.tabTxt,
                  activeFilter === tab.key && ss.tabTxtActive,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={ss.divider} />

        {searching ? (
          <View style={ss.centred}>
            <ActivityIndicator color={COLORS.TITLECOLOR} />
          </View>
        ) : !hasQuery ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={ss.recentScroll}>
            {recents.length > 0 && (
              <>
                <Text style={ss.sectionLabel}>RECENT</Text>
                {recents.map((r, i) => (
                  <TouchableOpacity
                    key={i}
                    style={ss.recentItem}
                    onPress={() => handleRecentTap(r)}
                    activeOpacity={0.7}>
                    <Text style={ss.recentIcon}>🕐</Text>
                    <Text style={ss.recentTxt}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        ) : !hasResults ? (
          <View style={ss.centred}>
            <Text style={ss.noResultsEmoji}>🔍</Text>
            <Text style={ss.noResultsTxt}>No results for "{query}"</Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={ss.resultScroll}>
            {visPhotos.length > 0 && (
              <View style={ss.section}>
                <View style={ss.sectionHeaderRow}>
                  <Text style={ss.sectionLabel}>PHOTOS ({photoTotal})</Text>
                  {photoTotal > 9 && (
                    <TouchableOpacity
                      onPress={() => onMediaPress(null, query)}
                      activeOpacity={0.7}>
                      <Text style={ss.viewAllTxt}>View All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={ss.photoGrid}>
                  {visPhotos.map(item => (
                    <PhotoTile
                      key={String(item.mediaId)}
                      item={item}
                      onPress={item => onMediaPress(item, query)}
                    />
                  ))}
                </View>
              </View>
            )}

            {visAlbums.length > 0 && (
              <View style={ss.section}>
                <Text style={ss.sectionLabel}>ALBUMS</Text>
                {visAlbums.map(album => (
                  <AlbumCard
                    key={String(album.albumId)}
                    album={album}
                    onPress={onAlbumPress}
                  />
                ))}
              </View>
            )}

            {/* Categories */}
            {visCats.length > 0 && (
              <View style={ss.section}>
                <Text style={ss.sectionLabel}>CATEGORIES</Text>
                <View style={ss.catRow}>
                  {visCats.map(cat => (
                    <CatChip
                      key={String(cat.categoryId)}
                      cat={cat}
                      onPress={onCategorySelect}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={{height: 32}} />
          </ScrollView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const ss = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.PRIMARYWHITE},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 6,
    minHeight: 40,
  },
  searchIcon: {fontSize: 14},
  searchInput: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    paddingVertical: 0,
    includeFontPadding: false,
    height: 38,
  },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.PLACEHOLDERCOLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnTxt: {color: '#fff', fontSize: 9},
  cancelBtn: {paddingVertical: 8},
  cancelTxt: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
  },
  // Filter tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    backgroundColor: COLORS.PRIMARYWHITE,
  },
  tabActive: {
    backgroundColor: COLORS.TITLECOLOR,
    borderColor: COLORS.TITLECOLOR,
  },
  tabTxt: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    includeFontPadding: false,
  },
  tabTxtActive: {color: '#fff'},
  divider: {height: 1, backgroundColor: COLORS.INPUTBORDER || '#eee'},
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  noResultsEmoji: {fontSize: 38},
  noResultsTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
  },

  // Recents
  recentScroll: {flex: 1},
  sectionLabel: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#f0f0f0',
    gap: 10,
  },
  recentIcon: {fontSize: FONTS.FONTSIZE.SMALL, opacity: 0.5},
  recentTxt: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL,
    includeFontPadding: false,
  },

  // Results
  resultScroll: {flex: 1},
  section: {marginBottom: 6},
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 14,
  },
  viewAllTxt: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
  },

  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 2,
  },
  photoTile: {
    width: PHOTO_TILE,
    height: PHOTO_TILE,
    margin: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  photoTileImg: {width: '100%', height: '100%'},
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  videoFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#12121e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {color: '#fff', fontSize: FONTS.FONTSIZE.MEDIUM},

  // Albums
  albumCard: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginVertical: 4,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
  },
  albumCardImg: {width: 76, height: 76},
  albumCardImgPlaceholder: {
    width: 76,
    height: 76,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCardInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 3,
  },
  albumCardName: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
  },
  albumCardMeta: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
  },

  // Categories
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 8,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    backgroundColor: COLORS.TITLECOLOR,
  },
  catChipEmoji: {fontSize: FONTS.FONTSIZE.SMALL},
  catChipTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
    includeFontPadding: false,
  },
});
