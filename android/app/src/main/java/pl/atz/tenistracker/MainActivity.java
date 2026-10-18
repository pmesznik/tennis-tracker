package pl.atz.tenistracker;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
      @Override
      public void handleOnBackPressed() {
        getBridge().getWebView().evaluateJavascript(
            "(function(){try{return window.appBack?window.appBack()===true:false}catch(e){return false}})()",
            v -> {
              if (!"true".equals(v)) {
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
              }
            });
      }
    });
  }
}
