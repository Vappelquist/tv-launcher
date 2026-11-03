package com.vilgot.tvlauncher

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.util.Base64
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

/** Packages whose media sessions count as "Spotify". Check yours with `pm list packages`. */
val SPOTIFY_PACKAGES = setOf("com.spotify.tv.android", "com.spotify.music")

/** Index of the first Spotify session in [packages], or null when there is none. */
fun pickSpotifySession(packages: List<String>): Int? =
    packages.indexOfFirst { it in SPOTIFY_PACKAGES }.takeIf { it >= 0 }

data class NowPlaying(
    val playing: Boolean,
    val title: String,
    val artist: String,
    val artJpegBase64: String?,
)

private val IDLE = NowPlaying(playing = false, title = "", artist = "", artJpegBase64 = null)
private const val MAX_ART_PX = 640

/**
 * Watches Spotify's media session on this box and reports title / artist / album art.
 * Needs the notification-listener grant for [MediaListener]; without it, reports idle.
 * Call start/stop from the main thread (the media APIs call back there).
 */
class NowPlayingMonitor(
    private val context: Context,
    private val onChange: (NowPlaying) -> Unit,
) {
    private val manager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
    private val listener = ComponentName(context, MediaListener::class.java)

    private var controller: MediaController? = null
    private var started = false

    private var lastBitmap: Bitmap? = null
    private var lastEncoded: String? = null

    private val controllerCallback = object : MediaController.Callback() {
        override fun onMetadataChanged(metadata: MediaMetadata?) = refresh()
        override fun onPlaybackStateChanged(state: PlaybackState?) = refresh()
        override fun onSessionDestroyed() = select(emptyList())
    }

    private val sessionsListener =
        MediaSessionManager.OnActiveSessionsChangedListener { list -> select(list.orEmpty()) }

    fun start() {
        if (started) return
        try {
            manager.addOnActiveSessionsChangedListener(sessionsListener, listener)
            started = true
            select(manager.getActiveSessions(listener))
        } catch (e: SecurityException) {
            // Notification-listener access not granted: the launcher works, just without music.
            onChange(IDLE)
        }
    }

    fun stop() {
        if (started) {
            try {
                manager.removeOnActiveSessionsChangedListener(sessionsListener)
            } catch (e: SecurityException) {
                // nothing to clean up
            }
            started = false
        }
        controller?.unregisterCallback(controllerCallback)
        controller = null
    }

    /** Re-emit the current state (used when the page has just loaded). */
    fun refresh() {
        val c = controller
        if (c == null) {
            onChange(IDLE)
            return
        }
        val state = c.playbackState?.state
        val playing = state == PlaybackState.STATE_PLAYING || state == PlaybackState.STATE_BUFFERING
        if (!playing) {
            onChange(IDLE)
            return
        }
        val md = c.metadata
        val bitmap = md?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
            ?: md?.getBitmap(MediaMetadata.METADATA_KEY_ART)
        onChange(
            NowPlaying(
                playing = true,
                title = md?.getString(MediaMetadata.METADATA_KEY_TITLE).orEmpty(),
                artist = (md?.getString(MediaMetadata.METADATA_KEY_ARTIST)
                    ?: md?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)).orEmpty(),
                artJpegBase64 = bitmap?.let { encode(it) },
            ),
        )
    }

    private fun select(sessions: List<MediaController>) {
        val index = pickSpotifySession(sessions.map { it.packageName })
        val next = index?.let { sessions[it] }
        if (next?.sessionToken != controller?.sessionToken) {
            controller?.unregisterCallback(controllerCallback)
            controller = next
            next?.registerCallback(controllerCallback)
        }
        refresh()
    }

    /** Downscale to at most MAX_ART_PX on the long edge, JPEG, base64 without line breaks. */
    private fun encode(src: Bitmap): String {
        if (src === lastBitmap && lastEncoded != null) return lastEncoded!!
        val longEdge = max(src.width, src.height)
        val scaled = if (longEdge > MAX_ART_PX) {
            val f = MAX_ART_PX.toFloat() / longEdge
            Bitmap.createScaledBitmap(
                src,
                (src.width * f).roundToInt().coerceAtLeast(1),
                (src.height * f).roundToInt().coerceAtLeast(1),
                true,
            )
        } else {
            src
        }
        val encoded = ByteArrayOutputStream().use { out ->
            scaled.compress(Bitmap.CompressFormat.JPEG, 85, out)
            Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        }
        if (scaled !== src) scaled.recycle()
        lastBitmap = src
        lastEncoded = encoded
        return encoded
    }
}
