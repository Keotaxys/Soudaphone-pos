const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🟢 ບັງຄັບໃຫ້ Metro ຮູ້ຈັກໄຟລ໌ cjs ຂອງ Firebase
config.resolver.sourceExts.push('cjs');

module.exports = config;