/**
 * SMS Gateway Service
 * Supports Twilio, Fast2SMS, or custom SMS gateway configured via .env
 */

async function sendSmsOtp({ phone, otp, studentName, regNo }) {
  const message = `[Vignan University] Your Student ID verification OTP is ${otp}. Valid for 5 minutes. Do not share this code.`;

  // 1. Twilio SMS Integration
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");

      const params = new URLSearchParams();
      params.append("To", phone.startsWith("+") ? phone : `+91${phone}`);
      params.append("From", process.env.TWILIO_PHONE_NUMBER);
      params.append("Body", message);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error("Twilio SMS Error:", data.message);
        return { success: false, provider: "Twilio", error: data.message };
      }

      console.log(`[SMS Service] Twilio SMS dispatched successfully to +91${phone}`);
      return { success: true, provider: "Twilio", sid: data.sid };
    } catch (err) {
      console.error("Twilio SMS dispatch exception:", err.message);
      return { success: false, provider: "Twilio", error: err.message };
    }
  }

  // 2. Fast2SMS Integration (Instant OTP route in India)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: cleanPhone,
        }),
      });

      const data = await response.json();
      console.log(`[SMS Service] Fast2SMS dispatched to ${cleanPhone}:`, data);
      return { success: data.return === true, provider: "Fast2SMS", data };
    } catch (err) {
      console.error("Fast2SMS dispatch exception:", err.message);
      return { success: false, provider: "Fast2SMS", error: err.message };
    }
  }

  // 3. 2Factor.in Integration (Popular Indian SMS Gateway)
  if (process.env.TWOFACTOR_API_KEY) {
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${cleanPhone}/${otp}/OTP1`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(`[SMS Service] 2Factor dispatched to ${cleanPhone}:`, data);
      return { success: data.Status === "Success", provider: "2Factor", data };
    } catch (err) {
      console.error("2Factor dispatch exception:", err.message);
      return { success: false, provider: "2Factor", error: err.message };
    }
  }

  // 3. Fallback when SMS Gateway credentials are not yet set in .env
  console.log("----------------------------------------------------------------");
  console.log(`[SMS Gateway Notice] No SMS API credentials found in backend/.env`);
  console.log(`Target Phone: +91 ${phone}`);
  console.log(`Generated OTP: ${otp}`);
  console.log(`Message: "${message}"`);
  console.log(`To enable live SMS, configure TWILIO_* or FAST2SMS_API_KEY in backend/.env`);
  console.log("----------------------------------------------------------------");

  return {
    success: true,
    provider: "ConsoleLogger",
    simulated: true,
    message: "SMS gateway not configured in .env. OTP logged to server console.",
  };
}

module.exports = { sendSmsOtp };

