import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../types';

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
}

export default function ScannerModal({ visible, onClose, onScanned }: ScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  // key changes every time modal opens → forces CameraView remount → fresh auto-focus
  const [cameraKey, setCameraKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setIsCameraReady(false);
      setTorchEnabled(false);
      setCameraKey(k => k + 1);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || !isCameraReady) return;
    setScanned(true);
    onScanned(data);
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.scannerContainer}>

        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={{ color: 'white', marginBottom: 20 }}>ຕ້ອງການອະນຸຍາດໃຫ້ໃຊ້ກ້ອງຖ່າຍຮູບ</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={{ color: 'black', fontFamily: 'Lao-Bold' }}>ອະນຸຍາດ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
              <Text style={{ color: 'white' }}>ປິດ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // key prop forces remount on every open → guarantees auto-focus restarts
          <CameraView
            key={cameraKey}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            autoFocus="on"
            enableTorch={torchEnabled}
            onCameraReady={() => setIsCameraReady(true)}
            onBarcodeScanned={scanned || !isCameraReady ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'upc_e'],
            }}
          />
        )}

        <View style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>ສະແກນບາໂຄດ</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeScannerBtn}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>

          {!isCameraReady && permission?.granted && (
            <ActivityIndicator size="large" color="white" style={styles.cameraLoadingIndicator} />
          )}

          <View style={styles.scanFrame} />
          <Text style={styles.scanInstruction}>
            {scanned ? 'ກຳລັງປະມວນຜົນ...' : 'ວາງບາໂຄດໃຫ້ຢູ່ໃນກອບ'}
          </Text>

          {permission?.granted && (
            <TouchableOpacity
              onPress={() => setTorchEnabled(t => !t)}
              style={styles.torchBtn}
            >
              <Ionicons
                name={torchEnabled ? 'flash' : 'flash-off'}
                size={28}
                color={torchEnabled ? '#FFD700' : 'white'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  scannerTitle: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  closeScannerBtn: { padding: 5 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS?.secondary || '#FFB300', borderRadius: 20, backgroundColor: 'transparent' },
  scanInstruction: { color: 'white', marginTop: 20, fontFamily: 'Lao-Regular', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 10 },
  cameraLoadingIndicator: { position: 'absolute' },
  torchBtn: { position: 'absolute', bottom: 80, padding: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionBtn: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});