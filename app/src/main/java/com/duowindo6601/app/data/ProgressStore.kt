package com.duowindo6601.app.data

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Simple, dependency-free local persistence.
 *
 * All user data is stored as one JSON object inside SharedPreferences on the
 * phone. Nothing ever leaves the device — the app has no INTERNET permission.
 */
class ProgressStore(context: Context) {

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun load(): UserProgress {
        val raw = prefs.getString(KEY_PROGRESS, null) ?: return UserProgress()
        return try {
            parse(JSONObject(raw))
        } catch (e: Exception) {
            // Corrupted data should never crash the app: start fresh.
            UserProgress()
        }
    }

    fun save(p: UserProgress) {
        prefs.edit().putString(KEY_PROGRESS, toJson(p).toString()).apply()
    }

    fun reset() {
        prefs.edit().remove(KEY_PROGRESS).apply()
    }

    private fun parse(json: JSONObject): UserProgress = UserProgress(
        onboarded = json.optBoolean("onboarded", false),
        name = json.optString("name", ""),
        courseId = json.optString("courseId", "es"),
        xp = json.optInt("xp", 0),
        gems = json.optInt("gems", 0),
        hearts = json.optInt("hearts", UserProgress.MAX_HEARTS),
        lastHeartAt = json.optLong("lastHeartAt", 0L),
        streak = json.optInt("streak", 0),
        lastActiveDay = json.optString("lastActiveDay", ""),
        freezes = json.optInt("freezes", 0),
        doubleXpNext = json.optBoolean("doubleXpNext", false),
        soundOn = json.optBoolean("soundOn", true),
        completedLessons = json.optJSONArray("completedLessons").toStringSet(),
        learnedWords = json.optJSONArray("learnedWords").toStringSet(),
        totalLessons = json.optInt("totalLessons", 0),
        perfectLessons = json.optInt("perfectLessons", 0),
        gemsEarned = json.optInt("gemsEarned", 0)
    )

    private fun toJson(p: UserProgress): JSONObject = JSONObject().apply {
        put("onboarded", p.onboarded)
        put("name", p.name)
        put("courseId", p.courseId)
        put("xp", p.xp)
        put("gems", p.gems)
        put("hearts", p.hearts)
        put("lastHeartAt", p.lastHeartAt)
        put("streak", p.streak)
        put("lastActiveDay", p.lastActiveDay)
        put("freezes", p.freezes)
        put("doubleXpNext", p.doubleXpNext)
        put("soundOn", p.soundOn)
        put("completedLessons", JSONArray(p.completedLessons.sorted()))
        put("learnedWords", JSONArray(p.learnedWords.sorted()))
        put("totalLessons", p.totalLessons)
        put("perfectLessons", p.perfectLessons)
        put("gemsEarned", p.gemsEarned)
    }

    private fun JSONArray?.toStringSet(): Set<String> {
        if (this == null) return emptySet()
        val out = LinkedHashSet<String>()
        for (i in 0 until length()) {
            out.add(optString(i))
        }
        return out
    }

    companion object {
        private const val PREFS_NAME = "duowindo6601_progress"
        private const val KEY_PROGRESS = "progress_json"
    }
}
