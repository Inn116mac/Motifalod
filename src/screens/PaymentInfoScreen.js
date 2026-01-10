import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  SafeAreaView,
  Platform,
} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import CustomHeader from '../components/root/CustomHeader';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import FONTS from '../theme/Fonts';
import {MaterialIcons} from '@react-native-vector-icons/material-icons';
import {NOTIFY_MESSAGE} from '../constant/Module';
import httpClient from '../connection/httpClient';
import WebView from 'react-native-webview';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {IMAGE_URL} from '../connection/Config';
import BraintreeDropIn from 'react-native-braintree-dropin-ui';

const PaymentInfoScreen = ({route}) => {
  const {formData} = route?.params;

  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVenmoProcessing, setIsVenmoProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const captureCalledRef = useRef(false);
  const webViewRef = useRef(null);
  const personalInfoSection = formData.find(
    section =>
      section.headerKey === 'personalInfo' && section.isMultiple === true,
  );
  const allFamilyMembers = personalInfoSection?.headerConfig || [];

  const familyMembers = allFamilyMembers.filter(member => {
    const isNotPaid = member?.isPaid?.value?.toLowerCase() !== 'yes';

    // Check if isApproved exists first
    if (member?.isApproved?.value !== undefined) {
      const isApproved = member.isApproved.value.toLowerCase() === 'yes';
      return isApproved && isNotPaid;
    }

    // If isApproved doesn't exist, just check isNotPaid
    return isNotPaid;
  });

  const paymentInfoSection = formData.find(
    section => section.headerKey === 'paymentInformation',
  );

  const paymentTypeConfig = paymentInfoSection?.headerConfig?.find(
    item => item?.paymentType || item?.key === 'paymentType',
  );

  const availablePaymentMethods = useMemo(() => {
    if (!paymentTypeConfig) return [];

    const paymentTypeValues =
      paymentTypeConfig?.paymentType?.values || paymentTypeConfig?.values || [];

    return paymentTypeValues
      .filter(option => option.value === 'Venmo' || option.value === 'Paypal')
      .map(option => ({
        type: option.value,
        label: option.label,
        icon: option.value === 'Venmo' ? 'logo-venmo' : 'paypal',
        color: option.value === 'Venmo' ? '#3D95CE' : '#0070BA',
        isVenmo: option.value === 'Venmo',
      }));
  }, [paymentTypeConfig]);

  const totalAmount = useMemo(() => {
    return familyMembers.reduce((total, member) => {
      const amount = parseFloat(member?.membershipamount?.value || 0);
      return total + amount;
    }, 0);
  }, [familyMembers]);

  const isVenmoAppInstalled = async () => {
    try {
      const venmoUrl = 'venmo://';
      const canOpen = await Linking.canOpenURL(venmoUrl);
      return canOpen;
    } catch (error) {
      return false;
    }
  };

  const getVenmoClientToken = async () => {
    try {
      const response = await httpClient.get('payment/venmoclienttoken');

      if (response?.data) {
        return response.data; // The token from your API
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Failed to get Venmo token');
        return null;
      }
    } catch (error) {
      NOTIFY_MESSAGE(error?.message || 'Failed to get Venmo token');
      return null;
    }
  };

  const processVenmoPayment = async () => {
    try {
      setIsSubmitting(true);

      // Check if Venmo is installed first
      const venmoInstalled = await isVenmoAppInstalled();

      if (!venmoInstalled) {
        Alert.alert(
          'Venmo App Required',
          'Please install the Venmo app to use this payment method.',
          [
            {
              text: 'Install Venmo',
              onPress: () => {
                const storeUrl =
                  Platform.OS === 'ios'
                    ? 'https://apps.apple.com/us/app/venmo/id351727428'
                    : 'https://play.google.com/store/apps/details?id=com.venmo';
                Linking.openURL(storeUrl);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
        setIsSubmitting(false);
        return;
      }

      const clientToken = await getVenmoClientToken();

      if (!clientToken) {
        setIsSubmitting(false);
        return;
      }

      // Show Drop-In with ONLY Venmo enabled
      const result = await BraintreeDropIn.show({
        clientToken: clientToken,
        countryCode: 'US',
        currencyCode: 'USD',
        orderTotal: totalAmount?.toFixed(2),
        vaultManager: false,
        cardDisabled: true,
        darkTheme: true,
        venmo: true,
      });

      if (result.nonce) {
        await completeVenmoPayment(result.nonce);
      } else {
        alert('Payment has been cancelled.');

        setIsSubmitting(false);
      }
    } catch (error) {
      if (
        error.message === 'USER_CANCELLATION' ||
        error.code === 'USER_CANCELLATION'
      ) {
        alert('Payment has been cancelled.');
      } else if (error.message?.includes('not available')) {
        Alert.alert(
          'Venmo Not Available',
          'Venmo payment is not available on this device. Please try PayPal instead.',
        );
      } else {
        alert('Venmo payment failed.');
      }
      setIsSubmitting(false);
    }
  };

  const completeVenmoPayment = async nonce => {
    try {
      const paymentData = {
        venmoNonce: nonce,
        amount: totalAmount?.toFixed(2),
        paymentType: 'Venmo',
      };

      const response = await httpClient.post(
        'payment/createorder',
        paymentData,
      );

      if (response.data.status) {
        const result = response.data.result;

        Alert.alert(
          'Payment Successful! ✅',
          `Transaction ID: ${result?.transactionId || 'N/A'}\nAmount: $${
            result?.venmoAmount || totalAmount
          }`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Venmo payment failed');
      }
    } catch (error) {
      NOTIFY_MESSAGE(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to complete Venmo payment',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPaymentOrder = async paymentType => {
    setIsProcessing(true);
    setIsPaymentCompleted(false);
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        setIsProcessing(false);
        return;
      }

      const data = {
        amount: totalAmount,
        paymentType: paymentType,
      };

      const response = await httpClient.post('payment/createorder', data);
      const mainData = response?.data;
      if (mainData?.status) {
        const providerOrderId = mainData?.result?.orderId;
        setOrderId(providerOrderId);
        const approvalUrl = mainData?.result?.approveLink;
        setPaypalUrl(approvalUrl);
        setShowPayment(true);
      } else {
        NOTIFY_MESSAGE(mainData?.message || 'Failed to create payment order');
      }
    } catch (error) {
      NOTIFY_MESSAGE(
        error?.data?.message ||
          error?.message ||
          'Something went wrong while creating payment order',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = paymentMethod => {
    if (totalAmount <= 0) {
      NOTIFY_MESSAGE('Invalid payment amount');
      return;
    }

    if (paymentMethod.isVenmo) {
      processVenmoPayment();
    } else {
      createPaymentOrder('PayPal');
    }
  };

  const handleNavigationStateChange = async navState => {
    const {url, loading: pageLoading} = navState;

    // If payment is completed, block everything
    if (isPaymentCompleted) {
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
      return false;
    }

    // Check for cancel
    if (url.includes('cancel')) {
      Alert.alert('Cancelled', 'Payment was cancelled', [
        {
          text: 'OK',
          onPress: () => {
            setShowPayment(false);
            setIsPaymentCompleted(false);
            captureCalledRef.current = false;
          },
        },
      ]);
      return false;
    }

    // Check for success URL - capture payment ONLY ONCE
    if (url.includes('success.html') && !captureCalledRef.current) {
      captureCalledRef.current = true;

      // Extract query parameters
      const queryString = url.split('?')[1];
      if (queryString) {
        const params = {};
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          params[key] = decodeURIComponent(value);
        });

        const token = params.token;
        const PayerID = params.PayerID;

        if (token && PayerID) {
          // Capture payment immediately
          await capturePayment();
          return false;
        }
      }
    }

    if (
      url.includes('paypal.com/checkout') ||
      url.includes('paypal.com/signin') ||
      url.includes('paypal.com/webapps')
    ) {
      return true;
    }

    return true;
  };

  const capturePayment = async () => {
    try {
      const response = await httpClient.post(
        `payment/capture?providerOrderId=${orderId}`,
      );

      const responseData = response?.data;

      if (responseData?.status) {
        NOTIFY_MESSAGE(
          responseData?.message || 'Payment captured successfully',
        );

        // if (responseData?.result?.pdf?.status) {
        //   NOTIFY_MESSAGE(
        //     responseData?.result?.pdf?.message || 'Pdf generated successfully.',
        //   );

        //   const getPDFResponse = responseData?.result?.pdf;
        //   console.log('pdf : ', getPDFResponse);
        //   if (getPDFResponse?.result) {
        //     setPdfUrl(getPDFResponse?.result);
        //   } else {
        //     setPdfUrl(null);
        //   }
        // } else {
        //   NOTIFY_MESSAGE(
        //     responseData?.result?.pdf?.message ||
        //       'Unable to generate PDF from html.',
        //   );
        // }

        setIsPaymentCompleted(true);
        setLoading(false);

        setTimeout(() => {
          setShowPayment(false);

          setTimeout(() => {
            Alert.alert(
              'Success',
              'Payment completed successfully!',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Reset states
                    setIsPaymentCompleted(false);
                    captureCalledRef.current = false;
                  },
                },
              ],
              {cancelable: false},
            );
          }, 300);
        }, 10000);
      } else {
        setLoading(false);
        captureCalledRef.current = false;
        setIsPaymentCompleted(false);
        Alert.alert(
          'Error',
          'Payment capture failed: ' +
            (responseData?.status?.message ||
              responseData?.id?.message ||
              'Something went wrong'),
        );
      }
    } catch (error) {
      setLoading(false);
      captureCalledRef.current = false;
      setIsPaymentCompleted(false);
      Alert.alert(
        'Error',
        'Failed to capture payment: ' +
          (error?.response?.data?.message || error.message),
      );
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
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
        title={'Payment'}
      />

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{margin: 10, paddingBottom: 20}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="payment" size={20} color="#10B981" />
            </View>
            <Text style={styles.headerText}>Payment Summary</Text>
          </View>

          {/* Family Members List */}
          <View style={styles.membersContainer}>
            {familyMembers.map((member, index) => {
              const firstName = member?.firstName?.value || '';
              const lastName = member?.lastName?.value || '';
              const amount = member?.membershipamount?.value || '0';

              return (
                <View key={index}>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberName}>
                      {firstName} {lastName}
                    </Text>
                    <Text style={styles.memberAmount}>
                      ${parseFloat(amount).toFixed(0)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Total Amount Row */}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${totalAmount.toFixed(0)}</Text>
          </View>
        </View>

        {/* <View style={styles.card}>
          <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>

          {availablePaymentMethods.length > 0 ? (
            availablePaymentMethods.map((method, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.paymentButton, {backgroundColor: method.color}]}
                onPress={() => handlePayment(method)}
                activeOpacity={0.35}
                disabled={method.isVenmo ? isVenmoProcessing : isProcessing}>
                {(method.isVenmo ? isVenmoProcessing : isProcessing) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    {method.isVenmo ? (
                      <Ionicons name={method.icon} size={20} color="#FFFFFF" />
                    ) : (
                      <FontAwesome
                        name={method.icon}
                        size={20}
                        color="#FFFFFF"
                      />
                    )}
                    <Text style={styles.paymentButtonText}>
                      Pay with {method.label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noPaymentMethodContainer}>
              <Text style={styles.noPaymentMethodText}>
                No payment methods available
              </Text>
            </View>
          )}
        </View> */}
        {pdfUrl ? (
          // ✅ Show PDF when available
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <MaterialDesignIcons
                  name="file-pdf-box"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text style={styles.headerText}>Payment Receipt</Text>
            </View>

            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => {
                // Open PDF in browser or viewer
                Linking.openURL(IMAGE_URL + pdfUrl).catch(err => {
                  NOTIFY_MESSAGE('Failed to open PDF');
                });
              }}>
              <MaterialDesignIcons
                name="file-pdf-box"
                size={24}
                color={COLORS.PRIMARYWHITE}
              />
              <Text style={styles.pdfButtonText}>View Receipt PDF</Text>
            </TouchableOpacity>

            {/* Optional: Show PDF in WebView */}
            <View style={styles.pdfPreviewContainer}>
              <WebView
                source={{uri: IMAGE_URL + pdfUrl}}
                style={styles.pdfPreview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.pdfLoadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.LABELCOLOR} />
                    <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                  </View>
                )}
              />
            </View>
          </View>
        ) : (
          // ✅ Show Payment Methods when no PDF
          <View style={styles.card}>
            <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
            {availablePaymentMethods.length > 0 ? (
              availablePaymentMethods.map((method, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.paymentButton,
                      {backgroundColor: method.color},
                    ]}
                    onPress={() => handlePayment(method)}
                    activeOpacity={0.35}
                    disabled={method.isVenmo ? isSubmitting : isProcessing}>
                    {(method.isVenmo ? isSubmitting : isProcessing) ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        {method.isVenmo ? (
                          <Ionicons
                            name={method.icon}
                            size={20}
                            color="#FFFFFF"
                          />
                        ) : (
                          <FontAwesome
                            name={method.icon}
                            size={20}
                            color="#FFFFFF"
                          />
                        )}
                        <Text style={styles.paymentButtonText}>
                          Pay with {method.label}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noPaymentMethodContainer}>
                <Text style={styles.noPaymentMethodText}>
                  No payment methods available
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* PayPal/Venmo WebView Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          Alert.alert(
            isPaymentCompleted ? 'Close Payment' : 'Cancel Payment',
            isPaymentCompleted
              ? 'Are you sure you want to cancel?'
              : 'Are you sure you want to cancel this payment?',
            [
              {text: 'No', style: 'cancel'},
              {
                text: 'Yes',
                onPress: () => {
                  setShowPayment(false);
                  setIsPaymentCompleted(false);
                },
              },
            ],
          );
        }}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    isPaymentCompleted ? 'Close Payment' : 'Cancel Payment',
                    isPaymentCompleted
                      ? 'Are you sure you want to cancel?'
                      : 'Are you sure you want to cancel this payment?',
                    [
                      {text: 'No', style: 'cancel'},
                      {
                        text: 'Yes',
                        onPress: () => {
                          setShowPayment(false);
                          setIsPaymentCompleted(false);
                        },
                      },
                    ],
                  );
                }}
                style={styles.closeButton}>
                <Text style={styles.closeText}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00457C" />
                <Text style={styles.loadingText}>Processing payment...</Text>
              </View>
            ) : (
              <WebView
                ref={webViewRef}
                source={{uri: paypalUrl}}
                onNavigationStateChange={handleNavigationStateChange}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                mixedContentMode="always"
                javaScriptCanOpenWindowsAutomatically={true}
                setSupportMultipleWindows={false}
                startInLoadingState={true}
                onError={syntheticEvent => {
                  const {nativeEvent} = syntheticEvent;
                  Alert.alert(
                    'Error',
                    'Failed to load payment page. Please try again.',
                  );
                }}
                onHttpError={syntheticEvent => {
                  const {nativeEvent} = syntheticEvent;
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default PaymentInfoScreen;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.LABELCOLOR,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
  },
  pdfButtonText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYWHITE,
  },
  pdfPreviewContainer: {
    marginTop: 16,
    height: 400,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
  },
  pdfPreview: {
    flex: 1,
  },
  pdfLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  pdfLoadingText: {
    marginTop: 12,
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.TITLECOLOR,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3fdf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
  },
  membersContainer: {
    marginTop: 5,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 5,
  },
  memberName: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    flex: 1,
  },
  memberAmount: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.TITLECOLOR,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.TABLEBORDER,
    marginBottom: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
  },
  totalAmount: {
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.LABELCOLOR,
  },
  paymentMethodTitle: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    marginBottom: 12,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  paymentButtonText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#FFFFFF',
  },
  noPaymentMethodContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPaymentMethodText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  headerTitle: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#6B7280',
  },
});
