package com.duowindo6601.app.data

/**
 * All learning content bundled inside the APK so the app works 100% offline.
 * The app teaches from English into the selected course language.
 */
object Courses {

    private fun lesson(
        course: String,
        unit: Int,
        index: Int,
        title: String,
        vocab: List<Vocab>,
        sentences: List<SentenceData>
    ) = LessonData("$course-u$unit-l$index", title, vocab, sentences)

    private val spanish = Course(
        id = "es",
        name = "Spanish",
        localName = "Español",
        flag = "🇪🇸",
        ttsLocale = "es-ES",
        units = listOf(
            UnitData(
                "es-u1", "Unit 1 · Essentials",
                listOf(
                    lesson(
                        "es", 1, 1, "Basics",
                        listOf(
                            Vocab("hello", "hola"),
                            Vocab("goodbye", "adiós"),
                            Vocab("thank you", "gracias"),
                            Vocab("please", "por favor"),
                            Vocab("yes", "sí")
                        ),
                        listOf(
                            SentenceData("Hello, friend", "Hola, amigo"),
                            SentenceData("Yes, please", "Sí, por favor"),
                            SentenceData("Thank you, goodbye", "Gracias, adiós")
                        )
                    ),
                    lesson(
                        "es", 1, 2, "Greetings",
                        listOf(
                            Vocab("good morning", "buenos días"),
                            Vocab("good evening", "buenas tardes"),
                            Vocab("good night", "buenas noches"),
                            Vocab("welcome", "bienvenido"),
                            Vocab("friend", "amigo")
                        ),
                        listOf(
                            SentenceData("Good morning, friend", "Buenos días, amigo"),
                            SentenceData("Good night", "Buenas noches"),
                            SentenceData("Welcome, friend", "Bienvenido, amigo")
                        )
                    ),
                    lesson(
                        "es", 1, 3, "Food",
                        listOf(
                            Vocab("bread", "pan"),
                            Vocab("water", "agua"),
                            Vocab("apple", "manzana"),
                            Vocab("cheese", "queso"),
                            Vocab("milk", "leche")
                        ),
                        listOf(
                            SentenceData("Bread and cheese", "Pan y queso"),
                            SentenceData("The milk, please", "La leche, por favor"),
                            SentenceData("An apple and water", "Una manzana y agua")
                        )
                    )
                )
            ),
            UnitData(
                "es-u2", "Unit 2 · People & Places",
                listOf(
                    lesson(
                        "es", 2, 1, "Family",
                        listOf(
                            Vocab("mother", "madre"),
                            Vocab("father", "padre"),
                            Vocab("brother", "hermano"),
                            Vocab("sister", "hermana"),
                            Vocab("family", "familia")
                        ),
                        listOf(
                            SentenceData("My family", "Mi familia"),
                            SentenceData("My mother and my father", "Mi madre y mi padre"),
                            SentenceData("My sister", "Mi hermana")
                        )
                    ),
                    lesson(
                        "es", 2, 2, "Numbers",
                        listOf(
                            Vocab("one", "uno"),
                            Vocab("two", "dos"),
                            Vocab("three", "tres"),
                            Vocab("four", "cuatro"),
                            Vocab("five", "cinco")
                        ),
                        listOf(
                            SentenceData("One and two", "Uno y dos"),
                            SentenceData("Three apples", "Tres manzanas"),
                            SentenceData("Five friends", "Cinco amigos")
                        )
                    ),
                    lesson(
                        "es", 2, 3, "Travel",
                        listOf(
                            Vocab("train", "tren"),
                            Vocab("airport", "aeropuerto"),
                            Vocab("suitcase", "maleta"),
                            Vocab("hotel", "hotel"),
                            Vocab("ticket", "boleto")
                        ),
                        listOf(
                            SentenceData("The train", "El tren"),
                            SentenceData("The hotel, please", "El hotel, por favor"),
                            SentenceData("A ticket, please", "Un boleto, por favor")
                        )
                    )
                )
            )
        )
    )

