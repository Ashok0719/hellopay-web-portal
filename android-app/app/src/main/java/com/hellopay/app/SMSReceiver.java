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
                        processSMS(context, messageBody, sender, deviceId);
                    }
                }
            }
        }
    }

    private void processSMS(Context context, String body, String sender, String deviceId) {
        String sms = body.toLowerCase();

        // 1. Detect valid payment SMS (Rule: Must contain UPI/IMPS and transaction status)
        if (!(sms.contains("upi") || sms.contains("imps"))) return;
        if (!(sms.contains("debited") || sms.contains("credited"))) return;

        Log.d(TAG, "Neural Signal Captured: " + sms);
        
        // 2. Extract Amount (Rule: Handle Rs., Re., ₹ with tolerance)
        String amount = null;
        java.util.regex.Pattern amountPattern = java.util.regex.Pattern.compile("(₹|rs\\.?|re\\.?)[ ]?(\\d+)");
        java.util.regex.Matcher amountMatcher = amountPattern.matcher(sms);
        if (amountMatcher.find()) {
            amount = amountMatcher.group(2);
        }

        // 3. Extract UTR (Rule: Exactly 12 digits)
        String utr = null;
        java.util.regex.Pattern utrPattern = java.util.regex.Pattern.compile("\\b\\d{12}\\b");
        java.util.regex.Matcher utrMatcher = utrPattern.matcher(sms);
        if (utrMatcher.find()) {
            utr = utrMatcher.group();
        }

        // 4. Validate and Transmit Signal
        if (amount != null && utr != null) {
            Log.d(TAG, "Neural Sync -> Amt: " + amount + ", UTR: " + utr);
            sendToBackend(amount, utr, body, deviceId);
            
            // Feature: Neural Signal Relay (Requirement: UI Auto-Fill)
            Intent signalIntent = new Intent("com.hellopay.SMS_SIGNAL");
            signalIntent.putExtra("utr", utr);
            context.sendBroadcast(signalIntent);
        }
    }

    private String getDeviceId(Context context) {
        return Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
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
