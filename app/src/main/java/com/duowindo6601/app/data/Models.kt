package com.duowindo6601.app.data

/** All screens of the app. Navigation is handled by [com.duowindo6601.app.vm.GameViewModel]. */
enum class Screen {
    SPLASH, ONBOARDING, LEARN, LEADERBOARD, SHOP, PROFILE, SETTINGS, LESSON
}

/** One vocabulary pair: English source word -> word in the course language. */
data class Vocab(val source: String, val target: String)

/** One sentence pair used by the "build the sentence" exercise. */
data class SentenceData(val source: String, val target: String)

data class LessonData(
    val id: String,
    val title: String,
    val vocab: List<Vocab>,
    val sentences: List<SentenceData>
)

data class UnitData(
    val id: String,
    val title: String,
    val lessons: List<LessonData>
)

data class Course(
    val id: String,
    val name: String,
    val localName: String,
    val flag: String,
    /** BCP-47 tag used by the on-device text-to-speech engine. */
    val ttsLocale: String,
    val units: List<UnitData>
) {
    /** All lessons of the course in learning order. */
    val lessons: List<LessonData> get() = units.flatMap { it.lessons }
}

/**
 * Everything the user has achieved, stored locally on the phone
 * (SharedPreferences + JSON). Never leaves the device.
 */
data class UserProgress(
    val onboarded: Boolean = false,
    val name: String = "",
    val courseId: String = "es",
    val xp: Int = 0,
    val gems: Int = 0,
    val hearts: Int = 5,
    /** Timestamp used for the offline heart-refill timer. */
    val lastHeartAt: Long = 0L,
    val streak: Int = 0,
    /** Last day with a finished lesson, "yyyy-MM-dd". */
    val lastActiveDay: String = "",
    /** Streak freezes owned (bought in the shop). */
    val freezes: Int = 0,
    /** Double-XP boost for the next lesson. */
    val doubleXpNext: Boolean = false,
    val soundOn: Boolean = true,
    val completedLessons: Set<String> = emptySet(),
    val learnedWords: Set<String> = emptySet(),
    val totalLessons: Int = 0,
    val perfectLessons: Int = 0,
    val gemsEarned: Int = 0
) {
    val level: Int get() = xp / XP_PER_LEVEL + 1
    val xpInLevel: Int get() = xp % XP_PER_LEVEL

    /** Number of different courses the user has finished lessons in. */
    val coursesExplored: Int
        get() = completedLessons.map { it.substringBefore('-') }.distinct().size

    companion object {
        const val XP_PER_LEVEL = 60
        const val MAX_HEARTS = 5
    }
}

data class Achievement(
    val emoji: String,
    val title: String,
    val description: String,
    val unlocked: Boolean
)

fun buildAchievements(p: UserProgress): List<Achievement> = listOf(
    Achievement("👟", "First Steps", "Complete your first lesson", p.totalLessons >= 1),
    Achievement("✨", "Perfectionist", "Finish a lesson with no mistakes", p.perfectLessons >= 1),
    Achievement("🔥", "On Fire", "Reach a 3-day streak", p.streak >= 3),
    Achievement("🏆", "Champion", "Reach a 7-day streak", p.streak >= 7),
    Achievement("📚", "Bookworm", "Learn 25 words", p.learnedWords.size >= 25),
    Achievement("💎", "Gem Collector", "Earn 100 gems in total", p.gemsEarned >= 100),
    Achievement("🌍", "Explorer", "Complete lessons in 2 different courses", p.coursesExplored >= 2),
    Achievement("🎓", "Scholar", "Complete 10 lessons", p.totalLessons >= 10)
)