    private val french = Course(
        id = "fr",
        name = "French",
        localName = "Français",
        flag = "🇫🇷",
        ttsLocale = "fr-FR",
        units = listOf(
            UnitData(
                "fr-u1", "Unit 1 · Essentials",
                listOf(
                    lesson(
                        "fr", 1, 1, "Basics",
                        listOf(
                            Vocab("hello", "bonjour"),
                            Vocab("goodbye", "au revoir"),
                            Vocab("thank you", "merci"),
                            Vocab("please", "s'il vous plaît"),
                            Vocab("yes", "oui")
                        ),
                        listOf(
                            SentenceData("Hello, friend", "Bonjour, ami"),
                            SentenceData("Yes, please", "Oui, s'il vous plaît"),
                            SentenceData("Thank you, goodbye", "Merci, au revoir")
                        )
                    ),
                    lesson(
                        "fr", 1, 2, "Greetings",
                        listOf(
                            Vocab("good evening", "bonsoir"),
                            Vocab("good night", "bonne nuit"),
                            Vocab("welcome", "bienvenue"),
                            Vocab("friend", "ami"),
                            Vocab("mister", "monsieur")
                        ),
                        listOf(
                            SentenceData("Good evening, friend", "Bonsoir, ami"),
                            SentenceData("Good night", "Bonne nuit"),
                            SentenceData("Welcome, mister", "Bienvenue, monsieur")
                        )
                    ),
                    lesson(
                        "fr", 1, 3, "Food",
                        listOf(
                            Vocab("bread", "pain"),
                            Vocab("water", "eau"),
                            Vocab("apple", "pomme"),
                            Vocab("cheese", "fromage"),
                            Vocab("milk", "lait")
                        ),
                        listOf(
                            SentenceData("Bread and cheese", "Pain et fromage"),
                            SentenceData("The milk, please", "Le lait, s'il vous plaît"),
                            SentenceData("An apple and water", "Une pomme et eau")
                        )
                    )
                )
            ),
            UnitData(
                "fr-u2", "Unit 2 · People & Places",
                listOf(
                    lesson(
                        "fr", 2, 1, "Family",
                        listOf(
                            Vocab("mother", "mère"),
                            Vocab("father", "père"),
                            Vocab("brother", "frère"),
                            Vocab("sister", "sœur"),
                            Vocab("family", "famille")
                        ),
                        listOf(
                            SentenceData("My family", "Ma famille"),
                            SentenceData("My mother and my father", "Ma mère et mon père"),
                            SentenceData("My sister", "Ma sœur")
                        )
                    ),
                    lesson(
                        "fr", 2, 2, "Numbers",
                        listOf(
                            Vocab("one", "un"),
                            Vocab("two", "deux"),
                            Vocab("three", "trois"),
                            Vocab("four", "quatre"),
                            Vocab("five", "cinq")
                        ),
                        listOf(
                            SentenceData("One and two", "Un et deux"),
                            SentenceData("Three apples", "Trois pommes"),
                            SentenceData("Five friends", "Cinq amis")
                        )
                    ),
                    lesson(
                        "fr", 2, 3, "Travel",
                        listOf(
                            Vocab("train", "train"),
                            Vocab("airport", "aéroport"),
                            Vocab("suitcase", "valise"),
                            Vocab("hotel", "hôtel"),
                            Vocab("ticket", "billet")
                        ),
                        listOf(
                            SentenceData("The train", "Le train"),
                            SentenceData("The hotel, please", "L'hôtel, s'il vous plaît"),
                            SentenceData("A ticket, please", "Un billet, s'il vous plaît")
                        )
                    )
                )
            )
        )
    )

    private val german = Course(
        id = "de",
        name = "German",
        localName = "Deutsch",
        flag = "🇩🇪",
        ttsLocale = "de-DE",
        units = listOf(
            UnitData(
                "de-u1", "Unit 1 · Essentials",
                listOf(
                    lesson(
                        "de", 1, 1, "Basics",
                        listOf(
                            Vocab("hello", "hallo"),
                            Vocab("goodbye", "tschüss"),
                            Vocab("thank you", "danke"),
                            Vocab("please", "bitte"),
                            Vocab("yes", "ja")
                        ),
                        listOf(
                            SentenceData("Hello, friend", "Hallo, Freund"),
                            SentenceData("Yes, please", "Ja, bitte"),
                            SentenceData("Thank you, goodbye", "Danke, tschüss")
                        )
                    ),
                    lesson(
                        "de", 1, 2, "Greetings",
                        listOf(
                            Vocab("good morning", "guten Morgen"),
                            Vocab("good evening", "guten Abend"),
                            Vocab("good night", "gute Nacht"),
                            Vocab("welcome", "willkommen"),
                            Vocab("friend", "Freund")
                        ),
                        listOf(
                            SentenceData("Good morning, friend", "Guten Morgen, Freund"),
                            SentenceData("Good night", "Gute Nacht"),
                            SentenceData("Welcome, friend", "Willkommen, Freund")
                        )
                    ),
                    lesson(
                        "de", 1, 3, "Food",
                        listOf(
                            Vocab("bread", "Brot"),
                            Vocab("water", "Wasser"),
                            Vocab("apple", "Apfel"),
                            Vocab("cheese", "Käse"),
                            Vocab("milk", "Milch")
                        ),
                        listOf(
                            SentenceData("Bread and cheese", "Brot und Käse"),
                            SentenceData("The milk, please", "Die Milch, bitte"),
                            SentenceData("An apple and water", "Ein Apfel und Wasser")
                        )
                    )
                )
            ),
            UnitData(
                "de-u2", "Unit 2 · People & Places",
                listOf(
                    lesson(
                        "de", 2, 1, "Family",
                        listOf(
                            Vocab("mother", "Mutter"),
                            Vocab("father", "Vater"),
                            Vocab("brother", "Bruder"),
                            Vocab("sister", "Schwester"),
                            Vocab("family", "Familie")
                        ),
                        listOf(
                            SentenceData("My family", "Meine Familie"),
                            SentenceData("My mother and my father", "Meine Mutter und mein Vater"),
                            SentenceData("My sister", "Meine Schwester")
                        )
                    ),
                    lesson(
                        "de", 2, 2, "Numbers",
                        listOf(
                            Vocab("one", "eins"),
                            Vocab("two", "zwei"),
                            Vocab("three", "drei"),
                            Vocab("four", "vier"),
                            Vocab("five", "fünf")
                        ),
                        listOf(
                            SentenceData("One and two", "Eins und zwei"),
                            SentenceData("Three apples", "Drei Äpfel"),
                            SentenceData("Five friends", "Fünf Freunde")
                        )
                    ),
                    lesson(
                        "de", 2, 3, "Travel",
                        listOf(
                            Vocab("train", "Zug"),
                            Vocab("airport", "Flughafen"),
                            Vocab("suitcase", "Koffer"),
                            Vocab("hotel", "Hotel"),
                            Vocab("ticket", "Ticket")
                        ),
                        listOf(
                            SentenceData("The train", "Der Zug"),
                            SentenceData("The hotel, please", "Das Hotel, bitte"),
                            SentenceData("A ticket, please", "Ein Ticket, bitte")
                        )
                    )
                )
            )
        )
    )

