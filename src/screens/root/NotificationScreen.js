import {StyleSheet, Text, View, FlatList, TouchableOpacity} from 'react-native';
import React from 'react';
import COLORS from '../../theme/Color';
import CustomHeader from '../../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import FONTS from '../../theme/Fonts';

const NotificationScreen = () => {
  const navigation = useNavigation();

  // Sample notification data based on the image
  const notificationData = [
    {
      id: 1,
      type: 'FESTIVAL',
      title: 'Annual Cultural Festival 2024',
      description: 'Registration open till Oct 15 • Prize money ₹50,000',
      timeAgo: '12h ago',
      readStatus: '20 min read',
      icon: 'construction',
      iconColor: '#4A90E2',
      backgroundColor: '#E8F4FD',
      badge: 'NEW',
      badgeColor:COLORS.LABELCOLOR,
      borderColor: '#3881e0',
      typeBack: '#3881e028',
    },
    {
      id: 2,
      type: 'OBITUARY',
      title: 'Sad demise of respected elder Ramesh Uncle',
      description: 'Last rites at 4 PM today • Condolence meeting at 6 PM',
      timeAgo: '5h ago',
      readStatus: '1 min read',
      icon: 'construction',
      iconColor: '#666',
      backgroundColor: '#F5F5F5',
      badge: null,
      badgeColor: null,
      borderColor: '#808080e8',
      typeBack: '#8080801c',
    },
    {
      id: 3,
      type: 'DEVELOPMENT',
      title: 'New Community Center Construction Update',
      description: '80% completed • Expected inauguration in December',
      timeAgo: '1d ago',
      readStatus: '2 min read',
      icon: 'construction',
      iconColor: '#4CAF50',
      backgroundColor: '#E8F5E8',
      badge: null,
      badgeColor: null,
      borderColor: '#0bbb0b',
      typeBack: '#0bbb0b13',
    },
  ];

  const renderNotificationItem = ({item}) => (
    <View
      style={[
        styles.notificationCard,
        {
          borderColor: item.borderColor,
          backgroundColor: item.backgroundColor,
        },
      ]}
      activeOpacity={0.35}>
      <View style={styles.cardHeader}>
        <View style={styles.leftSection}>
          <View
            style={[styles.iconContainer, {backgroundColor: item.borderColor}]}>
            <MaterialIcons
              name={item.icon}
              size={20}
              color={COLORS.PRIMARYWHITE}
            />
          </View>
          <View style={styles.contentSection}>
            <View style={styles.typeRow}>
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.EXTRAMICRO,
                  fontFamily: FONTS.FONT_FAMILY.BOLD,
                  color: item.borderColor,
                  textTransform: 'uppercase',
                  backgroundColor: item.typeBack,
                  paddingVertical: 3,
                  borderRadius: 20,
                  includeFontPadding: false,
                  paddingHorizontal: 8,
                }}>
                {item.type}
              </Text>
              {item.badge && (
                <View
                  style={[styles.badge, {backgroundColor: item.badgeColor}]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <FontAwesome6
                  name="clock"
                  size={12}
                  color={COLORS.INPUTBORDER}
                />
                <Text style={styles.metaText}>{item.timeAgo}</Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome6
                  name="book-open"
                  size={12}
                  color={COLORS.INPUTBORDER}
                />
                <Text style={styles.metaText}>{item.readStatus}</Text>
              </View>
              <View style={styles.actionSection}>
                <TouchableOpacity style={styles.actionButton}>
                  <FontAwesome6
                    name="bookmark"
                    size={16}
                    color={COLORS.INPUTBORDER}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Feather
                    name="share-2"
                    size={16}
                    color={COLORS.INPUTBORDER}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <Entypo
                    name="chevron-small-right"
                    size={24}
                    color={COLORS.INPUTBORDER}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={'Notifications'}
      />
      {/* Urgent Banner */}
      <View style={styles.urgentBanner}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: 'white',
          }}
        />
        <Text
          style={{
            fontSize: FONTS.FONTSIZE.EXTRAMINI,
            fontFamily: FONTS.FONT_FAMILY.BOLD,
            color: COLORS.PRIMARYWHITE,
            includeFontPadding:false
          }}>
          URGENT:{' '}
          <Text
            style={{
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
            }}>
            Community meeting this weekend - All invited
          </Text>
        </Text>
      </View>
      {/* Latest Updates Header */}
      <View style={styles.updatesHeader}>
        <View style={styles.updatesLeft}>
          <FontAwesome6
            name="arrow-trend-up"
            size={20}
            color={COLORS.LABELCOLOR}
          />
          <Text style={styles.updatesTitle}>Latest Updates</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Feather name="filter" size={20} color={COLORS.grey500} />
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notificationData}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* View All News Button */}
      <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.8}>
        <Text style={styles.viewAllText}>View All</Text>
        <FontAwesome6 name="angle-right" size={16} color="white" top={-1} />
      </TouchableOpacity>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  urgentBanner: {
    backgroundColor: '#d82828',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  updatesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updatesTitle: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  liveText: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#4CAF50',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  notificationCard: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: '#0000007d',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: 'white',
    includeFontPadding: false,
  },
  titleText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.TITLECOLOR,
  },
  descriptionText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.BOTTOMBORDERCOLOR,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems:'center',
    justifyContent:'space-between'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONTS.FONTSIZE.EXTRAMICRO,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    alignItems:'center'
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  moreButton: {
    paddingHorizontal: 8,
    borderRadius: 8,
    paddingVertical:5
  },
  viewAllButton: {
    backgroundColor:COLORS.LABELCOLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    gap: 8,
  },
  viewAllText: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYWHITE,
  },
});
