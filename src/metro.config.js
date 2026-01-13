const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🟢 ບັງຄັບໃຫ້ Metro ອ່ານໄຟລ໌ Firebase ໄດ້ຖືກຕ້ອງ
config.resolver.sourceExts.push('cjs');

module.exports = config;