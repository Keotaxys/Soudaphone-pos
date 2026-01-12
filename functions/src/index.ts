import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";

// 1. ຕັ້ງຄ່າຂໍ້ມູນຮ້ານຄ້າ (ຂໍ້ມູນຈຳລອງ)
const ONEPAY_CONFIG = {
    endpoint: "https://bcel.com.la:8083/onepay/api/v1/create_link", // UAT/Prod URL
    mcid: "mch5c2f0404102fb",        // ໃສ່ MCID ຂອງທ່ານ
    shopCode: "12345678",            // ໃສ່ Shop Code ຂອງທ່ານ
    terminalId: "00000001"           // ໃສ່ Terminal ID (ຖ້າມີ)
};

// 2. ສ້າງ Function
export const generateOnePayQR = onCall(async (request) => {
    // 🟢 ແກ້ໄຂຈຸດນີ້: ດຶງຂໍ້ມູນຈາກ request.data
    const { amount, invoiceId, description } = request.data;

    // ກວດສອບຂໍ້ມູນ
    if (!amount || !invoiceId) {
        throw new HttpsError("invalid-argument", "Missing amount or invoiceId.");
    }

    try {
        logger.info("Generating OnePay QR for:", { amount, invoiceId });

        // ກຽມ Payload ສົ່ງໃຫ້ BCEL
        const payload = {
            mcid: ONEPAY_CONFIG.mcid,
            shop_code: ONEPAY_CONFIG.shopCode,
            terminal_id: ONEPAY_CONFIG.terminalId,
            amount: amount,
            invoice_id: invoiceId,
            currency: "LAK",
            description: description || "Payment for Goods",
            expire_time: 15 // ນາທີ
        };

        // ຍິງ Request ໄປຫາ BCEL
        // (ໝາຍເຫດ: ຖ້າຍັງບໍ່ມີ MCID ແທ້ ອາດຈະ Error ຈາກ BCEL ແຕ່ Function ເຮົາຈະບໍ່ແຕກ)
        const response = await axios.post(ONEPAY_CONFIG.endpoint, payload);

        // ສົ່ງຜົນລັພກັບໄປໃຫ້ App
        return {
            success: true,
            qrCode: response.data.qr_code, // String ທີ່ເອົາໄປສ້າງ QR
            ticketId: response.data.ticket_id,
            fullResponse: response.data
        };

    } catch (error: any) {
        logger.error("OnePay Error:", error.message);
        
        // ສົ່ງ Error ກັບໄປ (ແຕ່ບໍ່ບອກລາຍລະອຽດເລິກເພື່ອຄວາມປອດໄພ)
        throw new HttpsError("internal", "Failed to generate QR Code.");
    }
});