package pl.atz.tenistracker;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Kopia zapasowa w chmurze przez systemowy wybór folderu (Storage Access
 * Framework): użytkownik raz wskazuje folder w Dysku Google, Dropboksie,
 * OneDrive itp. (aplikacje chmur zainstalowane na telefonie udostępniają swoje
 * foldery systemowemu wyborowi), a aplikacja zapisuje tam dwa pliki: najnowszy
 * i poprzedni. Bez logowania w aplikacji i bez kluczy API.
 */
@CapacitorPlugin(name = "CloudBackup")
public class CloudBackupPlugin extends Plugin {

  @PluginMethod
  public void pickFolder(PluginCall call) {
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
    intent.addFlags(
        Intent.FLAG_GRANT_READ_URI_PERMISSION
            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
    startActivityForResult(call, intent, "pickFolderResult");
  }

  @ActivityCallback
  private void pickFolderResult(PluginCall call, ActivityResult result) {
    if (call == null) return;
    if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
      JSObject ret = new JSObject();
      ret.put("cancelled", true);
      call.resolve(ret);
      return;
    }
    Uri uri = result.getData().getData();
    try {
      getContext()
          .getContentResolver()
          .takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
      DocumentFile dir = DocumentFile.fromTreeUri(getContext(), uri);
      JSObject ret = new JSObject();
      ret.put("uri", uri.toString());
      ret.put("name", dir != null && dir.getName() != null ? dir.getName() : "");
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Nie można zapamiętać folderu: " + e.getMessage());
    }
  }

  /**
   * Zapisuje kopię: dotychczasowy plik "newest" trafia do "previous" (nadpisując
   * go), a nowa treść do "newest". Zostają zawsze dwa pliki.
   */
  @PluginMethod
  public void write(final PluginCall call) {
    final String uriStr = call.getString("uri");
    final String newest = call.getString("newest");
    final String previous = call.getString("previous");
    final String content = call.getString("content");
    if (uriStr == null || newest == null || previous == null || content == null) {
      call.reject("Brak danych do zapisu");
      return;
    }
    new Thread(() -> {
      try {
        Context ctx = getContext();
        ContentResolver cr = ctx.getContentResolver();
        DocumentFile dir = DocumentFile.fromTreeUri(ctx, Uri.parse(uriStr));
        if (dir == null || !dir.exists() || !dir.canWrite()) {
          call.reject("folder-unavailable");
          return;
        }
        DocumentFile cur = dir.findFile(newest);
        if (cur != null && cur.isFile() && cur.length() > 0) {
          byte[] old = readAll(cr, cur.getUri());
          DocumentFile prev = dir.findFile(previous);
          if (prev == null) prev = dir.createFile("application/json", previous);
          if (prev == null) {
            call.reject("create-failed");
            return;
          }
          writeAll(cr, prev.getUri(), old);
        }
        if (cur == null) cur = dir.createFile("application/json", newest);
        if (cur == null) {
          call.reject("create-failed");
          return;
        }
        writeAll(cr, cur.getUri(), content.getBytes(StandardCharsets.UTF_8));
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
      } catch (Exception e) {
        call.reject("write-failed: " + e.getMessage());
      }
    }).start();
  }

  /** Sprawdza, czy zapamiętany folder nadal jest dostępny do zapisu. */
  @PluginMethod
  public void check(PluginCall call) {
    String uriStr = call.getString("uri");
    JSObject ret = new JSObject();
    boolean ok = false;
    try {
      if (uriStr != null) {
        DocumentFile dir = DocumentFile.fromTreeUri(getContext(), Uri.parse(uriStr));
        ok = dir != null && dir.exists() && dir.canWrite();
      }
    } catch (Exception ignored) {
    }
    ret.put("ok", ok);
    call.resolve(ret);
  }

  private static byte[] readAll(ContentResolver cr, Uri uri) throws Exception {
    try (InputStream in = cr.openInputStream(uri); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      if (in == null) throw new Exception("open-failed");
      byte[] buf = new byte[32 * 1024];
      int n;
      while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
      return out.toByteArray();
    }
  }

  private static void writeAll(ContentResolver cr, Uri uri, byte[] data) throws Exception {
    try (OutputStream out = cr.openOutputStream(uri, "wt")) {
      if (out == null) throw new Exception("open-failed");
      out.write(data);
      out.flush();
    }
  }
}
