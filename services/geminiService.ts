import { GoogleGenAI, Type } from "@google/genai";
import { BillData } from "../types";

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeBillImage = async (file: File): Promise<Partial<BillData>> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key not found.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await fileToBase64(file);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: `這是一張台灣電力公司的電費單。請詳細分析圖片並擷取以下資料。
            
            **特別注意月份規則**：
            請分析「用電計費期間」的 **結束日期**。
            - 帳單年份 (rocYear) 應為結束日期的民國年份。
            - 帳單月份 (month) 應為結束日期的月份。
            (例如：計費期間 114.10.29-114.11.26，結束日期是 11月26日，所以年份為 114，月份為 11)。

            需擷取的欄位：
            1. 帳單年份 (rocYear): 依據上述規則。
            2. 帳單月份 (month): 依據上述規則。
            3. 總用電度數 (usage): 總用電度數。
            4. 電費總金額 (amount): 電費總金額。
            5. 用電計費期間 (billingPeriod): 完整字串，例如 "113年08月29日至113年09月26日"。
            6. 經常契約容量 (contractCapacity): 數字。
            7. 經常最高需量 (maxDemand): 數字。
            8. 功率因數 (powerFactor): 數字 (%)。
            9. 電號 (meterNumber): 位於左上角的電號，格式如 18-33-7005-08-7。
            10. 本期指數 (currentReading): 位於「底度」欄位的數字。
            11. 上期指數 (lastReading): 位於「上期指數」欄位的數字。
            12. 用電種類 (usageCategory): 位於「用電種類」欄位的文字，例如 "C5"。
            13. 繳費期限 (paymentDeadline): 若有顯示繳費期限。

            **費用明細(用於計算公式驗證)**:
            14. 基本電費 (basicFee): 數字。
            15. 流動電費 (flowFee): 數字。
            16. 功率因數調整費 (paymentAdjustment): 數字 (通常為負值或正值)。
            17. 其他 (others): 超約附加費或其他小額項目的總和。
            `
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rocYear: { type: Type.NUMBER, description: "Republic of China Year based on usage end date" },
            month: { type: Type.NUMBER, description: "Month based on usage end date" },
            usage: { type: Type.NUMBER, description: "Total Electricity Usage" },
            amount: { type: Type.NUMBER, description: "Total Amount" },
            billingPeriod: { type: Type.STRING, description: "Billing Date Range String" },
            contractCapacity: { type: Type.NUMBER, description: "Regular Contract Capacity" },
            maxDemand: { type: Type.NUMBER, description: "Regular Max Demand" },
            powerFactor: { type: Type.NUMBER, description: "Power Factor percentage" },
            meterNumber: { type: Type.STRING, description: "Meter Number ID" },
            currentReading: { type: Type.NUMBER, description: "Current Meter Reading (底度)" },
            lastReading: { type: Type.NUMBER, description: "Previous Meter Reading (上期指數)" },
            usageCategory: { type: Type.STRING, description: "Usage Category (e.g. C5)" },
            paymentDeadline: { type: Type.STRING, description: "Payment Deadline Date" },
            basicFee: { type: Type.NUMBER, description: "Basic Fee Amount" },
            flowFee: { type: Type.NUMBER, description: "Flowing Fee Amount" },
            paymentAdjustment: { type: Type.NUMBER, description: "Power Factor Adjustment Amount" },
            others: { type: Type.NUMBER, description: "Other fees" }
          },
          required: ["rocYear", "month", "usage", "amount"],
        },
      },
    });

    let jsonString = response.text || "{}";
    // Sanitize JSON string: remove markdown code blocks if present
    jsonString = jsonString.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
    const result = JSON.parse(jsonString);
    
    if (!result.rocYear || !result.month) {
      throw new Error("Could not extract date information from image.");
    }

    return {
      rocYear: result.rocYear,
      month: result.month,
      usage: result.usage,
      amount: result.amount,
      billingPeriod: result.billingPeriod,
      contractCapacity: result.contractCapacity,
      maxDemand: result.maxDemand,
      powerFactor: result.powerFactor,
      meterNumber: result.meterNumber,
      currentReading: result.currentReading,
      lastReading: result.lastReading,
      usageCategory: result.usageCategory,
      paymentDeadline: result.paymentDeadline,
      basicFee: result.basicFee || 0,
      flowFee: result.flowFee || 0,
      paymentAdjustment: result.paymentAdjustment || 0,
      others: result.others || 0
    };

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};