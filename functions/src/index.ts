import axios from "axios";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// 🟢 ຕັ້ງຄ່າຂໍ້ມູນຮ້ານຄ້າຂອງທ່ານ (ຂໍ້ມູນຈິງ)
const ONEPAY_CONFIG = {
    // ຖ້າມີ URL ສຳລັບ Production ໃຫ້ປ່ຽນບ່ອນນີ້
    endpoint: "https://bcel.com.la:8083/onepay/api/v1/create_link", 
    mcid: "mch6824249c116e4",        
    shopCode: "JtS0SNSGbevz",        
    terminalId: "00000001"           // Terminal ID ປົກກະຕິແມ່ນ 00000001
};

export const generateOnePayQR = onCall(async (request) => {
    const { amount, invoiceId, description } = request.data;

    if (!amount || !invoiceId) {
        throw new HttpsError("invalid-argument", "Missing amount or invoiceId.");
    }

    try {
        logger.info("Generating OnePay QR for Shop: SOUDAPHONE", { amount, invoiceId });

        // ກຽມ Payload ຕາມມາດຕະຖານ BCEL OnePay
        const payload = {
            mcid: ONEPAY_CONFIG.mcid,
            shop_code: ONEPAY_CONFIG.shopCode,
            terminal_id: ONEPAY_CONFIG.terminalId,
            amount: amount,
            invoice_id: invoiceId,
            currency: "LAK",
            description: description || "Payment for Soudaphone POS",
            expire_time: 15 // ກຳນົດເວລາ 15 ນາທີ
        };

        // ຍິງ Request ໄປຫາ BCEL
        const response = await axios.post(ONEPAY_CONFIG.endpoint, payload);

        // ສົ່ງຜົນລັພທີ່ໄດ້ຈາກ BCEL ກັບໄປຫາ App
        return {
            success: true,
            qrCode: response.data.qr_code, 
            ticketId: response.data.ticket_id,
            fullResponse: response.data
        };

    } catch (error: any) {
        logger.error("OnePay API Error:", error.response?.data || error.message);
        throw new HttpsError("internal", "ຂໍອະໄພ, ບໍ່ສາມາດສ້າງ QR Code ຈາກລະບົບ OnePay ໄດ້ໃນຕອນນີ້.");
    }
});