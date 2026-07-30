package com.duowindo6601.app.vm

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.duowindo6601.app.data.Courses
import com.duowindo6601.app.data.Exercise
import com.duowindo6601.app.data.ExerciseFactory
import com.duowindo6601.app.data.ProgressStore
import com.duowindo6601.app.data.Screen
import com.duowindo6601.app.data.UserProgress
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

enum class Feedback { CORRECT, WRONG }

enum class ShopItem(val price: Int) {
    HEARTS_REFILL(100),
    STREAK_FREEZE(50),
    DOUBLE_XP(30)
}

enum class ShopResult { BOUGHT, NOT_ENOUGH_GEMS, NOT_NEEDED }

/** State of the lesson currently being played. */
data class LessonSession(
    val courseId: String,
    val lessonId: String,
    val title: String,
    val exercises: List<Exercise>,
    val index: Int = 0,
    val mistakes: Int = 0,
    val selected: String? = null,
    val placed: List<String> = emptyList(),
    val bank: List<String> = emptyList(),
    val feedback: Feedback? = null,
    val correctAnswer: String? = null,
    val finished: Boolean = false,
    val wasPerfect: Boolean = false,
    val wasRepeat: Boolean = false,
    val xpEarned: Int = 0,
    val gemsEarned: Int = 0
) {
    val current: Exercise get() = exercises[index]

    val progressFraction: Float
        get() = (index + if (feedback != null) 1 else 0).toFloat() / exercises.size.coerceAtLeast(1)

    val canCheck: Boolean
        get() = when (current) {
            is Exercise.PickTarget -> selected != null
            is Exercise.PickSource -> selected != null
            is Exercise.BuildSentence -> placed.isNotEmpty()
        }
}

/**
 * Single ViewModel holding all app state for the single-activity app.
 * Every mutation is persisted immediately via [ProgressStore], so progress
 * survives closing and reopening the app.
 */
class GameViewModel(app: Application) : AndroidViewModel(app) {

    companion object {
        const val HEART_REFILL_MS = 45L * 60L * 1000L // 1 heart every 45 minutes
        const val BASE_XP = 10
        const val PERFECT_XP_BONUS = 5
        const val LESSON_GEMS = 5
        const val PERFECT_GEMS_BONUS = 5
    }

    private val store = ProgressStore(app)

    private val _screen = MutableStateFlow(Screen.SPLASH)
    val screen: StateFlow<Screen> = _screen.asStateFlow()

    private val _progress = MutableStateFlow(store.load())
    val progress: StateFlow<UserProgress> = _progress.asStateFlow()

    private val _session = MutableStateFlow<LessonSession?>(null)
    val session: StateFlow<LessonSession?> = _session.asStateFlow()

    private val dayFormatUtc = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    init {
        refillHearts()
    }

    // ---------------------------------------------------------------------
    // Navigation
    // ---------------------------------------------------------------------

    fun onSplashDone() {
        _screen.value = if (_progress.value.onboarded) Screen.LEARN else Screen.ONBOARDING
    }

    fun navigate(to: Screen) {
        if (to == Screen.LEARN) refillHearts()
        if (to != Screen.LESSON) _session.value = null
        _screen.value = to
    }

    /** Handles the system back button. Returns true when handled. */
    fun onBack(): Boolean = when (_screen.value) {
        Screen.SETTINGS -> {
            _screen.value = Screen.PROFILE
            true
        }
        Screen.LEADERBOARD, Screen.SHOP, Screen.PROFILE -> {
            _screen.value = Screen.LEARN
            true
        }
        else -> false
    }

    // ---------------------------------------------------------------------
    // Progress updates (always persisted)
    // ---------------------------------------------------------------------

    private fun update(transform: (UserProgress) -> UserProgress) {
        val next = transform(_progress.value)
        store.save(next)
        _progress.value = next
    }

    fun completeOnboarding(courseId: String, name: String) {
        update {
            it.copy(
                onboarded = true,
                courseId = courseId,
                name = name.trim().ifBlank { "Learner" }
            )
        }
        _screen.value = Screen.LEARN
    }

    fun selectCourse(courseId: String) = update { it.copy(courseId = courseId) }

    fun setSound(on: Boolean) = update { it.copy(soundOn = on) }

