package com.vilgot.tvlauncher

const val STOCK_LAUNCHER = "com.google.android.apps.tv.launcherx"
const val SETTINGS_PKG = "com.android.tv.settings"

data class AppEntry(val pkg: String, val label: String)

/**
 * The list shown in the app grid. Pure so it can be unit-tested.
 *
 * - Our own package and the stock launcher are removed from the system results first.
 *   Our own activity declares LEANBACK_LAUNCHER, so the leanback result is never empty
 *   until we filter ourselves out; only then does the plain-launcher fallback make sense.
 * - Leanback apps are preferred; plain launcher apps are used only when none remain.
 * - Sorted by label (case-insensitive), de-duplicated by package.
 * - A Settings tile is added when the system list lacks one (TV settings often has no
 *   leanback entry); the stock launcher tile is appended last when it is available.
 */
fun buildAppList(
    leanback: List<AppEntry>,
    launcher: List<AppEntry>,
    ownPkg: String,
    stockAvailable: Boolean,
): List<AppEntry> {
    fun clean(list: List<AppEntry>) = list.filter { it.pkg != ownPkg && it.pkg != STOCK_LAUNCHER }

    val apps = clean(leanback)
        .ifEmpty { clean(launcher) }
        .distinctBy { it.pkg }
        .sortedBy { it.label.lowercase() }
        .toMutableList()

    if (apps.none { it.pkg == SETTINGS_PKG }) apps += AppEntry(SETTINGS_PKG, "Settings")
    if (stockAvailable) apps += AppEntry(STOCK_LAUNCHER, "Stock launcher")
    return apps
}
