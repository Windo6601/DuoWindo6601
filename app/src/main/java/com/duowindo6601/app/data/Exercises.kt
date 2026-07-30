package com.duowindo6601.app.data

import kotlin.random.Random

/** One interactive exercise inside a lesson. Generated locally, no network needed. */
sealed class Exercise {

    /** Shown above the answer area. */
    abstract val instruction: String

    /** Text spoken by the on-device TTS engine (may be null). */
    abstract val speakText: String?

    /** English -> course language, pick 1 of 4. */
    data class PickTarget(val vocab: Vocab, val options: List<String>) : Exercise() {
        override val instruction: String get() = "Translate this word"
        override val speakText: String get() = vocab.target
    }

    /** Course language -> English, pick 1 of 4. */
    data class PickSource(val vocab: Vocab, val options: List<String>) : Exercise() {
        override val instruction: String get() = "What does this mean?"
        override val speakText: String get() = vocab.target
    }

    /** Build the translated sentence from shuffled word tokens. */
    data class BuildSentence(val sentence: SentenceData, val bank: List<String>) : Exercise() {
        override val instruction: String get() = "Translate this sentence"
        override val speakText: String get() = sentence.target
    }
}

/** Builds a fixed deterministic 6-exercise session for a lesson. */
object ExerciseFactory {

    fun build(course: Course, lesson: LessonData): List<Exercise> {
        val rng = Random(lesson.id.hashCode() * 31L + 17L)

        val targetPool = course.lessons.flatMap { it.vocab }.map { it.target }.distinct()
        val sourcePool = course.lessons.flatMap { it.vocab }.map { it.source }.distinct()

        val exercises = mutableListOf<Exercise>()

        // Two English -> target pick exercises.
        lesson.vocab.shuffled(rng).take(2).forEach { vocab ->
            val distractors = targetPool.filter { it != vocab.target }.shuffled(rng).take(3)
            exercises += Exercise.PickTarget(vocab, (distractors + vocab.target).shuffled(rng))
        }

        // Two target -> English pick exercises.
        lesson.vocab.shuffled(rng).take(2).forEach { vocab ->
            val distractors = sourcePool.filter { it != vocab.source }.shuffled(rng).take(3)
            exercises += Exercise.PickSource(vocab, (distractors + vocab.source).shuffled(rng))
        }

        // Two sentence-building exercises.
        lesson.sentences.shuffled(rng).take(2).forEach { sentence ->
            val tokens = sentence.target.split(" ").filter { it.isNotBlank() }
            var bank = tokens.shuffled(rng)
            if (tokens.size > 1 && bank == tokens) bank = tokens.reversed()
            exercises += Exercise.BuildSentence(sentence, bank)
        }

        return exercises.shuffled(rng)
    }
}