    fun rename(newName: String) {
        val trimmed = newName.trim()
        if (trimmed.isNotEmpty()) update { it.copy(name = trimmed) }
    }

    fun resetProgress() {
        store.reset()
        _session.value = null
        _progress.value = store.load()
        _screen.value = Screen.ONBOARDING
    }

    // ---------------------------------------------------------------------
    // Hearts (offline refill timer, no server required)
    // ---------------------------------------------------------------------

    fun refillHearts() {
        val p = _progress.value
        val now = System.currentTimeMillis()
        if (p.hearts >= UserProgress.MAX_HEARTS) {
            if (p.lastHeartAt != 0L) update { it.copy(lastHeartAt = 0L) }
            return
        }
        var hearts = p.hearts
        var anchor = if (p.lastHeartAt == 0L) now else p.lastHeartAt
        while (hearts < UserProgress.MAX_HEARTS && now - anchor >= HEART_REFILL_MS) {
            hearts++
            anchor += HEART_REFILL_MS
        }
        if (hearts != p.hearts || anchor != p.lastHeartAt) {
            update {
                it.copy(
                    hearts = hearts,
                    lastHeartAt = if (hearts >= UserProgress.MAX_HEARTS) 0L else anchor
                )
            }
        }
    }

    private fun loseHeart() {
        update {
            val now = System.currentTimeMillis()
            it.copy(
                hearts = (it.hearts - 1).coerceAtLeast(0),
                lastHeartAt = if (it.lastHeartAt == 0L) now else it.lastHeartAt
            )
        }
    }

    // ---------------------------------------------------------------------
    // Lesson flow
    // ---------------------------------------------------------------------

    fun isLessonUnlocked(course: com.duowindo6601.app.data.Course, lessonId: String): Boolean {
        val order = course.lessons
        val idx = order.indexOfFirst { it.id == lessonId }
        if (idx <= 0) return idx == 0
        val done = _progress.value.completedLessons
        return order.take(idx).all { done.contains(it.id) }
    }

    /** Returns false when the user has no hearts left. */
    fun startLesson(courseId: String, lessonId: String): Boolean {
        refillHearts()
        if (_progress.value.hearts <= 0) return false
        val course = Courses.byId(courseId)
        val lesson = course.lessons.firstOrNull { it.id == lessonId } ?: return false
        val exercises = ExerciseFactory.build(course, lesson)
        if (exercises.isEmpty()) return false
        _session.value = LessonSession(
            courseId = course.id,
            lessonId = lesson.id,
            title = lesson.title,
            exercises = exercises,
            bank = (exercises.first() as? Exercise.BuildSentence)?.bank ?: emptyList(),
            wasRepeat = _progress.value.completedLessons.contains(lesson.id)
        )
        _screen.value = Screen.LESSON
        return true
    }

    fun selectOption(option: String) {
        val s = _session.value ?: return
        if (s.feedback != null || s.finished) return
        _session.value = s.copy(selected = option)
    }

    fun tapBankToken(index: Int) {
        val s = _session.value ?: return
        if (s.feedback != null || s.finished || index !in s.bank.indices) return
        val token = s.bank[index]
        _session.value = s.copy(
            bank = s.bank.filterIndexed { i, _ -> i != index },
            placed = s.placed + token
        )
    }

    fun tapPlacedToken(index: Int) {
        val s = _session.value ?: return
        if (s.feedback != null || s.finished || index !in s.placed.indices) return
        val token = s.placed[index]
        _session.value = s.copy(
            placed = s.placed.filterIndexed { i, _ -> i != index },
            bank = s.bank + token
        )
    }

    /** Checks the current answer. Returns true when correct, null when not allowed. */
    fun checkAnswer(): Boolean? {
        val s = _session.value ?: return null
        if (s.feedback != null || s.finished || !s.canCheck) return null

        val correct: Boolean
        val answer: String
        when (val e = s.current) {
            is Exercise.PickTarget -> {
                correct = s.selected == e.vocab.target
                answer = e.vocab.target
            }
            is Exercise.PickSource -> {
                correct = s.selected == e.vocab.source
                answer = e.vocab.source
            }
            is Exercise.BuildSentence -> {
                correct = s.placed.joinToString(" ") == e.sentence.target
                answer = e.sentence.target
            }
        }

        if (!correct) loseHeart()
        _session.value = s.copy(
            feedback = if (correct) Feedback.CORRECT else Feedback.WRONG,
            mistakes = if (correct) s.mistakes else s.mistakes + 1,
            correctAnswer = answer
        )
        return correct
    }

