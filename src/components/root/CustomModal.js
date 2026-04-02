import {
  View,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import React from 'react';

export default function CustomModal({
  visible,
  onRequestClose,
  onPress,
  modalcontent,
  justifyContent,
  disableOutsidePress,
}) {
  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: justifyContent ? justifyContent : 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  });
  return (
    <Modal
      presentationStyle="overFullScreen"
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback
          onPress={disableOutsidePress ? undefined : onPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        {modalcontent}
      </View>
    </Modal>
  );
}
