This folder should contain the login background and project logo used by the Ariya app.

Please download the images manually (or run the included PowerShell script) and place them here with these filenames:

- General_Login_01.jpg  (from https://ariyamaan.com/assets/images/General_Login%20Screen_01.jpg)
- logo-inverse.png      (from https://ariyamaan.com/assets/images/logo-inverse.png)

PowerShell example (run as Administrator if required):

Invoke-WebRequest -Uri "https://ariyamaan.com/assets/images/General_Login%20Screen_01.jpg" -OutFile "public\\images\\General_Login_01.jpg"
Invoke-WebRequest -Uri "https://ariyamaan.com/assets/images/logo-inverse.png" -OutFile "public\\images\\logo-inverse.png"

If you prefer, download via browser and save the files to this folder.
