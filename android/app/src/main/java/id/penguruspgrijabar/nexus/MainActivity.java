package id.penguruspgrijabar.nexus;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.widget.FrameLayout;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    // Ganti setelah URL Vercel production tersedia.
    private static final String APP_URL = "https://nexus-iota-drab.vercel.app/login";
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        setContentView(root);

        root.setOnApplyWindowInsetsListener((view, insets) -> {
            int top = insets.getSystemWindowInsetTop();
            int bottom = insets.getSystemWindowInsetBottom();
            view.setPadding(0, top, 0, bottom);
            return insets;
        });
        root.requestApplyInsets();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(true);
        settings.setUserAgentString(settings.getUserAgentString() + " NexusAndroidApp");
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.addJavascriptInterface(new PdfDownloadBridge(), "NexusDownload");
        webView.addJavascriptInterface(new SessionBridge(), "NexusSession");
        CookieManager.getInstance().setAcceptCookie(true);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Tidak dapat mengunduh file", Toast.LENGTH_SHORT).show();
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                view.setVisibility(View.VISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                Toast.makeText(MainActivity.this, "Tidak dapat memuat NEXUS", Toast.LENGTH_SHORT).show();
            }
        });
        webView.loadUrl(APP_URL);
    }

    private final class SessionBridge {
        @JavascriptInterface
        public void clearSession() {
            runOnUiThread(() -> {
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.removeAllCookies(value -> {
                    cookieManager.flush();
                    WebStorage.getInstance().deleteAllData();
                    webView.clearHistory();
                    webView.clearCache(true);
                    webView.clearFormData();
                    webView.loadUrl(APP_URL);
                });
            });
        }
    }

    private final class PdfDownloadBridge {
        @JavascriptInterface
        public void savePdf(String base64Data, String fileName) {
            runOnUiThread(() -> {
                try {
                    byte[] pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);
                    String safeName = fileName == null ? "laporan-inventaris.pdf" : fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
                    if (!safeName.toLowerCase().endsWith(".pdf")) safeName += ".pdf";
                    Uri savedUri;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                        values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                        savedUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (savedUri == null) throw new IllegalStateException("Tidak dapat membuat file PDF");
                        try (OutputStream output = getContentResolver().openOutputStream(savedUri)) {
                            if (output == null) throw new IllegalStateException("Tidak dapat menulis file PDF");
                            output.write(pdfBytes);
                        }
                    } else {
                        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                        if (!downloads.exists() && !downloads.mkdirs()) throw new IllegalStateException("Folder Downloads tidak tersedia");
                        File outputFile = new File(downloads, safeName);
                        try (FileOutputStream output = new FileOutputStream(outputFile)) {
                            output.write(pdfBytes);
                        }
                        savedUri = Uri.fromFile(outputFile);
                    }
                    Toast.makeText(MainActivity.this, "PDF tersimpan di Downloads/" + safeName, Toast.LENGTH_LONG).show();
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Gagal menyimpan PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
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
}
