package com.vilgot.tvlauncher

import android.app.Activity
import android.content.ActivityNotFoundException
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/** Exposed to the page as `window.Android`. Keep this surface small. */
class Bridge(
    private val activity: Activity,
    private val repo: AppRepository,
    private val onNowPlayingReady: () -> Unit,
) {
    /** The page calls this once it can receive window.onNowPlaying, so it gets the current state. */
    @JavascriptInterface
    fun nowPlayingReady() {
        activity.runOnUiThread(onNowPlayingReady)
    }

    /** JSON array of {pkg,label}; the stock launcher tile is appended when it exists. */
    @JavascriptInterface
    fun getApps(): String {
        val entries = repo.launchableApps().toMutableList()
        if (repo.isStockLauncherAvailable()) {
            entries += AppEntry(AppRepository.STOCK_LAUNCHER, "Stock launcher")
        }
        val arr = JSONArray()
        for (e in entries) {
            arr.put(JSONObject().put("pkg", e.pkg).put("label", e.label))
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun launch(pkg: String) {
        activity.runOnUiThread {
            val intent = repo.launchIntent(pkg) ?: return@runOnUiThread
            try {
                activity.startActivity(intent)
            } catch (e: ActivityNotFoundException) {
                // App was removed or disabled since the list was built; list refreshes on resume.
            }
        }
    }
}
