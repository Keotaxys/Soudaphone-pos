const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// ເພີ່ມ cjs ເຂົ້າໄປເພື່ອໃຫ້ Metro ອ່ານໄຟລ໌ຂອງ Firebase v11 ໄດ້ຖືກຕ້ອງ
config.resolver.sourceExts.push('cjs');

module.exports = config;