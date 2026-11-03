package com.vilgot.tvlauncher

import org.junit.Assert.assertEquals
import org.junit.Test

class AppListingTest {

    private val own = "com.vilgot.tvlauncher"

    private fun app(pkg: String, label: String = pkg) = AppEntry(pkg, label)
    private fun pkgs(list: List<AppEntry>) = list.map { it.pkg }

    @Test
    fun fallsBackToLauncherAppsWhenOnlyOurselvesAreLeanback() {
        // Our own activity declares LEANBACK_LAUNCHER, so the leanback query is never empty.
        val result = buildAppList(
            leanback = listOf(app(own)),
            launcher = listOf(app("org.example.a", "A"), app("org.example.b", "B")),
            ownPkg = own,
            stockAvailable = false,
        )
        assertEquals(listOf("org.example.a", "org.example.b", SETTINGS_PKG), pkgs(result))
    }

    @Test
    fun prefersLeanbackAppsOverLauncherApps() {
        val result = buildAppList(
            leanback = listOf(app(own), app("tv.app", "TV")),
            launcher = listOf(app("phone.app", "Phone")),
            ownPkg = own,
            stockAvailable = false,
        )
        assertEquals(listOf("tv.app", SETTINGS_PKG), pkgs(result))
    }

    @Test
    fun removesOwnAndStockLauncherDedupesAndSortsIgnoringCase() {
        val result = buildAppList(
            leanback = listOf(
                app("b.app", "banana"), app(own), app(STOCK_LAUNCHER, "Stock"),
                app("a.app", "Apple"), app("a.app", "Apple"),
            ),
            launcher = emptyList(),
            ownPkg = own,
            stockAvailable = false,
        )
        assertEquals(listOf("a.app", "b.app", SETTINGS_PKG), pkgs(result))
    }

    @Test
    fun addsSettingsTileOnlyWhenTheSystemListLacksIt() {
        val without = buildAppList(listOf(app("x", "X")), emptyList(), own, false)
        assertEquals(1, without.count { it.pkg == SETTINGS_PKG })

        val with = buildAppList(listOf(app(SETTINGS_PKG, "Settings")), emptyList(), own, false)
        assertEquals(1, with.count { it.pkg == SETTINGS_PKG })
    }

    @Test
    fun appendsStockLauncherTileLastOnlyWhenAvailable() {
        val available = buildAppList(listOf(app("x", "X")), emptyList(), own, true)
        assertEquals(STOCK_LAUNCHER, available.last().pkg)

        val unavailable = buildAppList(listOf(app("x", "X")), emptyList(), own, false)
        assertEquals(0, unavailable.count { it.pkg == STOCK_LAUNCHER })
    }

    @Test
    fun emptyInputsStillOfferSettings() {
        val result = buildAppList(emptyList(), emptyList(), own, false)
        assertEquals(listOf(SETTINGS_PKG), pkgs(result))
    }
}
