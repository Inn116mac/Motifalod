import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  SafeAreaView,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import NetInfo from '@react-native-community/netinfo';
import WebView from 'react-native-webview';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import CustomHeader from '../components/root/CustomHeader';
import {MaterialIcons} from '@react-native-vector-icons/material-icons';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import {API_HOST, IMAGE_URL} from '../connection/Config';
import httpClient from '../connection/httpClient';
import BraintreeDropIn from 'react-native-braintree-dropin-ui';

const PaymentInfoFromAdmin = ({route, navigation}) => {
  const {item, memberConfiguration} = route.params || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptUri, setReceiptUri] = useState(null);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captureCalledRef = useRef(false);
  const webViewRef = useRef(null);

  // PayPal states
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  // Helper function to check if member is already paid
  const isMemberPaid = member => {
    if (!member?.isPaid) return false;
    return member.isPaid.toLowerCase() === 'yes';
  };

  // Filter out members who have already paid
  // const unpaidMembers =
  //   item?.familyMembers?.filter(member => !isMemberPaid(member)) || [];

  const unpaidMembers =
    item?.familyMembers?.filter(member => {
      if (member?.hasOwnProperty('isApproved')) {
        if (
          member?.isApproved?.toLowerCase() == 'yes' ||
          member.isApproved === true
        ) {
          return !isMemberPaid(member);
        }
        return false;
      }
      return !isMemberPaid(member);
    }) || [];

  // Calculate total amount from unpaid family members only
  const calculateTotalAmount = () => {
    return unpaidMembers.reduce((total, member) => {
      const amount = parseFloat(member.membershipamount) || 0;
      return total + amount;
    }, 0);
  };

  const totalAmount = calculateTotalAmount();

  // Payment methods configuration
  const paymentMethods = [
    {id: 'cash', label: 'Cash', icon: '💵', requiresReceipt: true},
    {id: 'check', label: 'Check', icon: '📄', requiresReceipt: true},
    {id: 'venmo', label: 'Venmo', icon: '📱', requiresReceipt: false},
    {id: 'paypal', label: 'PayPal', icon: '💳', requiresReceipt: false},
  ];

  // Check if selected payment method requires receipt
  const selectedMethod = paymentMethods.find(
    m => m.id === selectedPaymentMethod,
  );
  const requiresReceipt = selectedMethod?.requiresReceipt || false;

  const isVenmoAppInstalled = async () => {
    try {
      const venmoUrl = 'venmo://';
      const canOpen = await Linking.canOpenURL(venmoUrl);
      return canOpen;
    } catch (error) {
      return false;
    }
  };

  // Add this function in your component
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

  // PayPal payment creation
  const createPaymentOrder = async paymentType => {
    setIsSubmitting(true);
    setIsPaymentCompleted(false);
    captureCalledRef.current = false;
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        setIsSubmitting(false);
        return;
      }

      const data = {
        amount: totalAmount,
        paymentType: paymentType,
        configurationId: memberConfiguration,
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
      setIsSubmitting(false);
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

        // IMMEDIATELY set completed state and close modal
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
                    // Navigate back
                    navigation.goBack();
                  },
                },
              ],
              {cancelable: false},
            );
          }, 300);
        }, 10000);
      } else {
        NOTIFY_MESSAGE(
          responseData?.message || 'Payment captured successfully',
        );
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

  // Handle file upload
  const handleFileUpload = async file => {
    const fileUri =
      Platform.OS === 'ios' ? file?.path?.replace('file://', '') : file?.path;

    const mimeType = file.mime;

    if (!mimeType) {
      Alert.alert('Error', 'File does not have a valid MIME type.');
      return;
    }

    const formData = new FormData();
    const fileObj = {
      uri: fileUri,
      name: fileUri.split('/').pop(),
      type: mimeType,
    };
    formData.append('file', fileObj);

    try {
      setIsUploading(true);
      const response = await httpClient.post(
        'file/single/upload?location=content',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            const percentage = Math.floor((current / total) * 100);
            setUploadProgress(percentage);
          },
        },
      );

      if (response.data.status) {
        let uploadedImageUrl = '';

        if (Array.isArray(response.data.result)) {
          uploadedImageUrl = response.data.result[0]?.imagePath || '';
        } else if (typeof response.data.result === 'object') {
          uploadedImageUrl = response.data.result?.imagePath || '';
        }

        setUploadedReceiptUrl(uploadedImageUrl);
        setUploadComplete(true);
        NOTIFY_MESSAGE(
          response?.data?.message || 'Receipt uploaded successfully',
        );
        setTimeout(() => {
          setUploadComplete(false);
        }, 2000);
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Upload failed');
        setUploadComplete(false);
      }
    } catch (err) {
      NOTIFY_MESSAGE(err?.message || 'Something went wrong');
      setUploadComplete(false);
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  // Image Select Modal Component
  const ImageSelectModal = ({visible, onClose, onSelect}) => {
    const handleSelectCamera = () => {
      ImagePicker.openCamera({
        width: 300,
        height: 400,
      })
        .then(response => {
          const fileSizeInMB = response?.size / (1024 * 1024);

          if (fileSizeInMB > 30) {
            Alert.alert(
              'Invalid File Size',
              'File size cannot be greater than 30MB. Please choose a smaller file.',
            );
          } else {
            setReceiptUri(response.path);
            onSelect(response);
            onClose();
          }
        })
        .catch(err => {
          if (err.code !== 'E_PICKER_CANCELLED') {
            NOTIFY_MESSAGE(err?.message || 'Something went wrong');
          }
        });
    };

    const handleSelectGallery = () => {
      ImagePicker.openPicker({
        mediaType: 'photo',
        multiple: false,
      })
        .then(response => {
          const fileSizeInMB = response?.size / (1024 * 1024);

          if (fileSizeInMB > 30) {
            Alert.alert(
              'Invalid File Size',
              'File size cannot be greater than 30MB. Please choose a smaller file.',
            );
          } else {
            setReceiptUri(response.path);
            onSelect(response);
            onClose();
          }
        })
        .catch(err => {
          if (err.code !== 'E_PICKER_CANCELLED') {
            NOTIFY_MESSAGE(err?.message || 'Something went wrong');
          }
        });
    };

    return (
      <Modal transparent={true} visible={visible} animationType="slide">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={handleSelectCamera}>
                  <FontAwesome name="camera" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={handleSelectGallery}>
                  <FontAwesome name="image" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.roundButton} onPress={onClose}>
                  <FontAwesome name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Handle delete receipt
  const handleDeleteReceipt = () => {
    setReceiptUri(null);
    setUploadedReceiptUrl(null);
    setUploadComplete(false);
  };

  // Handle complete payment
  const handleCompletePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    // For PayPal, trigger PayPal flow
    if (selectedPaymentMethod === 'paypal') {
      if (totalAmount <= 0) {
        NOTIFY_MESSAGE('Invalid payment amount');
        return;
      }
      await createPaymentOrder('PayPal');
      return;
    }

    // For Venmo
    if (selectedPaymentMethod === 'venmo') {
      if (totalAmount <= 0) {
        NOTIFY_MESSAGE('Invalid payment amount');
        return;
      }

      await processVenmoPayment();

      return;
    }

    // For Cash/Check - require receipt
    if (requiresReceipt && !uploadedReceiptUrl) {
      Alert.alert('Error', 'Please upload payment receipt');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare payment data according to API schema
      const paymentData = {
        amount: totalAmount,
        paymentType: selectedMethod.label,
        configurationId: memberConfiguration,
        uploadedUrl: uploadedReceiptUrl || '',
      };

      // Call the API
      const response = await httpClient.post(
        'payment/createorder',
        paymentData,
      );

      if (response.data.status) {
        NOTIFY_MESSAGE(
          response?.data?.message || 'Payment completed successfully',
        );

        // Navigate back or refresh the list
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Payment failed');
      }
    } catch (err) {
      NOTIFY_MESSAGE(err?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const testVenmoPaymentOnEmulator = async () => {
    try {
      setIsSubmitting(true);

      // Use Braintree's official fake nonce for testing
      const fakeNonce = 'fake-venmo-account-nonce';

      // Call your backend with the fake nonce
      await completeVenmoPayment(fakeNonce);
    } catch (error) {
      NOTIFY_MESSAGE(error?.message || 'Test payment failed');
    } finally {
      setIsSubmitting(false);
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

      // // Show Drop-In with ONLY Venmo enabled
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
        configurationId: memberConfiguration,
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
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      {/* Header */}
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

          <View style={styles.familyNameContainer}>
            <Text style={styles.familyLabel}>Family : {item?.member}</Text>
          </View>

          {/* Family Members List - Only Unpaid Members */}
          {unpaidMembers.length > 0 ? (
            <View style={styles.membersContainer}>
              {unpaidMembers.map((member, index) => {
                const firstName = member?.firstName || '';
                const lastName = member?.lastName || '';
                const relationship = member?.relationship || '';
                const amount = member?.membershipamount || '0';

                return (
                  <View key={member.configurationId || index}>
                    <View style={styles.memberRow}>
                      <View style={{flex: 1}}>
                        <Text style={styles.memberName}>
                          {firstName} {lastName}
                        </Text>
                        {relationship && relationship !== '-' && (
                          <Text style={styles.memberRelation}>
                            {capitalizeFirstLetter(relationship)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.memberAmount}>
                        ${parseFloat(amount).toFixed(0)}
                      </Text>
                    </View>

                    {index < unpaidMembers.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersText}>
                All family members have already paid
              </Text>
            </View>
          )}

          {/* Total Amount Row */}
          {unpaidMembers.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(0)}</Text>
            </View>
          )}
        </View>

        {/* Payment Method Card - Only show if there are unpaid members */}
        {unpaidMembers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
            <View style={styles.paymentMethodsList}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === method.id &&
                      styles.paymentMethodCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedPaymentMethod(method.id);
                    // Reset receipt when changing payment method
                    if (!method.requiresReceipt) {
                      setReceiptUri(null);
                      setUploadedReceiptUrl(null);
                      setUploadComplete(false);
                    }
                  }}>
                  <View style={styles.paymentMethodContent}>
                    <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                    <Text
                      style={[
                        styles.paymentMethodLabel,
                        selectedPaymentMethod === method.id &&
                          styles.paymentMethodLabelSelected,
                      ]}>
                      {method.label}
                    </Text>
                  </View>
                  {selectedPaymentMethod === method.id && (
                    <MaterialDesignIcons
                      name="check-circle"
                      size={24}
                      color={'#246403'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Receipt Upload Section - Show only for Cash/Check */}
            {requiresReceipt && selectedPaymentMethod && (
              <View style={styles.receiptSection}>
                <Text style={styles.receiptTitle}>Payment Receipt</Text>

                <TouchableOpacity
                  style={styles.uploadButton}
                  disabled={isUploading}
                  onPress={() => {
                    if (totalAmount <= 0) {
                      NOTIFY_MESSAGE('Invalid payment amount');
                      return;
                    }
                    setReceiptModalVisible(true);
                  }}>
                  <MaterialDesignIcons
                    name="upload"
                    size={20}
                    color={COLORS.PRIMARYWHITE}
                  />
                  <Text style={styles.uploadButtonText}>Upload Image</Text>
                </TouchableOpacity>

                {/* Upload Progress */}
                {uploadProgress > 0 && isUploading && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      Uploading: {uploadProgress}%
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {width: `${uploadProgress}%`},
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Upload Complete Message */}
                {uploadComplete && !isUploading && (
                  <View style={styles.uploadCompleteContainer}>
                    <MaterialDesignIcons
                      name="check-circle"
                      size={20}
                      color={COLORS.LABELCOLOR}
                    />
                    <Text style={styles.uploadCompleteText}>
                      Upload complete!
                    </Text>
                  </View>
                )}

                {/* Display Uploaded Image */}
                {receiptUri && uploadedReceiptUrl && (
                  <View style={styles.receiptImageContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('FullImageScreen', {
                          image: uploadedReceiptUrl,
                        });
                      }}>
                      <FastImage
                        source={{
                          uri: IMAGE_URL + uploadedReceiptUrl,
                          priority: FastImage.priority.normal,
                        }}
                        resizeMode="cover"
                        style={styles.receiptImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteImageButton}
                      onPress={handleDeleteReceipt}>
                      <MaterialDesignIcons
                        name="close-circle"
                        size={28}
                        color={COLORS.PRIMARYRED}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons - Only show if there are unpaid members */}
      {unpaidMembers.length > 0 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.completeButton,
              (!selectedPaymentMethod ||
                (requiresReceipt && !uploadedReceiptUrl)) &&
                styles.completeButtonDisabled,
            ]}
            onPress={handleCompletePayment}
            disabled={
              !selectedPaymentMethod ||
              (requiresReceipt && !uploadedReceiptUrl) ||
              isSubmitting
            }>
            <Text style={styles.completeButtonText}>
              {isSubmitting ? 'Processing...' : 'Complete Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Select Modal */}
      <ImageSelectModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        onSelect={handleFileUpload}
      />

      {/* PayPal WebView Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          Alert.alert(
            isPaymentCompleted ? 'Close Payment' : 'Cancel Payment',
            isPaymentCompleted
              ? 'Are you sure you want to close?'
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
          <View style={styles.paymentModalContainer}>
            <View style={styles.paymentHeader}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    isPaymentCompleted ? 'Close Payment' : 'Cancel Payment',
                    isPaymentCompleted
                      ? 'Are you sure you want to close?'
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
              <Text style={styles.paymentHeaderTitle}>PayPal Payment</Text>
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
                    'Failed to load PayPal. Please try again.',
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

const styles = StyleSheet.create({
  paymentMethodsList: {
    gap: 10,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  paymentMethodCardSelected: {
    borderColor: '#246403',
    backgroundColor: '#f0fdf4',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodIcon: {
    fontSize: 24,
  },
  paymentMethodLabel: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.TITLECOLOR || '#333',
  },
  paymentMethodLabelSelected: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#246403',
  },
  bottomContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.PRIMARYWHITE || '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.TITLECOLOR || '#333',
  },
  completeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.LABELCOLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#bbb',
    opacity: 0.6,
  },
  completeButtonText: {
    fontFamily: FONTS.FONT_FAMILY.BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYWHITE || '#fff',
  },
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
  familyNameContainer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 4,
  },
  familyLabel: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.TITLECOLOR || '#333',
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
  memberRelation: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    color: COLORS.TITLECOLOR,
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
    includeFontPadding: false,
  },
  memberAmount: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.LABELCOLOR,
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
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: COLORS.TABLEBORDER,
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
    marginBottom: 4,
  },
  noMembersContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMembersText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.LABELCOLOR || '#666',
    textAlign: 'center',
  },
  receiptSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.TABLEBORDER,
  },
  receiptTitle: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PRIMARYBLACK,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.LABELCOLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  uploadButtonText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYWHITE,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.TITLECOLOR,
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 4,
  },
  uploadCompleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  uploadCompleteText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.LABELCOLOR,
  },
  receiptImageContainer: {
    marginTop: 10,
    alignSelf: 'flex-start',
    width: 100,
    height: 100,
    position: 'relative',
  },
  receiptImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
  },
  deleteImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  roundButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  // PayPal Modal Styles
  paymentModalContainer: {
    flex: 1,
    backgroundColor: COLORS.PRIMARYWHITE || '#FFFFFF',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: COLORS.PRIMARYWHITE || '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  paymentHeaderTitle: {
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
    backgroundColor: COLORS.PRIMARYWHITE || '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#6B7280',
  },
});

export default PaymentInfoFromAdmin;
