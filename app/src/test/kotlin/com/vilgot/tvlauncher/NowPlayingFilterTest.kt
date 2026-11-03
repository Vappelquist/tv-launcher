package com.vilgot.tvlauncher

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NowPlayingFilterTest {

    @Test
    fun picksTheSpotifyTvSessionByIndex() {
        val sessions = listOf("com.android.chrome", "com.spotify.tv.android")
        assertEquals(1, pickSpotifySession(sessions))
    }

    @Test
    fun picksTheFirstSpotifySessionWhenSeveralExist() {
        val sessions = listOf("com.spotify.music", "com.spotify.tv.android")
        assertEquals(0, pickSpotifySession(sessions))
    }

    @Test
    fun returnsNullWhenNoSpotifySessionIsActive() {
        assertNull(pickSpotifySession(listOf("com.android.chrome", "org.videolan.vlc")))
    }

    @Test
    fun returnsNullForAnEmptyList() {
        assertNull(pickSpotifySession(emptyList()))
    }
}
