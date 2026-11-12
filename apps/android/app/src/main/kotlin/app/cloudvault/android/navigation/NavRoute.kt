package app.cloudvault.android.navigation

sealed class NavRoute(val route: String) {
    object Splash : NavRoute("splash")
    object Onboarding : NavRoute("onboarding")
    object Landing : NavRoute("landing")
    object Login : NavRoute("login")
    object Register : NavRoute("register")
    object VerifyEmail : NavRoute("verify_email")
    object RecoveryKitSetup : NavRoute("recovery_kit_setup")
    object RecoveryKitVerify : NavRoute("recovery_kit_verify")

    // Main App Graphs
    object Dashboard : NavRoute("dashboard")
    object FileBrowser : NavRoute("file_browser")
    object FolderBrowser : NavRoute("folder_browser?folderId={folderId}&folderName={folderName}") {
        fun createRoute(folderId: String, folderName: String) = "folder_browser?folderId=$folderId&folderName=$folderName"
    }
    object FileDetails : NavRoute("file_details/{fileId}") {
        fun createRoute(fileId: String) = "file_details/$fileId"
    }
    object UploadManager : NavRoute("upload_manager")
    object DownloadManager : NavRoute("download_manager")
    object Trash : NavRoute("trash")
    object AccountSettings : NavRoute("account_settings")
    object SecuritySettings : NavRoute("security_settings")
    object SessionManagement : NavRoute("session_management")
    object StorageUsage : NavRoute("storage_usage")
    object KnownLimitations : NavRoute("known_limitations")
}