    private val italian = Course(
        id = "it",
        name = "Italian",
        localName = "Italiano",
        flag = "🇮🇹",
        ttsLocale = "it-IT",
        units = listOf(
            UnitData(
                "it-u1", "Unit 1 · Essentials",
                listOf(
                    lesson(
                        "it", 1, 1, "Basics",
                        listOf(
                            Vocab("hello", "ciao"),
                            Vocab("goodbye", "arrivederci"),
                            Vocab("thank you", "grazie"),
                            Vocab("please", "per favore"),
                            Vocab("yes", "sì")
                        ),
                        listOf(
                            SentenceData("Hello, friend", "Ciao, amico"),
                            SentenceData("Yes, please", "Sì, per favore"),
                            SentenceData("Thank you, goodbye", "Grazie, arrivederci")
                        )
                    ),
                    lesson(
                        "it", 1, 2, "Greetings",
                        listOf(
                            Vocab("good morning", "buongiorno"),
                            Vocab("good evening", "buonasera"),
                            Vocab("good night", "buonanotte"),
                            Vocab("welcome", "benvenuto"),
                            Vocab("friend", "amico")
                        ),
                        listOf(
                            SentenceData("Good morning, friend", "Buongiorno, amico"),
                            SentenceData("Good night", "Buonanotte"),
                            SentenceData("Welcome, friend", "Benvenuto, amico")
                        )
                    ),
                    lesson(
                        "it", 1, 3, "Food",
                        listOf(
                            Vocab("bread", "pane"),
                            Vocab("water", "acqua"),
                            Vocab("apple", "mela"),
                            Vocab("cheese", "formaggio"),
                            Vocab("milk", "latte")
                        ),
                        listOf(
                            SentenceData("Bread and cheese", "Pane e formaggio"),
                            SentenceData("The milk, please", "Il latte, per favore"),
                            SentenceData("An apple and water", "Una mela e acqua")
                        )
                    )
                )
            ),
            UnitData(
                "it-u2", "Unit 2 · People & Places",
                listOf(
                    lesson(
                        "it", 2, 1, "Family",
                        listOf(
                            Vocab("mother", "madre"),
                            Vocab("father", "padre"),
                            Vocab("brother", "fratello"),
                            Vocab("sister", "sorella"),
                            Vocab("family", "famiglia")
                        ),
                        listOf(
                            SentenceData("My family", "La mia famiglia"),
                            SentenceData("My mother and my father", "Mia madre e mio padre"),
                            SentenceData("My sister", "Mia sorella")
                        )
                    ),
                    lesson(
                        "it", 2, 2, "Numbers",
                        listOf(
                            Vocab("one", "uno"),
                            Vocab("two", "due"),
                            Vocab("three", "tre"),
                            Vocab("four", "quattro"),
                            Vocab("five", "cinque")
                        ),
                        listOf(
                            SentenceData("One and two", "Uno e due"),
                            SentenceData("Three apples", "Tre mele"),
                            SentenceData("Five friends", "Cinque amici")
                        )
                    ),
                    lesson(
                        "it", 2, 3, "Travel",
                        listOf(
                            Vocab("train", "treno"),
                            Vocab("airport", "aeroporto"),
                            Vocab("suitcase", "valigia"),
                            Vocab("hotel", "hotel"),
                            Vocab("ticket", "biglietto")
                        ),
                        listOf(
                            SentenceData("The train", "Il treno"),
                            SentenceData("The hotel, please", "L'hotel, per favore"),
                            SentenceData("A ticket, please", "Un biglietto, per favore")
                        )
                    )
                )
            )
        )
    )

    val all: List<Course> = listOf(spanish, french, german, italian)

    fun byId(id: String?): Course = all.firstOrNull { it.id == id } ?: all.first()
}
