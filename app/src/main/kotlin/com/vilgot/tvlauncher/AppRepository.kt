package com.vilgot.tvlauncher

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import java.io.ByteArrayOutputStream

data class AppEntry(val pkg: String, val label: String)

class AppRepository(private val context: Context) {

    private val pm: PackageManager = context.packageManager

    /** Leanback apps first; plain launcher apps only when there are no leanback apps. */
    fun launchableApps(): List<AppEntry> {
        val leanback = query(Intent.CATEGORY_LEANBACK_LAUNCHER)
        val source = leanback.ifEmpty { query(Intent.CATEGORY_LAUNCHER) }
        return source
            .filter { it.pkg != context.packageName && it.pkg != STOCK_LAUNCHER }
            .distinctBy { it.pkg }
            .sortedBy { it.label.lowercase() }
    }

    fun isStockLauncherAvailable(): Boolean = try {
        pm.getApplicationInfo(STOCK_LAUNCHER, 0).enabled
    } catch (e: PackageManager.NameNotFoundException) {
        false
    }

    fun launchIntent(pkg: String): Intent? {
        if (pkg == STOCK_LAUNCHER) {
            // Explicitly start the stock home screen, even though we are the default Home.
            return Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_HOME)
                .setPackage(STOCK_LAUNCHER)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val intent = pm.getLeanbackLaunchIntentForPackage(pkg) ?: pm.getLaunchIntentForPackage(pkg)
        return intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    /** PNG bytes of the app icon, or null when the package is unknown. */
    fun iconPng(pkg: String): ByteArray? = try {
        val d = pm.getApplicationIcon(pkg)
        val w = d.intrinsicWidth.takeIf { it > 0 } ?: ICON_PX
        val h = d.intrinsicHeight.takeIf { it > 0 } ?: ICON_PX
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        d.setBounds(0, 0, w, h)
        d.draw(Canvas(bmp))
        ByteArrayOutputStream().use { out ->
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.toByteArray()
        }
    } catch (e: PackageManager.NameNotFoundException) {
        null
    }

    private fun query(category: String): List<AppEntry> {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(category)
        return pm.queryIntentActivities(intent, 0).map {
            AppEntry(it.activityInfo.packageName, it.loadLabel(pm).toString())
        }
    }

    companion object {
        const val STOCK_LAUNCHER = "com.google.android.apps.tv.launcherx"
        private const val ICON_PX = 192
    }
}
