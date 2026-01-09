import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../types';

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: { data: string }) => void;
}

export default function ScannerModal({ visible, onClose, onScanned }: ScannerModalProps) {
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.scannerContainer}>
        <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={onScanned}
            barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128"],
            }}
        />
        <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
                <Text style={styles.scannerTitle}>ສະແກນບາໂຄດ</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeScannerBtn}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
            </View>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstruction}>ວາງບາໂຄດໃຫ້ຢູ່ໃນກອບ</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scannerTitle: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  closeScannerBtn: { padding: 5 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.secondary, borderRadius: 20, backgroundColor: 'transparent' },
  scanInstruction: { color: 'white', marginTop: 20, fontFamily: 'Lao-Regular' }
});