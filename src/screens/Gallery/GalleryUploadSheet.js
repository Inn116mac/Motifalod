import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  PermissionsAndroid,
  KeyboardAvoidingView,
  FlatList,
  Image,
} from 'react-native';
import {
  fetchCategoriesFromAPI,
  updateCategory,
  createCategory,
  deleteCategory,
} from './GalleryAPI';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import CustomModal from '../../components/root/CustomModal';
import {createThumbnail} from 'react-native-create-thumbnail';
import {enqueueUpload, subscribeUpload} from './GalleryUploadQueue';

const PLACEHOLDER = require('../../assets/images/Image_placeholder.png');

// Reuse same thumb cache/queue pattern as GalleryScreen
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

let launchImageLibrary = null;
let launchCamera = null;
try {
  ({launchImageLibrary, launchCamera} = require('react-native-image-picker'));
} catch {}

const {height: SH, width: SW} = Dimensions.get('window');

const EMOJIS = [
  '🎤',
  '🛠️',
  '🤝',
  '🏆',
  '🎪',
  '🎬',
  '📸',
  '💡',
  '🌟',
  '🎯',
  '🎨',
  '🎵',
  '🖼️',
  '🎭',
  '🏅',
  '🔬',
];

// ─── Inline picker ────────────────────────────────────────────────────────────
function SheetPicker({
  label,
  items,
  value,
  onSelect,
  keyField = 'id',
  labelField = 'name',
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    items.find(i => String(i[keyField]) === String(value))?.[labelField] ||
    label;

  return (
    <>
      <TouchableOpacity
        style={ups.pickBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={ups.pickTxt} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Text style={ups.pickArrow}>▾</Text>
      </TouchableOpacity>
      <Modal
        transparent
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={ups.pickBackdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <View style={[ups.pickSheet]}>
          <View style={ups.pickHandle} />
          <Text style={ups.pickSheetTitle}>{label}</Text>
          <ScrollView style={{maxHeight: SH * 0.45}} bounces={false}>
            <TouchableOpacity
              style={ups.pickItem}
              onPress={() => {
                onSelect(null);
                setOpen(false);
              }}>
              <Text style={[ups.pickItemTxt, !value && ups.pickItemActive]}>
                — None —
              </Text>
              {!value && <Text style={ups.pickCheck}>✓</Text>}
            </TouchableOpacity>
            {items.map(i => (
              <TouchableOpacity
                key={i[keyField]}
                style={ups.pickItem}
                onPress={() => {
                  onSelect(i[keyField]);
                  setOpen(false);
                }}>
                <Text
                  style={[
                    ups.pickItemTxt,
                    String(value) === String(i[keyField]) && ups.pickItemActive,
                  ]}>
                  {i.emoji ? `${i.emoji}  ` : ''}
                  {i[labelField]}
                </Text>
                {String(value) === String(i[keyField]) && (
                  <Text style={ups.pickCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function CategoryFormModal({visible, category, onClose, onSaved}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);

  // reset fields every time modal opens
  useEffect(() => {
    if (visible) {
      setName(category?.name ?? '');
      setIcon(category?.icon ?? '');
    }
  }, [visible, category]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {name: name.trim(), icon, description: '', color: ''};

      const res = category?.categoryId
        ? await updateCategory(category.categoryId, payload)
        : await createCategory(payload);

      if (res.status) {
        onSaved();
        onClose();
      } else {
        Alert.alert('Error', res.message || 'Could not save category.');
      }
    } catch {
      Alert.alert('Error', 'Network error.');
    } finally {
      setSaving(false);
    }
  }, [name, icon, category, onSaved, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={ups.pickBackdrop}
        activeOpacity={1}
        // onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={ups.catFormKAV}>
        <View style={ups.catFormSheet}>
          <View style={ups.pickHandle} />
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            {/* ── Name ── */}
            <Text style={ups.catFormFieldLabel}>CATEGORY NAME *</Text>
            <TextInput
              style={ups.catFormInput}
              placeholder="e.g. Ceremony"
              placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
              value={name}
              onChangeText={setName}
              maxLength={60}
            />

            {/* ── Icon grid ── */}
            <Text style={[ups.catFormFieldLabel, {marginTop: 14}]}>
              CHOOSE ICON
            </Text>
            <View style={ups.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[ups.emojiBtn, icon === e && ups.emojiBtnActive]}
                  onPress={() => setIcon(icon === e ? '' : e)}
                  activeOpacity={0.8}>
                  <Text style={ups.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Preview ── */}
            {name.trim() || icon ? (
              <View style={ups.catPreviewRow}>
                <Text style={ups.catPreviewEmoji}>{icon || '📁'}</Text>
                <View>
                  <Text style={ups.catPreviewLabel}>PREVIEW</Text>
                  <Text style={ups.catPreviewName}>{name || 'Category'}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
          {/* ── Actions ── */}
          <View style={[ups.actions]}>
            <TouchableOpacity
              style={ups.cancelBtn}
              onPress={onClose}
              disabled={saving}>
              <Text style={ups.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ups.uploadBtn, saving && ups.btnDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={ups.uploadTxt}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ManageCategoriesModal({
  visible,
  onClose,
  onChanged,
  canWrite,
  isAdmin,
  currentUserId,
}) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCategoriesFromAPI();
      if (res.status) setCats(res.result?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleDelete = useCallback(
    cat => {
      Alert.alert('Delete Category', `Are you sure?`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteCategory(cat.categoryId);
            if (res.status) {
              load();
              onChanged();
            } else Alert.alert('Error', res.message || 'Could not delete.');
          },
        },
      ]);
    },
    [load, onChanged],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={ups.pickBackdrop}
        activeOpacity={1}
        // onPress={onClose}
      />
      <View style={ups.manageSheet}>
        <View style={ups.pickHandle} />

        {/* Header */}
        <View style={ups.manageHeaderRow}>
          <View>
            <Text style={ups.manageTitle}>Manage Categories</Text>
            <Text style={ups.manageSubtitle}>
              {cats.length} categor{cats.length !== 1 ? 'ies' : 'y'}
            </Text>
          </View>
          <TouchableOpacity style={ups.manageCloseBtn} onPress={onClose}>
            <Text style={ups.manageCloseTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={ups.divider} />

        {/* List */}
        {loading ? (
          <View style={ups.centred}>
            <ActivityIndicator color={COLORS.TITLECOLOR} />
          </View>
        ) : cats.length === 0 ? (
          <View style={ups.centred}>
            <Text style={{fontSize: 32}}>📂</Text>
            <Text style={ups.emptyTxt}>No categories yet</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
            {cats.map(cat => (
              <View key={String(cat.categoryId)} style={ups.manageCatRow}>
                <View style={ups.manageCatIconBox}>
                  <Text style={{fontSize: 20}}>{cat.icon || '📁'}</Text>
                </View>
                <Text style={ups.manageCatName} numberOfLines={1}>
                  {cat.name}
                </Text>
                {(isAdmin ||
                  (canWrite && currentUserId == cat.configurationId)) && (
                  <TouchableOpacity
                    style={ups.manageCatBtn}
                    onPress={() => {
                      setEditTarget(cat);
                      setFormOpen(true);
                    }}>
                    <Text style={{fontSize: 15}}>✏️</Text>
                  </TouchableOpacity>
                )}
                {(isAdmin ||
                  (canWrite && currentUserId == cat.configurationId)) && (
                  <TouchableOpacity
                    style={[ups.manageCatBtn, ups.manageCatDeleteBtn]}
                    onPress={() => handleDelete(cat)}>
                    <Text style={{fontSize: 15}}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View style={{height: 20}} />
          </ScrollView>
        )}
      </View>

      {/* Edit form layered on top */}
      <CategoryFormModal
        visible={formOpen}
        category={editTarget}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSaved={() => {
          load();
          onChanged();
        }}
      />
    </Modal>
  );
}

function CategoryGrid({
  categories,
  selected,
  onSelect,
  onAdd,
  onManage,
  loading,
  disabled,
  isAdmin,
  canWrite,
}) {
  // 3 columns, account for 16px horizontal padding on each side + 10px gap
  const COLS = 3;
  const TILE = (SW - 35 - (COLS - 1) * 10) / COLS;

  const handleManage = () => !disabled && onManage && onManage();
  const handleAdd = () => !disabled && onAdd && onAdd();

  return (
    <View>
      {/* Section header row: label left, Manage button right */}
      <View style={ups.catGridHeaderRow}>
        <Text style={ups.label}>CATEGORY</Text>
        {(isAdmin || canWrite) && (
          <TouchableOpacity
            style={[ups.managePill, disabled && {opacity: 0.4}]}
            onPress={handleManage}
            activeOpacity={0.8}
            disabled={disabled}>
            <Text style={ups.managePillTxt}>⚙️ Manage</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          color={COLORS.TITLECOLOR}
          style={{marginVertical: 14}}
        />
      ) : (
        <View style={ups.catGrid}>
          {categories.length === 0 && (
            <Text style={ups.catEmptyTxt}>No categories found</Text>
          )}
          {/* Existing category tiles */}
          {categories.map(cat => {
            const active = String(selected) === String(cat.categoryId);
            return (
              <TouchableOpacity
                key={String(cat.categoryId)}
                style={[
                  ups.catTile,
                  {width: TILE, height: 70},
                  active && ups.catTileActive,
                ]}
                onPress={() => onSelect(active ? null : cat.categoryId)}
                activeOpacity={0.8}>
                <Text style={ups.catTileEmoji}>{cat.icon || '📁'}</Text>
                <Text
                  style={[ups.catTileName, active && ups.catTileNameActive]}
                  numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* "+ New" tile — only for admin or canWrite */}
          {(isAdmin || canWrite) && (
            <TouchableOpacity
              style={[
                ups.catTile,
                ups.catTileNew,
                {width: TILE, height: 70},
                disabled && {opacity: 0.4},
              ]}
              onPress={handleAdd}
              activeOpacity={0.8}
              disabled={disabled}>
              <Text style={ups.catTileNewIcon}>＋</Text>
              <Text style={ups.catTileNewTxt}>New</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const FileTile = React.memo(
  ({asset, progress, status, onRemove, removeIndex}) => {
    const isVideo = (asset.type || '').startsWith('video/');
    const [thumbUri, setThumbUri] = useState(null);

    useEffect(() => {
      if (!isVideo || !asset.uri) return;

      // Check cache first
      const cached = videoThumbCache.get(asset.uri);
      if (cached && cached !== 'loading' && cached !== 'error') {
        setThumbUri(cached);
        return;
      }
      if (cached === 'loading' || cached === 'error') return;

      // Queue thumbnail generation
      videoThumbCache.set(asset.uri, 'loading');
      const capturedUri = asset.uri;

      enqueueThumb(() =>
        createThumbnail({url: capturedUri, timeStamp: 0})
          .then(res => {
            videoThumbCache.set(capturedUri, res.path);
            setThumbUri(res.path);
          })
          .catch(() => {
            videoThumbCache.set(capturedUri, 'error');
          }),
      );

      return () => {
        if (videoThumbCache.get(capturedUri) === 'loading') {
          videoThumbCache.delete(capturedUri);
        }
      };
    }, [isVideo, asset.uri]);

    return (
      <View style={ups.fileTile}>
        {isVideo ? (
          thumbUri ? (
            // Show generated thumbnail
            <Image
              source={{uri: thumbUri}}
              style={ups.fileTileImg}
              resizeMode="cover"
              resizeMethod="resize"
            />
          ) : (
            // Still generating — dark placeholder
            <View style={ups.fileTileVideo}>
              <Text style={{fontSize: 20}}>🎬</Text>
            </View>
          )
        ) : asset.uri ? (
          <Image
            source={{uri: asset.uri}}
            style={ups.fileTileImg}
            resizeMode="cover"
            resizeMethod="resize"
          />
        ) : (
          <Image
            source={PLACEHOLDER}
            style={ups.fileTileImg}
            resizeMode="cover"
          />
        )}
        <View style={ups.fileTileOverlay}>
          {status === 'done' && <Text style={ups.fileTileDone}>✓</Text>}
          {status === 'error' && <Text style={ups.fileTileErr}>✕</Text>}
          {status === 'uploading' && (
            <View style={ups.progBar}>
              <View style={[ups.progFill, {width: `${progress}%`}]} />
            </View>
          )}
        </View>
        {/* Play icon overlay for videos */}
        {isVideo && (
          <View style={ups.fileTilePlayOverlay}>
            <Text style={ups.fileTilePlayTxt}>▶</Text>
          </View>
        )}
        {status === 'idle' && (
          <TouchableOpacity
            style={ups.fileTileRemove}
            onPress={() => onRemove(removeIndex)}
            hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}>
            <Text style={ups.fileTileRemoveTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.status === next.status &&
    prev.progress === next.progress &&
    prev.asset.uri === next.asset.uri &&
    prev.removeIndex === next.removeIndex,
);

function showCameraChoice(openCamera) {
  Alert.alert('Capture', 'What would you like to capture?', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Photo', onPress: () => openCamera('photo')},
    {text: 'Video', onPress: () => openCamera('video')},
  ]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GalleryUploadSheet({
  visible,
  onClose,
  events,
  albums,
  selectedEventId,
  onAllDone,
  onCategoriesChanged,
  canWrite,
  isAdmin,
  currentUserId,
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [selAlbumId, setSelAlbumId] = useState(null);
  const [selCategoryId, setSelCategoryId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [manageCatsOpen, setManageCatsOpen] = useState(false);

  const [queueState, setQueueState] = useState({
    running: false,
    done: 0,
    total: 0,
    queue: [],
  });

  useEffect(() => {
    const unsub = subscribeUpload(setQueueState);
    return unsub;
  }, []);

  const uploading =
    queueState.running ||
    queueState.queue.some(
      i => i.status === 'pending' || i.status === 'uploading',
    );

  const loadCategories = useCallback(async () => {
    setCatsLoading(true);
    try {
      const res = await fetchCategoriesFromAPI();

      if (res.status) setCategories(res.result?.data ?? []);
    } finally {
      setCatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) loadCategories();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const resetAndClose = useCallback(() => {
    setAssets([]);
    setCaption('');
    setTags('');
    setSelAlbumId(null);
    setSelCategoryId(null);
    onClose();
  }, [onClose]);

  // ── Pick from library — MERGES with existing ─────────────────────────────
  const MAX_PICK = 200; // keep individual pick sessions reasonable
  const ABSOLUTE_MAX = 200; // total files we can safely hold

  const pickFiles = useCallback(() => {
    if (!launchImageLibrary) {
      Alert.alert('Package missing', 'Install react-native-image-picker.');
      return;
    }
    setAssetsLoading(true);
    launchImageLibrary(
      {mediaType: 'mixed', selectionLimit: MAX_PICK, quality: 0.85},
      response => {
        if (response.didCancel || response.errorCode) {
          setAssetsLoading(false);
          return;
        }
        const newAssets = response.assets || [];
        if (!newAssets.length) {
          setAssetsLoading(false);
          return;
        }

        // ── All validation OUTSIDE setAssets ──────────────────────────────
        setAssets(prev => {
          if (prev.length + newAssets.length > ABSOLUTE_MAX) {
            setTimeout(
              () =>
                Alert.alert(
                  'Too many files',
                  `Please select fewer files – max ${ABSOLUTE_MAX} in total.`,
                ),
              0,
            );
            return prev;
          }

          const existingUris = new Set(prev.map(a => a.uri));
          const fresh = newAssets.filter(a => !existingUris.has(a.uri));
          const merged = [...prev, ...fresh];

          const valid = merged.filter(a => {
            const isVideo = (a.type || '').startsWith('video/');
            const maxMB = isVideo ? 200 : 20;
            return (a.fileSize || 0) <= maxMB * 1024 * 1024;
          });

          const oversizedCount = merged.length - valid.length;
          if (oversizedCount > 0) {
            setTimeout(
              () =>
                Alert.alert(
                  'File too large',
                  `${oversizedCount} file(s) exceed the size limit (200MB for videos, 20MB for images) and were removed.`,
                ),
              0,
            );
          }

          const totalGB =
            valid.reduce((s, a) => s + (a.fileSize || 0), 0) /
            (1024 * 1024 * 1024);
          if (totalGB > 2) {
            setTimeout(
              () =>
                Alert.alert(
                  'Too large',
                  'Total size exceeds 2GB. Please select fewer files.',
                ),
              0,
            );
            return prev;
          }

          return valid;
        });

        setTimeout(() => setAssetsLoading(false), 600);
      },
    );
  }, []);

  const capturePhoto = useCallback(() => {
    if (!launchCamera) {
      Alert.alert('Package missing', 'Install react-native-image-picker.');
      return;
    }

    const openCamera = mediaType => {
      launchCamera(
        {mediaType, quality: 0.85, saveToPhotos: false, includeBase64: false},
        response => {
          if (response.didCancel) return;
          if (response.errorCode) {
            Alert.alert(
              'Camera Error',
              response.errorMessage || 'Unknown error',
            );
            return;
          }
          if (response.assets?.length) {
            setAssets(prev => [...prev, ...response.assets]);
          }
        },
      );
    };

    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA).then(
        hasPermission => {
          if (hasPermission) {
            showCameraChoice(openCamera);
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
              title: 'Camera Permission',
              message: 'App needs access to your camera.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }).then(result => {
              if (result === PermissionsAndroid.RESULTS.GRANTED) {
                showCameraChoice(openCamera);
              } else {
                Alert.alert('Permission Denied', 'Enable camera in Settings.');
              }
            });
          }
        },
      );
    } else {
      showCameraChoice(openCamera);
    }
  }, []);

  // ── Remove individual file ────────────────────────────────────────────────
  const removeAsset = useCallback(idx => {
    setAssets(prev => {
      const uri = prev[idx]?.uri;
      if (uri) {
        // setUploadState(p => {
        //   const n = {...p};
        //   delete n[uri];
        //   return n;
        // });
      }
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const handleUpload = useCallback(() => {
    if (!assets.length) {
      Alert.alert('No files selected');
      return;
    }

    // ── Size summary log ──────────────────────────────────────────────────
    const totalBytes = assets.reduce((sum, a) => sum + (a.fileSize || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(3);
    // console.log(`   Total  : ${totalMB} MB (${totalGB} GB)`);

    const selEvent = events?.find(
      e => String(e.id) === String(selectedEventId),
    );

    enqueueUpload({
      assets,
      eventId: selectedEventId || null,
      eventName: selEvent?.name || null,
      albumId: selAlbumId || null,
      categoryId: selCategoryId || null,
      caption: caption.trim() || null,
      onAllDone,
    });

    // Close sheet immediately — upload continues in background
    resetAndClose();
  }, [
    assets,
    events,
    selectedEventId,
    selAlbumId,
    selCategoryId,
    caption,
    resetAndClose,
  ]);

  if (!visible) return null;

  const albumItems = (albums || []).map(a => ({id: a.albumId, name: a.name}));

  return (
    <CustomModal
      justifyContent={'flex-end'}
      visible={visible}
      onRequestClose={uploading ? undefined : resetAndClose}
      onPress={uploading ? undefined : resetAndClose}
      disableOutsidePress={uploading}
      modalcontent={
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={ups.kavWrapper}
          pointerEvents="box-none">
          <Animated.View
            style={[ups.sheet, {transform: [{translateY: slideAnim}]}]}>
            <View style={ups.handle} />
            <Text style={ups.title}>Upload Media</Text>

            <ScrollView
              style={ups.scroll}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={ups.scrollContent}>
              {!uploading && (
                <View style={ups.pickRow}>
                  <TouchableOpacity
                    style={[ups.pickFilesBtn, {flex: 1}]}
                    onPress={pickFiles}
                    activeOpacity={0.8}>
                    <Text style={ups.pickFilesIcon}>🖼️</Text>
                    <Text style={ups.pickFilesTxt}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[ups.pickFilesBtn, {flex: 1}]}
                    onPress={capturePhoto}
                    activeOpacity={0.8}>
                    <Text style={ups.pickFilesIcon}>📷</Text>
                    <Text style={ups.pickFilesTxt}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {assets.length > 0 && (
                <Text style={ups.selectedCount}>
                  {assets.length} file{assets.length !== 1 ? 's' : ''} selected
                </Text>
              )}

              {assetsLoading ? (
                <View style={ups.assetsLoadingRow}>
                  <ActivityIndicator size="small" color={COLORS.TITLECOLOR} />
                  <Text style={ups.assetsLoadingTxt}>Loading …</Text>
                </View>
              ) : assets.length > 0 ? (
                <FlatList
                  data={assets}
                  horizontal
                  keyExtractor={item => item.uri}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={ups.thumbRow}
                  initialNumToRender={6}
                  maxToRenderPerBatch={4}
                  windowSize={3}
                  removeClippedSubviews={Platform.OS === 'ios'}
                  renderItem={({item: a, index: i}) => (
                    <FileTile
                      asset={a}
                      progress={0}
                      status="idle"
                      onRemove={uploading ? null : removeAsset}
                      removeIndex={i}
                    />
                  )}
                />
              ) : null}

              <CategoryGrid
                categories={categories}
                selected={selCategoryId}
                onSelect={setSelCategoryId}
                onAdd={() => setAddCatOpen(true)}
                onManage={() => setManageCatsOpen(true)}
                loading={catsLoading}
                disabled={uploading}
                isAdmin={isAdmin}
                canWrite={canWrite}
              />

              <Text style={ups.label}>Album</Text>
              <SheetPicker
                label="Select Album"
                items={albumItems}
                value={selAlbumId}
                onSelect={setSelAlbumId}
                keyField="id"
                labelField="name"
              />

              <Text style={ups.label}>Caption (optional)</Text>
              <TextInput
                style={[ups.input, ups.inputMulti]}
                placeholder="Write a caption…"
                placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={[ups.actions]}>
              <TouchableOpacity
                style={ups.cancelBtn}
                onPress={resetAndClose}
                disabled={uploading}>
                <Text style={ups.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  ups.uploadBtn,
                  (uploading || !assets.length) && ups.btnDisabled,
                ]}
                onPress={handleUpload}
                disabled={uploading || !assets.length}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={ups.uploadTxt}>
                    Upload{assets.length > 0 ? ` (${assets.length})` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
          <CategoryFormModal
            visible={addCatOpen}
            category={null}
            onClose={() => setAddCatOpen(false)}
            onSaved={() => {
              loadCategories();
              onCategoriesChanged?.();
            }}
          />
          <ManageCategoriesModal
            visible={manageCatsOpen}
            onClose={() => setManageCatsOpen(false)}
            onChanged={() => {
              loadCategories();
              onCategoriesChanged?.();
            }}
            canWrite={canWrite}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        </KeyboardAvoidingView>
      }
    />
  );
}

const ups = StyleSheet.create({
  safeAreaWrapper: {
    flex: 1,
    backgroundColor: 'red',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  assetsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  assetsLoadingTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  fileTilePlayOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  fileTilePlayTxt: {
    color: '#fff',
    fontSize: 9,
  },
  sheet: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flex: 1, // ✅ Added flex
    maxHeight: SH * 0.85,
    elevation: 24, // ✅ Uncommented shadows
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.INPUTBORDER || '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
    flexShrink: 0,
  },
  title: {
    color: COLORS.PRIMARYBLACK,
    fontSize: FONTS.FONTSIZE.MEDIUM || 17,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
    flexShrink: 0,
  },
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },

  // Pick row — side by side buttons
  pickRow: {flexDirection: 'row', gap: 10, marginBottom: 6},
  pickFilesBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
  },
  pickFilesIcon: {fontSize: 26},
  pickFilesTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  selectedCount: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI || 12,
    marginBottom: 8,
  },
  thumbRow: {gap: 8},
  fileTileVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTile: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUNDCOLOR,
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
  },
  fileTileImg: {width: '100%', height: '100%'},
  fileTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  fileTileDone: {fontSize: 20, color: '#22c55e'},
  fileTileErr: {fontSize: 20, color: '#ef4444'},
  progBar: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: {height: '100%', backgroundColor: COLORS.TITLECOLOR},
  // Remove button on tile
  fileTileRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTileRemoveTxt: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  label: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#e0e0ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    height: 40,
  },
  inputMulti: {height: 80, textAlignVertical: 'top'},
  pickBtn: {
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#e0e0ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickTxt: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    includeFontPadding: false,
  },
  pickArrow: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.MINI || 12,
  },
  pickBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 30,
  },
  pickHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.INPUTBORDER || '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  pickSheetTitle: {
    color: COLORS.PRIMARYBLACK,
    fontSize: FONTS.FONTSIZE.SMALL || 15,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
  },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#eee',
  },
  pickItemTxt: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI || 14,
  },
  pickItemActive: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  pickCheck: {
    color: COLORS.TITLECOLOR,
    fontSize: FONTS.FONTSIZE.EXTRASMALL || 15,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.INPUTBORDER || '#eee',
    flexShrink: 0,
  },
  progressTxt: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.INPUTBORDER || '#eee',
    backgroundColor: COLORS.PRIMARYWHITE,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#ddd',
    alignItems: 'center',
  },
  cancelTxt: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  uploadBtn: {
    flex: 2,
    backgroundColor: COLORS.TITLECOLOR,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnDisabled: {opacity: 0.4},
  uploadTxt: {
    color: '#fff',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  // ── NEW: category grid ──────────────────────────────────────────────────────
  catGridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  managePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
  },
  managePillTxt: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
  },
  catGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  catTile: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#e0e0ea',
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  catTileActive: {
    borderColor: COLORS.TITLECOLOR,
    backgroundColor: COLORS.TITLECOLOR + '12',
  },
  catTileEmoji: {fontSize: 26},
  catTileName: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
    textAlign: 'center',
    includeFontPadding: false,
  },
  catTileNameActive: {
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  catTileNew: {
    borderStyle: 'dashed',
    borderColor: COLORS.PLACEHOLDERCOLOR + '88',
    backgroundColor: 'transparent',
  },
  catTileNewIcon: {fontSize: 22, color: COLORS.PLACEHOLDERCOLOR},
  catTileNewTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
  },
  catEmptyTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI || 13,
    paddingVertical: 10,
  },

  // ── NEW: add/edit form sheet ─────────────────────────────────────────────────
  catFormKAV: {flex: 1, justifyContent: 'flex-end'},
  catFormSheet: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    elevation: 30,
    maxHeight: '90%',
  },
  catFormFieldLabel: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  catFormInput: {
    marginHorizontal: 16,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#e0e0ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 0,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI || 14,
    height: 38,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER || '#e0e0ea',
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f9f9fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: {
    borderColor: COLORS.TITLECOLOR,
    backgroundColor: COLORS.TITLECOLOR + '18',
  },
  emojiTxt: {fontSize: 22},
  catPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
  },
  catPreviewEmoji: {fontSize: 26},
  catPreviewLabel: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: 9,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catPreviewName: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },

  // ── NEW: manage sheet ────────────────────────────────────────────────────────
  manageSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: SH * 0.72,
    paddingBottom: 20,
    elevation: 30,
  },
  manageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  manageTitle: {
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MEDIUM || 17,
    includeFontPadding: false,
  },
  manageSubtitle: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.TOOSMALL || 11,
  },
  manageCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageCloseTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontSize: FONTS.FONTSIZE.MINI || 13,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.INPUTBORDER || '#eee',
    marginBottom: 4,
  },
  manageCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUTBORDER || '#f0f0f0',
    gap: 12,
  },
  manageCatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageCatName: {
    flex: 1,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    includeFontPadding: false,
  },
  manageCatBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUNDCOLOR || '#f5f5fa',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER || '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageCatDeleteBtn: {backgroundColor: '#fff0f0', borderColor: '#fecaca'},
  centred: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTxt: {
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
  },
});
