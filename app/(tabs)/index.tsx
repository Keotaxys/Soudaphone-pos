import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onValue, push, ref, remove, set, update } from 'firebase/database';

// 🟢 ແກ້ Path ຈາກ ./src ເປັນ ../../src
import { db } from '../../src/firebase';
import { CartItem, Product, SaleRecord } from '../../src/types';

// Screens Imports (ແກ້ Path ໝົດທຸກອັນ)
import CustomerScreen from '../../src/components/screens/CustomerScreen';
import DebtScreen from '../../src/components/screens/DebtScreen';
import DebtsReceivableScreen from '../../src/components/screens/DebtsReceivableScreen';
import SpecialSaleScreen from '../../src/components/screens/SpecialSaleScreen';

import ExpenseScreen from '../../src/components/screens/ExpenseScreen';
import HomeScreen from '../../src/components/screens/HomeScreen';
import LoginScreen from '../../src/components/screens/LoginScreen';
import OrderTrackingScreen from '../../src/components/screens/OrderTrackingScreen';
import POSScreen from '../../src/components/screens/POSScreen';
import ProductsScreen from '../../src/components/screens/ProductsScreen';
import ReportDashboard from '../../src/components/screens/ReportDashboard';
import SalesHistoryScreen from '../../src/components/screens/SalesHistoryScreen';
import ShiftScreen from '../../src/components/screens/ShiftScreen';
import UserManagementScreen from '../../src/components/screens/UserManagementScreen'; 

// UI Components
import Footer from '../../src/components/ui/Footer';
import Header from '../../src/components/ui/Header';
import Sidebar from '../../src/components/ui/Sidebar';

// Modals
import EditShopModal from '../../src/components/modals/EditShopModal';
import ProductModal from '../../src/components/modals/ProductModal';
import ScannerModal from '../../src/components/modals/ScannerModal';