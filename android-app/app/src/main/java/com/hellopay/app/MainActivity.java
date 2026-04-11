package com.hellopay.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private static final int SMS_PERMISSION_CODE = 101;
    // URL of your production Vercel app
    private static final String APP_URL = "https://hellopay-web-portal.vercel.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        setupWebView();
        checkSmsPermissions();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        
        // Feature: Neural Session Persistence (Requirement: Fix Login Stuck)
        android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            settings.setMediaPlaybackRequiresUserGesture(false);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("upi://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "No UPI app found", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }
                return false;
            }
        });

        // The JS Bridge (Requirement: WEB + APK Communication)
        webView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");
        webView.loadUrl(APP_URL);
    }

    private void checkSmsPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            
            // Feature: User Explanation Screen (Requirement: Trust Building)
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Automated Verification")
                .setMessage("HelloPay uses SMS signals to verify your UPI payments automatically. We do NOT store or misuse your private messages. This is required for instant settlement.")
                .setPositiveButton("Enable Signal", (dialog, which) -> {
                    ActivityCompat.requestPermissions(MainActivity.this, 
                        new String[]{Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS}, 
                        SMS_PERMISSION_CODE);
                })
                .setNegativeButton("Manual Only", (dialog, which) -> {
                    Toast.makeText(MainActivity.this, "Auto-verification disabled. You must submit UTR manually.", Toast.LENGTH_LONG).show();
                })
                .show();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // JS Bridge Implementation
    public class WebAppInterface {
        @JavascriptInterface
        public void startUPIPayment(String amount, String upiId, String name) {
            String upiUrl = "upi://pay?pa=" + upiId + "&pn=" + Uri.encode(name) + "&am=" + amount + "&cu=INR";
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(upiUrl));
            try {
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Please install a UPI app", Toast.LENGTH_SHORT).show();
            }
        }

        @JavascriptInterface
        public void showToast(String message) {
            Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
        }
    }
}
