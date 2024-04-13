// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use core::time;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
fn main() {
    tauri::Builder::default()
        .setup(|app|{
            let app_handle = app.handle();
            let url: String = env::var("SIGNAGE_API_URL").expect("SIGNAGE_API_URL is not set.");
            std::thread::spawn(move || loop {
                let request = ureq::get(url.as_str()).call();
                match request {
                    Ok(response) => {
                        app_handle.emit_all("status_json", response.into_string().unwrap()).unwrap();
                    }
                    Err(_) => {
                        app_handle.emit_all("note", "JSONファイルがうまく取得できなかったようです！".to_string()).unwrap();
                    }
                }
                std::thread::sleep(time::Duration::from_secs(120));
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
