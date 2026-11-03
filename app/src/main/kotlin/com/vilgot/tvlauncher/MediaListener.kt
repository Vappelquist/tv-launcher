package com.vilgot.tvlauncher

import android.service.notification.NotificationListenerService

/**
 * Intentionally empty. Android only lets an app read other apps' media sessions when it
 * owns an enabled notification listener, so this service exists purely as that anchor.
 * Enable it with:
 *   adb shell cmd notification allow_listener com.vilgot.tvlauncher/com.vilgot.tvlauncher.MediaListener
 */
class MediaListener : NotificationListenerService()
