import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera'; // 🟢 1. ເພີ່ມ hook ຂໍສິດ
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../types';

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void; // 🟢 ປັບ Type ໃຫ້ງ່າຍຂຶ້ນ
}

export default function ScannerModal({ visible, onClose, onScanned }: ScannerModalProps) {
  // 🟢 2. ຈັດການ Permission
  const [permission, requestPermission] = useCameraPermissions();
  
  // 🟢 3. ຕົວແປປ້ອງກັນການສະແກນຊ້ຳ
  const [scanned, setScanned] = useState(false);

  // Reset ການສະແກນທຸກຄັ້ງທີ່ເປີດ Modal
  useEffect(() => {
    if (visible) {
      setScanned(false);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible, permission]);

  // 🟢 4. ຟັງຊັນຈັດການເມື່ອສະແກນໄດ້
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // ຖ້າສະແກນແລ້ວ ໃຫ້ຢຸດ
    setScanned(true);    // ລັອກໄວ້
    onScanned(data);     // ສົ່ງຂໍ້ມູນອອກໄປ
    // onClose();        // ປິດ Modal (ຖ້າຕ້ອງການປິດທັນທີ)
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.scannerContainer}>
        
        {/* ກວດສອບສະຖານະ Permission */}
        {!permission ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color="white" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={{color: 'white', marginBottom: 20}}>ຕ້ອງການອະນຸຍາດໃຫ້ໃຊ້ກ້ອງຖ່າຍຮູບ</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
               <Text style={{color: 'black', fontFamily: 'Lao-Bold'}}>ອະນຸຍາດ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{marginTop: 20}}>
               <Text style={{color: 'white'}}>ປິດ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="back"
            // 🟢 5. ໃຊ້ handleBarcodeScanned ແທນ ແລະ ປິດການຮັບຄ່າຖ້າສະແກນແລ້ວ
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "upc_e"],
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
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstruction}>
                {scanned ? "ກຳລັງປະມວນຜົນ..." : "ວາງບາໂຄດໃຫ້ຢູ່ໃນກອບ"}
            </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }, // ປັບໃຫ້ Overlay ທັບກ້ອງ
  scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  scannerTitle: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  closeScannerBtn: { padding: 5 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS?.secondary || '#FFB300', borderRadius: 20, backgroundColor: 'transparent' },
  scanInstruction: { color: 'white', marginTop: 20, fontFamily: 'Lao-Regular', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionBtn: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }
});