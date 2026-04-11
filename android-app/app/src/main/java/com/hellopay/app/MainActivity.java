package com.hellopay.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private static final int SMS_PERMISSION_CODE = 101;
    private static final String APP_URL = "https://hellopay-userweb.vercel.app";

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
        
        // Feature: Neural Session Persistence (Requirement: Stop Auto-Logout)
        android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
        
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Feature: Neural Ghost Mode (Bypass Google Login Block)
        // Using high-trust Pixel 8 Pro UserAgent to avoid "disallowed_useragent"
        String chromeUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UQ1A.231205.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";
        settings.setUserAgentString(chromeUA);

        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true); // Requirement: Fix "Blank White Screen" during Google OAuth
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebViewClient(new android.webkit.WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(android.webkit.WebView view, String url) {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false;
                }
                
                try {
                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    android.widget.Toast.makeText(MainActivity.this, "App not installed on device", android.widget.Toast.LENGTH_SHORT).show();
                    return true;
                }
            }
        });
        
        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onCreateWindow(android.webkit.WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                android.webkit.WebView newWebView = new android.webkit.WebView(MainActivity.this);
                newWebView.getSettings().setJavaScriptEnabled(true);
                newWebView.getSettings().setSupportMultipleWindows(true);
                newWebView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
                
                newWebView.setWebViewClient(new android.webkit.WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(android.webkit.WebView view, String url) {
                        webView.loadUrl(url); // Load the popup URL in the main view
                        return true; 
                    }
                });
                
                android.webkit.WebView.WebViewTransport transport = (android.webkit.WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(newWebView);
                resultMsg.sendToTarget();
                return true;
            }
        });

        // The JS Bridge (Requirement: WEB + APK Communication)
        webView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");
        webView.loadUrl(APP_URL);
    }

    private void checkSmsPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Automated Verification")
                .setMessage("HelloPay uses SMS signals to verify your UPI payments automatically. This is required for instant settlement.")
                .setPositiveButton("Enable Signal", (dialog, which) -> {
                    ActivityCompat.requestPermissions(MainActivity.this, 
                        new String[]{Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS}, 
                        SMS_PERMISSION_CODE);
                })
                .setNegativeButton("Manual Only", (dialog, which) -> {
                    Toast.makeText(MainActivity.this, "Auto-verification disabled.", Toast.LENGTH_LONG).show();
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

    private boolean isReceiverRegistered = false;

    @Override
    protected void onResume() {
        super.onResume();
        if (!isReceiverRegistered) {
            try {
                android.content.IntentFilter filter = new android.content.IntentFilter("com.hellopay.SMS_SIGNAL");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    registerReceiver(smsSignalReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
                } else {
                    registerReceiver(smsSignalReceiver, filter);
                }
                isReceiverRegistered = true;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (isReceiverRegistered) {
            try {
                unregisterReceiver(smsSignalReceiver);
                isReceiverRegistered = false;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private final android.content.BroadcastReceiver smsSignalReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String utr = intent.getStringExtra("utr");
            if (utr != null) {
                // Feature: Neural JS-Injection (Requirement: Native Compatible JS)
                webView.post(() -> {
                    webView.loadUrl("javascript:(function(){ " +
                        "var input = document.querySelector('input[placeholder*=\"UTR\"], input[placeholder*=\"ID\"]'); " +
                        "if(input) { input.value = '" + utr + "'; input.dispatchEvent(new Event('input', { bubbles: true })); } " +
                        "var buttons = document.querySelectorAll('button'); " +
                        "for(var i=0; i<buttons.length; i++) { " +
                        "  var text = buttons[i].innerText.toUpperCase(); " +
                        "  if(text.includes('SUBMIT') || text.includes('VERIFY')) { buttons[i].click(); break; } " +
                        "} " +
                        "})()");
                    Toast.makeText(MainActivity.this, "Signal Linked: " + utr, Toast.LENGTH_LONG).show();
                });
            }
        }
    };

    // JS Bridge Implementation
    public class WebAppInterface {
        @JavascriptInterface
        public void copyToClipboard(String text) {
            android.content.ClipboardManager clipboard = (android.content.ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            android.content.ClipData clip = android.content.ClipData.newPlainText("HelloPay ID", text);
            clipboard.setPrimaryClip(clip);
            Toast.makeText(MainActivity.this, "Copied ID: " + text + " - Paste in GPay", Toast.LENGTH_SHORT).show();
        }

        @JavascriptInterface
        public void startUPIPayment(String amount, String upiId, String name) {
            // Feature: Invisible Signal (Requirement: Bypass Bank P2P Blocks)
            // Rule: Stripping amount and merchant codes to mimic "Manual Contact" entry
            String upiUrl = "upi://pay?pa=" + upiId + "&pn=" + Uri.encode(name);
                            
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(upiUrl));
            try {
                // Secondary confirmation helps track the session
                startActivityForResult(intent, 123);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Please install a UPI app", Toast.LENGTH_SHORT).show();
            }
        }

        @JavascriptInterface
        public void showToast(String message) {
            Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 123) {
            // Feature: Soft Confirmation (Backup Trace)
            Toast.makeText(this, "Payment Application Closed - Syncing Signal...", Toast.LENGTH_LONG).show();
        }
    }
}
