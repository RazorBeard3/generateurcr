use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

// Le backend Node.js est tué automatiquement quand Tauri libère le state (à la fermeture)
struct BackendProcess(Mutex<Child>);

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Ok(mut child) = self.0.lock() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

// Cherche node dans les emplacements Mac courants (Homebrew Intel/ARM, system)
fn find_node() -> String {
    let candidates = [
        "/opt/homebrew/bin/node",  // Homebrew Apple Silicon
        "/usr/local/bin/node",     // Homebrew Intel
        "/usr/bin/node",
    ];
    candidates
        .iter()
        .find(|p| std::path::Path::new(p).exists())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "node".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Chemin vers le backend :
            // - Dev  : depuis src-tauri/ → ../../backend
            // - Prod : backend copié dans le bundle via tauri.conf.json resources
            let backend_dir = if cfg!(debug_assertions) {
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .parent().expect("parent frontend/")
                    .parent().expect("parent project root")
                    .join("backend")
            } else {
                app.path()
                    .resource_dir()
                    .expect("resource_dir introuvable")
                    .join("backend")
            };

            let child = Command::new(find_node())
                .arg("server.js")
                .current_dir(&backend_dir)
                .spawn()
                .expect("Impossible de démarrer le backend Node.js");

            app.manage(BackendProcess(Mutex::new(child)));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