    fun continueAfterFeedback() {
        val s = _session.value ?: return
        if (s.feedback == null || s.finished) return
        if (s.index + 1 >= s.exercises.size) {
            finishLesson(s)
        } else {
            val next = s.exercises[s.index + 1]
            _session.value = s.copy(
                index = s.index + 1,
                selected = null,
                placed = emptyList(),
                bank = (next as? Exercise.BuildSentence)?.bank ?: emptyList(),
                feedback = null,
                correctAnswer = null
            )
        }
    }

    fun quitLesson() {
        _session.value = null
        _screen.value = Screen.LEARN
    }

    private fun finishLesson(s: LessonSession) {
        val perfect = s.mistakes == 0
        var xp = BASE_XP + if (perfect) PERFECT_XP_BONUS else 0
        if (_progress.value.doubleXpNext) xp *= 2
        val gems = LESSON_GEMS + if (perfect) PERFECT_GEMS_BONUS else 0

        val course = Courses.byId(s.courseId)
        val lesson = course.lessons.firstOrNull { it.id == s.lessonId }
        val newWords = lesson?.vocab?.map { it.target } ?: emptyList()
        val today = todayString()

        update {
            var next = it.copy(
                xp = it.xp + xp,
                gems = it.gems + gems,
                gemsEarned = it.gemsEarned + gems,
                completedLessons = it.completedLessons + s.lessonId,
                learnedWords = it.learnedWords + newWords,
                totalLessons = it.totalLessons + 1,
                perfectLessons = it.perfectLessons + if (perfect) 1 else 0,
                doubleXpNext = false
            )
            // Streak bookkeeping.
            if (next.lastActiveDay != today) {
                val gap = if (next.lastActiveDay.isEmpty()) -1 else daysBetween(next.lastActiveDay, today)
                next = when {
                    gap == -1 -> next.copy(streak = maxOf(1, next.streak), lastActiveDay = today)
                    gap == 1 -> next.copy(streak = next.streak + 1, lastActiveDay = today)
                    gap == 2 && next.freezes > 0 -> next.copy(
                        streak = next.streak + 1,
                        lastActiveDay = today,
                        freezes = next.freezes - 1
                    )
                    else -> next.copy(streak = 1, lastActiveDay = today)
                }
            }
            next
        }

        _session.value = s.copy(
            finished = true,
            wasPerfect = perfect,
            xpEarned = xp,
            gemsEarned = gems
        )
    }

    // ---------------------------------------------------------------------
    // Shop
    // ---------------------------------------------------------------------

    fun buy(item: ShopItem): ShopResult {
        refillHearts()
        val p = _progress.value
        if (item == ShopItem.HEARTS_REFILL && p.hearts >= UserProgress.MAX_HEARTS) {
            return ShopResult.NOT_NEEDED
        }
        if (p.gems < item.price) return ShopResult.NOT_ENOUGH_GEMS
        update {
            when (item) {
                ShopItem.HEARTS_REFILL -> it.copy(
                    gems = it.gems - item.price,
                    hearts = UserProgress.MAX_HEARTS,
                    lastHeartAt = 0L
                )
                ShopItem.STREAK_FREEZE -> it.copy(
                    gems = it.gems - item.price,
                    freezes = it.freezes + 1
                )
                ShopItem.DOUBLE_XP -> it.copy(
                    gems = it.gems - item.price,
                    doubleXpNext = true
                )
            }
        }
        return ShopResult.BOUGHT
    }

    // ---------------------------------------------------------------------
    // Date helpers (device-local, no network)
    // ---------------------------------------------------------------------

    private fun todayString(): String = dayFormatUtc.format(Date())

    private fun daysBetween(fromDay: String, toDay: String): Int {
        return try {
            val from = dayFormatUtc.parse(fromDay)?.time ?: return -1
            val to = dayFormatUtc.parse(toDay)?.time ?: return -1
            ((to - from) / (24L * 60L * 60L * 1000L)).toInt()
        } catch (e: Exception) {
            -1
        }
    }
}
