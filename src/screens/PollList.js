import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import PollCard from '../components/poll/PollCard';
import CreatePollSheet from '../components/poll/CreatePollSheet';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import NetInfo from '@react-native-community/netinfo';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {NOTIFY_MESSAGE} from '../constant/Module';
import httpClientV3 from '../connection/httpClientV3';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {getData} from '../utils/Storage';

const FILTER_DOT = {
  all: '#888888',
  active: '#1d8a55',
  voted: '#1a5fbf',
  closed: '#9a948e',
};

const FILTERS = [
  {key: 'all', label: 'All'},
  {key: 'active', label: 'Active'},
  {key: 'voted', label: 'Voted'},
  {key: 'closed', label: 'Closed'},
];

const PAGE_SIZE = 20;

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function PollList({route, navigation}) {
  const {item, isAdmin} = route?.params?.data;

  const [allPolls, setAllPolls] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterCounts, setFilterCounts] = useState({
    all: null,
    active: null,
    voted: null,
    closed: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 500);

  const [createVisible, setCreateVisible] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);

  const [userData, setUserData] = useState(null);

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
  };

  const buildParams = useCallback(
    page => {
      const params = new URLSearchParams({
        PageNumber: String(page),
        PageSize: String(PAGE_SIZE),
        OrderBy: 'order',
        OrderType: '-1',
      });
      if (debouncedSearch) params.append('Keyword', debouncedSearch);
      if (
        filter !== 'all'
      ) {
        params.append('Status', filter);
      }
      return params.toString();
    },
    [debouncedSearch, filter],
  );

  const fetchPolls = useCallback(
    (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      NetInfo.fetch().then(state => {
        if (!state.isConnected) {
          NOTIFY_MESSAGE('Please check your internet connectivity');
          setIsLoading(false);
          setRefreshing(false);
          return;
        }

        httpClientV3
          .get(`polls?${buildParams(page)}`)
          .then(response => {
            if (response?.data?.status) {
              const {
                data: items = [],
                totalRecord = 0,
                totalPage = 1,
              } = response.data.result;

              const finalItems =
                filter === 'voted'
                  ? items.filter(p => p.userVotedOptionIds?.length > 0)
                  : items;
              setAllPolls(items);
              setPageNumber(page);
              setHasMore(page < totalPage && items.length > 0);
            } else {
              NOTIFY_MESSAGE(response?.data?.message || 'Something went wrong');
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE(err?.message || 'Something Went Wrong');
          })
          .finally(() => {
            setIsLoading(false);
            setRefreshing(false);
          });
      });
    },
    [buildParams, filter],
  );

  useEffect(() => {
    fetchPolls(1);
    getUser();
  }, []);

  useEffect(() => {
    fetchPolls(1);
  }, [debouncedSearch, filter]);

  const fetchCounts = useCallback(() => {
    if (!isAdmin) return;
    httpClientV3
      .get('admin/stats')
      .then(res => {
        if (res?.data?.status) {
          const {totalPolls, activePolls, closedPolls} = res.data.result;
          setFilterCounts({
            all: totalPolls,
            active: activePolls,
            closed: closedPolls,
            voted: null,
          });
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const onRefresh = useCallback(() => {
    fetchPolls(1, true);
    fetchCounts();
  }, [fetchPolls, fetchCounts]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    fetchPolls(pageNumber + 1);
  }, [isLoading, hasMore, pageNumber, fetchPolls]);

  const loadPrevious = useCallback(() => {
    if (pageNumber <= 1) return;
    fetchPolls(pageNumber - 1);
  }, [pageNumber, fetchPolls]);

  const handlePublish = useCallback(
    data => {
      NetInfo.fetch().then(state => {
        if (!state.isConnected) {
          NOTIFY_MESSAGE('Please check your internet connectivity');
          return;
        }
        const payload = {
          title: data.title,
          description: data.description || null,
          category: '',
          isAnonymous: data.isAnonymous,
          allowMultiple: data.allowMultiple,
          endsAt: data.endsAt || null,
          options: data.options.map(text => ({text})),
        };

        httpClientV3
          .post('polls', payload)
          .then(response => {
            if (response?.data?.status) {
              NOTIFY_MESSAGE(
                response.data.message || 'Poll created successfully.',
              );
              fetchPolls(1);
              fetchCounts();
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message || 'Could not create poll',
              );
            }
          })
          .catch(err => NOTIFY_MESSAGE(err?.message || 'Something Went Wrong'));
      });
    },
    [fetchPolls, fetchCounts],
  );

  const handleEdit = useCallback(poll => {
    setEditingPoll(poll);
    setCreateVisible(true);
  }, []);

  const handleUpdate = useCallback(
    (pollId, data) => {
      NetInfo.fetch().then(state => {
        if (!state.isConnected) {
          NOTIFY_MESSAGE('Please check your internet connectivity');
          return;
        }
        const payload = {
          title: data.title,
          description: data.description || null,
          category: '',
          endsAt: data.endsAt || null,
          isAnonymous: data.isAnonymous ?? false,
          allowMultiple: data.allowMultiple ?? false,
        };
        httpClientV3
          .put(`polls/${pollId}`, payload)
          .then(response => {
            if (response?.data?.status) {
              NOTIFY_MESSAGE(
                response.data.message || 'Poll updated successfully.',
              );
              fetchPolls(pageNumber);
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message || 'Could not update poll',
              );
            }
          })
          .catch(err => NOTIFY_MESSAGE(err?.message || 'Something Went Wrong'));
      });
    },
    [fetchPolls, pageNumber],
  );

  const handleDelete = useCallback(
    pollId => {
      NetInfo.fetch().then(state => {
        if (!state.isConnected) {
          NOTIFY_MESSAGE('Please check your internet connectivity');
          return;
        }
        httpClientV3
          .delete(`polls/${pollId}`)
          .then(response => {
            if (response?.data?.status === false) {
              NOTIFY_MESSAGE(
                response?.data?.message || 'Could not delete poll',
              );
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message || 'poll deleted successfully',
              );
              fetchPolls(pageNumber);
              fetchCounts();
            }
          })
          .catch(err =>
            NOTIFY_MESSAGE(err?.message || 'Could not delete poll'),
          );
      });
    },
    [fetchPolls, pageNumber, fetchCounts],
  );

  const handleVote = useCallback(
    (pollId, optionIds) => {
      NetInfo.fetch().then(state => {
        if (!state.isConnected) {
          NOTIFY_MESSAGE('Please check your internet connectivity');
          return;
        }
        httpClientV3
          .post(`polls/${pollId}/votes`, {optionIds})
          .then(response => {
            if (response?.data?.status) {
              NOTIFY_MESSAGE(response?.data?.message || 'cast vote');
              fetchPolls(pageNumber); // stay on current page
            } else {
              NOTIFY_MESSAGE(response?.data?.message || 'Could not cast vote');
            }
          })
          .catch(err => {
            if (err?.response?.status === 409) {
              NOTIFY_MESSAGE('You have already voted on this poll');
            } else {
              NOTIFY_MESSAGE(err?.message || 'Could not cast vote');
            }
          });
      });
    },
    [fetchPolls, pageNumber],
  );

  const handleClosePoll = useCallback(
    pollId => {
      Alert.alert(
        'Close Poll',
        'Close this poll? Members can no longer vote.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Close Poll',
            style: 'destructive',
            onPress: () => {
              NetInfo.fetch().then(state => {
                if (!state.isConnected) {
                  NOTIFY_MESSAGE('Please check your internet connectivity');
                  return;
                }
                httpClientV3
                  .patch(`polls/${pollId}/close`)
                  .then(response => {
                    if (response?.data?.status) {
                      NOTIFY_MESSAGE(response.data.message || 'Poll closed.');
                      fetchPolls(pageNumber);
                      fetchCounts();
                    } else {
                      NOTIFY_MESSAGE(
                        response?.data?.message || 'Could not close poll',
                      );
                    }
                  })
                  .catch(err =>
                    NOTIFY_MESSAGE(err?.message || 'Could not close poll'),
                  );
              });
            },
          },
        ],
      );
    },
    [fetchPolls, pageNumber, fetchCounts],
  );

  const handleNotifyAll = useCallback(pollId => {
    Alert.alert(
      'Notify All',
      'Send a push notification to all members about this poll?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send',
          onPress: () => {
            NetInfo.fetch().then(state => {
              if (!state.isConnected) {
                NOTIFY_MESSAGE('Please check your internet connectivity');
                return;
              }
              httpClientV3
                .post(`polls/${pollId}/notify`)
                .then(response => {
                  NOTIFY_MESSAGE(
                    response?.data?.status
                      ? response.data.message || 'Notification sent.'
                      : response?.data?.message ||
                          'Could not send notification',
                  );
                })
                .catch(err =>
                  NOTIFY_MESSAGE(err?.message || 'Could not send notification'),
                );
            });
          },
        },
      ],
    );
  }, []);

  const handleOpenComments = useCallback(
    poll => {
      navigation.navigate('PollComments', {
        data: {poll, isAdmin, dashItem: item},
      });
    },
    [navigation, isAdmin, item],
  );

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
        title={item?.name || 'Community Polls'}
      />

      <View style={styles.headerContainer}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search polls..."
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            style={[styles.searchInput, {flex: 1}]}
            returnKeyType="search"
            placeholderTextColor={COLORS.grey500}
          />
          {searchKeyword.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <AntDesign name="close-circle" size={18} color={COLORS.grey500} />
            </TouchableOpacity>
          ) : null}
        </View>
        {item?.write && (
          <TouchableOpacity
            onPress={() => {
              setEditingPoll(null);
              setCreateVisible(true);
            }}
            style={styles.plusButton}
            activeOpacity={0.7}>
            <AntDesign name="plus" size={22} color={COLORS.PRIMARYWHITE} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.chipsWrapper}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          renderItem={({item: f}) => {
            const isActive = filter === f.key;
            const count = filterCounts[f.key];
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setFilter(f.key)}>
                <View
                  style={[
                    styles.filterDot,
                    {
                      backgroundColor: isActive
                        ? '#ffffff99'
                        : FILTER_DOT[f.key],
                    },
                  ]}
                />
                <Text
                  style={[styles.chipTxt, isActive && styles.chipTxtActive]}>
                  {f.label}
                </Text>
                {isAdmin && count != null && (
                  <View
                    style={[
                      styles.countBadge,
                      isActive && styles.countBadgeActive,
                    ]}>
                    <Text
                      style={[
                        styles.countTxt,
                        isActive && styles.countTxtActive,
                      ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.LABELCOLOR} />
        </View>
      ) : (
        <>
          <FlatList
            data={allPolls}
            keyExtractor={p => String(p.pollId)}
            contentContainerStyle={[
              styles.listContent,
              allPolls.length === 0 && {flexGrow: 1},
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.LABELCOLOR}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🗳️</Text>
                <Text style={styles.emptyTxt}>No polls found</Text>
                <Text style={styles.emptySub}>
                  Try a different filter or create a new poll
                </Text>
              </View>
            }
            renderItem={({item: poll}) => (
              <PollCard
                poll={poll}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onVote={handleVote}
                onClosePoll={isAdmin ? handleClosePoll : undefined}
                onNotifyAll={isAdmin ? handleNotifyAll : undefined}
                onOpenComments={handleOpenComments}
                dashItem={item}
                isAdmin={isAdmin}
                userData={userData}
              />
            )}
          />

          <View style={styles.paginationRow}>
            {pageNumber > 1 && (
              <TouchableOpacity onPress={loadPrevious}>
                <Text style={styles.paginationText}>Previous</Text>
              </TouchableOpacity>
            )}
            {hasMore && (
              <TouchableOpacity onPress={loadMore}>
                <Text style={styles.paginationText}>Load More</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <CreatePollSheet
        visible={createVisible}
        editingPoll={editingPoll}
        onClose={() => {
          setCreateVisible(false);
          setEditingPoll(null);
        }}
        onPublish={handlePublish}
        onUpdate={handleUpdate}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 12,
  },
  paginationText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.LABELCOLOR,
    textAlign: 'center',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: heightPercentageToDP('1%'),
    paddingHorizontal: widthPercentageToDP('5%'),
    gap: 30,
  },
  searchBox: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARYWHITE,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ebedf0',
    height: 38,
    marginRight: 10,
  },
  searchInput: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.PRIMARYBLACK,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  plusButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: COLORS.LABELCOLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsWrapper: {height: 40, marginBottom: 4},
  chipsContent: {paddingHorizontal: 12, alignItems: 'center'},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: COLORS.TABLEBORDER,
    backgroundColor: COLORS.PRIMARYWHITE,
    marginRight: 8,
    gap: 5,
  },
  chipActive: {
    backgroundColor: COLORS.LABELCOLOR,
    borderColor: COLORS.LABELCOLOR,
  },
  filterDot: {width: 7, height: 7, borderRadius: 99},
  chipTxt: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    includeFontPadding: false,
  },
  chipTxtActive: {color: COLORS.PRIMARYWHITE},
  countBadge: {
    backgroundColor: '#f0ece6',
    borderRadius: 99,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
  },
  countBadgeActive: {backgroundColor: 'rgba(255,255,255,0.25)'},
  countTxt: {
    fontSize: 9,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#5a5550',
    includeFontPadding: false,
  },
  countTxtActive: {color: COLORS.PRIMARYWHITE},

  listContent: {paddingHorizontal: 16, paddingBottom: 10, paddingVertical: 10},
  centerLoader: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyIcon: {fontSize: 40, marginBottom: 10},
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
