package com.vilgot.tvlauncher

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.ByteArrayInputStream

class MainActivity : Activity() {

    private lateinit var web: WebView
    private lateinit var repo: AppRepository
    private lateinit var nowPlaying: NowPlayingMonitor

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repo = AppRepository(this)
        nowPlaying = NowPlayingMonitor(this) { np -> pushNowPlaying(np) }

        // Serves assets/ over https://appassets.androidplatform.net so ES modules work.
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            setBackgroundColor(Color.BLACK)
            addJavascriptInterface(
                Bridge(this@MainActivity, repo) { nowPlaying.refresh() },
                "Android",
            )
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ): WebResourceResponse? {
                    val url = request.url
                    if (url.host == HOST && url.path?.startsWith("/app-icon/") == true) {
                        return iconResponse(url.lastPathSegment)
                    }
                    return assetLoader.shouldInterceptRequest(url)
                }

                // The bridge is only for our own bundled page: never navigate away from it.
                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest,
                ): Boolean = request.url.host != HOST
            }
        }
        setContentView(web)
        web.loadUrl(START_URL)
    }

    private fun iconResponse(pkg: String?): WebResourceResponse {
        val png = pkg?.let { repo.iconPng(it) }
        return if (png != null) {
            WebResourceResponse("image/png", null, ByteArrayInputStream(png))
        } else {
            WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), ByteArrayInputStream(ByteArray(0)))
        }
    }

    private fun pushNowPlaying(np: NowPlaying) {
        val json = JSONObject()
            .put("playing", np.playing)
            .put("title", np.title)
            .put("artist", np.artist)
            .put("artUrl", np.artJpegBase64?.let { "data:image/jpeg;base64,$it" } ?: JSONObject.NULL)
        web.evaluateJavascript("window.onNowPlaying && window.onNowPlaying($json)", null)
    }

    override fun onPause() {
        nowPlaying.stop()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        nowPlaying.start()
        // Newly installed / removed apps show up when we come back to the foreground.
        web.evaluateJavascript("window.refreshApps && window.refreshApps()", null)
    }

    // The launcher is Home: Back must never leave it.
    @Deprecated("Back is intentionally swallowed")
    override fun onBackPressed() = Unit

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
        }
    }

    companion object {
        const val HOST = "appassets.androidplatform.net"
        const val START_URL = "https://$HOST/assets/www/index.html"
    }
}
