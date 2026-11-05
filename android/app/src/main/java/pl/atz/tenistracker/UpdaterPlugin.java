package pl.atz.tenistracker;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Aktualizacja aplikacji z GitHub Releases: pobiera APK do cache i uruchamia
 * systemowy instalator. Android i tak prosi użytkownika o potwierdzenie
 * instalacji; wymaga jednorazowego zezwolenia "instaluj nieznane aplikacje"
 * dla Tennis Trackera.
 */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

  @PluginMethod
  public void getVersionCode(PluginCall call) {
    try {
      Context ctx = getContext();
      PackageInfo info = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
      long code = Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
      JSObject ret = new JSObject();
      ret.put("versionCode", code);
      ret.put("versionName", info.versionName);
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Nie można odczytać wersji: " + e.getMessage());
    }
  }

  @PluginMethod
  public void install(final PluginCall call) {
    final String url = call.getString("url");
    if (url == null || !url.startsWith("https://")) {
      call.reject("Nieprawidłowy adres pobierania");
      return;
    }
    final Context ctx = getContext();
    if (Build.VERSION.SDK_INT >= 26 && !ctx.getPackageManager().canRequestPackageInstalls()) {
      Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
      settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      ctx.startActivity(settings);
      JSObject ret = new JSObject();
      ret.put("needsPermission", true);
      call.resolve(ret);
      return;
    }
    new Thread(() -> {
      try {
        File dir = new File(ctx.getCacheDir(), "updates");
        if (!dir.exists()) dir.mkdirs();
        File apk = new File(dir, "update.apk");
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        int total = conn.getContentLength();
        try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(apk)) {
          byte[] buf = new byte[32 * 1024];
          long done = 0;
          int lastPct = -1;
          int n;
          while ((n = in.read(buf)) > 0) {
            out.write(buf, 0, n);
            done += n;
            if (total > 0) {
              int pct = (int) (done * 100 / total);
              if (pct != lastPct) {
                lastPct = pct;
                JSObject p = new JSObject();
                p.put("percent", pct);
                notifyListeners("progress", p);
              }
            }
          }
        }
        Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
      } catch (Exception e) {
        call.reject("Pobieranie nie powiodło się: " + e.getMessage());
      }
    }).start();
  }
}
