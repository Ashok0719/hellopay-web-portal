package com.hellopay.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import android.provider.Settings;
import androidx.annotation.NonNull;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "HelloPaySMS";
    // Your Render Backend URL
    private static final String API_URL = "https://hellopay-neural-api.onrender.com/api/wallet/verify-sms";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();
                        
                        // Capture Device ID for Binding
                        String deviceId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
                        processSMS(messageBody, sender, deviceId);
                    }
                }
            }
        }
    }

    private void processSMS(String body, String sender, String deviceId) {
        // Feature: Improved Keyword Detection (Rule 4)
        String lowerBody = body.toLowerCase();
        boolean isFinancial = lowerBody.contains("debited") || 
                             lowerBody.contains("credited") || 
                             lowerBody.contains("upi") || 
                             lowerBody.contains("txn") || 
                             lowerBody.contains("ref") || 
                             lowerBody.contains("imps");

        if (!isFinancial) return;

        Log.d(TAG, "Financial SMS Signal: " + body);
        
        // Extract Amount Safely (Rule 4)
        String amount = extractAmount(body);
        // Extract 12-digit UTR
        String utr = extractUTR(body);

        if (amount != null && utr != null) {
            Log.d(TAG, "Syncing Signal -> Amt: " + amount + ", UTR: " + utr);
            sendToBackend(amount, utr, body, deviceId);
        }
    }

    private String extractAmount(String body) {
        // Optimized Regex for Amt: ₹100, Rs. 100, Rs100, etc.
        Pattern pattern = Pattern.compile("(?i)(Rs|₹|INR)\\.?\\s*([\\d,]+\\.?\\d*)");
        Matcher matcher = pattern.matcher(body);
        if (matcher.find()) {
            return matcher.group(2).replace(",", "");
        }
        return null;
    }

    private String extractUTR(String body) {
        // Strict 12-digit UPI UTR regex
        Pattern pattern = Pattern.compile("\\b(\\d{12})\\b");
        Matcher matcher = pattern.matcher(body);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private void sendToBackend(final String amount, final String utr, final String raw, final String deviceId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(API_URL);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    conn.setDoOutput(true);

                    JSONObject jsonParam = new JSONObject();
                    jsonParam.put("amount", amount);
                    jsonParam.put("utr", utr);
                    jsonParam.put("rawMessage", raw);
                    jsonParam.put("deviceId", deviceId);
                    jsonParam.put("source", "APK_SMS_SENTINEL");

                    OutputStream os = conn.getOutputStream();
                    os.write(jsonParam.toString().getBytes("UTF-8"));
                    os.flush();
                    os.close();

                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Neural Relay Status: " + responseCode);
                    conn.disconnect();
                } catch (Exception e) {
                    Log.e(TAG, "Relay Fault", e);
                }
            }
        }).start();
    }
}
