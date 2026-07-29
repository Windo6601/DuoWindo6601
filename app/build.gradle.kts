plugins {
    id("com.android.application")
}

val localCompileSdkVersion = rootProject.extra["compileSdkVersion"] as Int
val localMinSdkVersion = rootProject.extra["minSdkVersion"] as Int
val localTargetSdkVersion = rootProject.extra["targetSdkVersion"] as Int
val androidxAppCompatVersion = rootProject.extra["androidxAppCompatVersion"] as String
val androidxCoordinatorLayoutVersion = rootProject.extra["androidxCoordinatorLayoutVersion"] as String
val coreSplashScreenVersion = rootProject.extra["coreSplashScreenVersion"] as String
val junitVersion = rootProject.extra["junitVersion"] as String
val androidxJunitVersion = rootProject.extra["androidxJunitVersion"] as String
val androidxEspressoCoreVersion = rootProject.extra["androidxEspressoCoreVersion"] as String

android {
    namespace = "com.duowindo6601.app"
    compileSdk = localCompileSdkVersion
    defaultConfig {
        applicationId = "com.duowindo6601.app"
        minSdk = localMinSdkVersion
        targetSdk = localTargetSdkVersion
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
             // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
            ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~"
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
        }
        debug {
        }
    }
}

repositories {
    flatDir {
        dirs("../capacitor-cordova-android-plugins/src/main/libs", "libs")
    }
}

dependencies {
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar"))))
    implementation("androidx.appcompat:appcompat:$androidxAppCompatVersion")
    implementation("androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion")
    implementation("androidx.core:core-splashscreen:$coreSplashScreenVersion")
    implementation(project(":capacitor-android"))
    testImplementation("junit:junit:$junitVersion")
    androidTestImplementation("androidx.test.ext:junit:$androidxJunitVersion")
    androidTestImplementation("androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion")
    if (project.findProject(":capacitor-cordova-android-plugins") != null) {
        implementation(project(":capacitor-cordova-android-plugins"))
    }
}

apply(from = "capacitor.build.gradle")

try {
    val servicesJSON = file("google-services.json")
    if (servicesJSON.exists() && servicesJSON.readText().isNotEmpty()) {
        apply(plugin = "com.google.gms.google-services")
    }
} catch (e: Exception) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
