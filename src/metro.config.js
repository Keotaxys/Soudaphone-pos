const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🟢 ບັງຄັບໃຫ້ Metro ຮູ້ຈັກນາມສະກຸນໄຟລ໌ .cjs (ທີ່ Firebase v11 ໃຊ້)
config.resolver.sourceExts.push('cjs');

module.exports = config;