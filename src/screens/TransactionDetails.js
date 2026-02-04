import React, {useState} from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import CustomHeader from '../components/root/CustomHeader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Offline from '../components/root/Offline';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import httpClient from '../connection/httpClient';

const TransactionDetails = ({route}) => {
  const {item} = route?.params;

  const navigation = useNavigation();
  const {isConnected} = useNetworkStatus();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const getStatusColor = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
      case 'declined':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusBackgroundColor = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return '#4361EE';
      case 'pending':
        return '#FF9800';
      case 'failed':
      case 'declined':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getIcons = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'failed':
      case 'declined':
        return 'close-circle';
      default:
        return 'clock-outline';
    }
  };

  const getStatusText = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return 'Successful!';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'declined':
        return 'Declined';
      default:
        return 'Processing...';
    }
  };

  const processRefund = async () => {
    if (!refundAmount || refundAmount.trim() === '') {
      Alert.alert('Required', 'Please enter refund amount.');
      return;
    }
    const amount = parseFloat(refundAmount.replace('$', '')); // Clean '$' prefix

    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than $0.00.',
      );
      return;
    }

    // Parse item.amount safely (handles '$350' or '350')
    const originalAmount =
      parseFloat(
        (typeof item.amount === 'string'
          ? item.amount.replace('$', '')
          : item.amount
        ).toString(),
      ) || 0;

    // Validation - now both are numbers
    if (amount > originalAmount) {
      Alert.alert(
        'Invalid Amount',
        `Refund amount must not exceed original amount of $${originalAmount.toFixed(
          2,
        )}.`,
      );
      return;
    }

    if (!refundReason.trim()) {
      Alert.alert('Required', 'Please enter reason for refund.');
      return;
    }
    Keyboard.dismiss();
    setRefundLoading(true);
    try {
      const payload = {
        amount: amount?.toFixed(2),
        reason: refundReason.trim(),
      };
      console.log(payload);
      console.log(`payment/${item.order_id}/refund`);

      const response = await httpClient.post(
        `payment/${item.order_id}/refund`,
        payload,
      );
      console.log('res : ', response);

      if (response.data.status) {
        NOTIFY_MESSAGE(
          response.data.message || 'Refund processed successfully!',
        );
        setShowRefundModal(false);
        setRefundAmount('');
        setRefundReason('');
      } else {
        NOTIFY_MESSAGE(response.data.message || 'Refund failed');
      }
    } catch (error) {
      NOTIFY_MESSAGE('Refund failed. Please try again.');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleRefundAmountChange = text => {
    // Allow: empty, numbers, 1 dot, max 2 decimals
    // Block: multiple dots, >2 decimals, letters/symbols
    const validPattern = /^(\d*\.?\d{0,2})$/;

    if (validPattern.test(text)) {
      setRefundAmount(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={'Transaction Details'}
      />
      {isConnected ? (
        <>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {/* Success Card */}
            <View style={styles.card}>
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <View
                  style={[
                    styles.successIcon,
                    {backgroundColor: getStatusColor(item.status) + '20'},
                  ]}>
                  <MaterialDesignIcons
                    name={getIcons(item.status)}
                    size={40}
                    color={getStatusColor(item.status)}
                  />
                </View>
              </View>

              {/* Payment Successful Text */}
              <Text style={styles.successTitle}>{`Payment ${getStatusText(
                item.status,
              )}`}</Text>
              <Text style={styles.orderId}>Order #{item?.order_id}</Text>

              {/* Total Amount Section */}
              <View
                style={[
                  styles.amountSection,
                  {backgroundColor: getStatusBackgroundColor(item?.status)},
                ]}>
                <Text style={styles.totalAmountLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>{item?.amount}</Text>
                <Text style={styles.currency}>USD</Text>
              </View>

              {/* Transaction Information */}
              <View style={styles.transactionInfoSection}>
                <Text style={styles.sectionTitle}>Transaction Information</Text>

                {/* Order ID */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order ID</Text>
                  <Text style={styles.infoValue}>{item?.order_id || '-'}</Text>
                </View>

                {/* Member */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member</Text>
                  <Text style={styles.infoValue}>
                    {item?.member_name || '-'}
                  </Text>
                </View>

                {/* Member ID */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member ID</Text>
                  <Text style={styles.infoValue}>{item?.member_id || '-'}</Text>
                </View>

                {/* Family Members - NEW SECTION */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Family Members</Text>
                  {item?.family_members_name?.length > 0 ? (
                    <View style={styles.familyMembersContainer}>
                      {item.family_members_name.map((member, index) => (
                        <View
                          key={item.family_members_ids[index] || index}
                          style={styles.familyMemberChip}>
                          <Text
                            style={styles.familyMemberText}
                            numberOfLines={1}>
                            {member}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>-</Text>
                  )}
                </View>

                {/* Transaction ID */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Transaction ID</Text>
                  <Text style={styles.infoValue}>
                    {item?.transaction_id || '-'}
                  </Text>
                </View>

                {/* Reference ID */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reference ID</Text>
                  <Text style={styles.infoValue}>
                    {item?.paypal_reference_id || '-'}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      styles.statusText,
                      {color: getStatusColor(item?.status)},
                    ]}>
                    {capitalizeFirstLetter(item?.status) || '-'}
                  </Text>
                </View>

                {/* Method */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Method</Text>
                  <Text style={styles.infoValue}>
                    {item?.payment_method || '-'}
                  </Text>
                </View>

                {/* Date */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>
                    {item?.transaction_date || '-'}
                  </Text>
                </View>

                {/* Time */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>
                    {item?.transaction_time || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {item.status?.toLowerCase() == 'completed' && (
              <TouchableOpacity
                onPress={() => setShowRefundModal(true)}
                style={[styles.downloadButton, {backgroundColor: '#dc2627'}]}
                activeOpacity={0.8}>
                <Text style={styles.downloadButtonText}>Refund Payment</Text>
              </TouchableOpacity>
            )}

            {/* Download Receipt Button */}
            {/* <TouchableOpacity style={styles.downloadButton} activeOpacity={0.8}>
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </TouchableOpacity> */}
          </ScrollView>
          <Modal
            visible={showRefundModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowRefundModal(false)}>
            <TouchableWithoutFeedback onPress={() => setShowRefundModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.refundModal}>
                    <ScrollView
                      style={styles.refundModalScroll}
                      contentContainerStyle={styles.refundModalContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}>
                      {/* Header */}
                      <View style={styles.modalHeader}>
                        <View style={styles.headerLeft}>
                          <Text style={styles.modalTitle}>Refund Payment</Text>
                          <Text style={styles.orderIdModal}>
                            Order #{item?.order_id}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setShowRefundModal(false);
                            setRefundAmount('');
                            setRefundReason('');
                          }}
                          hitSlop={{
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10,
                          }}>
                          <MaterialDesignIcons
                            name="close"
                            size={24}
                            color="#666"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.headerDivider} />

                      {/* Original Amount */}
                      <View style={styles.originalAmountContainer}>
                        <Text style={styles.originalAmountLabel}>
                          Original Transaction Amount
                        </Text>
                        <Text style={styles.originalAmount}>
                          {item?.amount}
                        </Text>
                      </View>

                      {/* Refund Amount Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          Refund Amount (in $) *
                        </Text>
                        <TextInput
                          style={styles.amountInput}
                          value={refundAmount}
                          onChangeText={handleRefundAmountChange}
                          placeholder="0.00"
                          placeholderTextColor="#999"
                          keyboardType="decimal-pad"
                          maxLength={12}
                          returnKeyType="next"
                        />
                        <Text style={styles.maxAmount}>
                          Maximum: {item?.amount}
                        </Text>
                        {(() => {
                          const inputAmount =
                            parseFloat(refundAmount.replace('$', '')) || 0;
                          const maxAmount =
                            parseFloat(
                              (item?.amount || '0').replace('$', ''),
                            ) || 0;
                          return (
                            inputAmount > maxAmount && (
                              <Text style={styles.errorText}>
                                Amount cannot exceed original amount.
                              </Text>
                            )
                          );
                        })()}
                      </View>

                      {/* Reason Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          Reason for Refund *
                        </Text>
                        <TextInput
                          style={styles.reasonInput}
                          value={refundReason}
                          onChangeText={setRefundReason}
                          placeholder="Please provide a reason for this refund..."
                          placeholderTextColor="#999"
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => {
                            setShowRefundModal(false);
                            setRefundAmount('');
                            setRefundReason('');
                          }}
                          disabled={refundLoading}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.processButton,
                            refundLoading && styles.processButtonDisabled,
                          ]}
                          onPress={processRefund}
                          disabled={refundLoading}>
                          <Text style={styles.processButtonText}>
                            {refundLoading ? 'Processing...' : 'Process Refund'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </>
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollableModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: '#F44336',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  refundModalScroll: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  refundModalContent: {
    paddingBottom: 10,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: 22,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#000000',
    textAlign: 'center',
    marginTop: 12,
    includeFontPadding: false,
  },
  orderId: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
  },
  amountSection: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  totalAmount: {
    fontSize: FONTS.FONTSIZE.BIG,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#FFFFFF',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  currency: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#FFFFFF',
    includeFontPadding: false,
    letterSpacing: 1,
  },
  transactionInfoSection: {
    padding: 14,
  },
  sectionTitle: {
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#000000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  familyMembersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 2,
    gap: 4,
    justifyContent: 'flex-end',
  },
  familyMemberChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '70%',
  },
  familyMemberText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#1976D2',
  },

  infoLabel: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#757575',
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  infoValue: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#000000',
    textAlign: 'right',
    flex: 1,
  },
  statusText: {
    fontFamily: FONTS.FONT_FAMILY.BOLD,
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  downloadButton: {
    backgroundColor: '#4361EE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#4361EE',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadButtonText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#FFFFFF',
  },
  supportButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  supportButtonText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#424242',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '85%',
    width: '94%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#000',
  },
  orderIdModal: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#666',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  originalAmountContainer: {
    padding: 10,
    backgroundColor: '#f8f9faff',
    margin: 10,
    borderRadius: 12,
  },
  originalAmountLabel: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: '#666',
  },
  originalAmount: {
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: '#000',
  },
  inputGroup: {
    marginHorizontal: 10,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#333',
    marginBottom: 4,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    backgroundColor: '#F9F9F9',
    height: 38,
    includeFontPadding: false,
  },
  maxAmount: {
    fontSize: FONTS.FONTSIZE.MICRO,
    color: '#666',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    marginTop: 2,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 10,
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    backgroundColor: '#F9F9F9',
    textAlignVertical: 'top',
    height: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#666',
  },
  processButton: {
    flex: 1,
    backgroundColor: '#dc2627',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  processButtonText: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    color: 'white',
  },
});

export default TransactionDetails;
