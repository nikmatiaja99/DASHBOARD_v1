Set WshShell = CreateObject("WScript.Shell")
' Jalankan npm run dev di background tanpa jendela terminal hitam
WshShell.Run "cmd /c npm run dev", 0, False

' Tunggu 3 detik agar server inisialisasi, lalu buka browser otomatis
WScript.Sleep 3000
WshShell.Run "http://localhost:3000"
