@echo off
REM -----------------------------
REM Folder to process
SET FOLDER=C:\Git\Jernej\fuzzy-waddle\apps\client\src\metadata\probable-waffle\sprites\siege_weapons\catapult\break\w
REM -----------------------------

REM List of file positions to delete (space-separated)
SET FILES_TO_DELETE=2 3 5 6 7 8 10 11 13 14 16 17 19 20 21 23 24 26 27 29 30

REM Initialize counter
SET /A COUNT=0

REM Loop through all files sorted alphabetically
for %%f in ("%FOLDER%\*") do (
    SET /A COUNT+=1
    REM Use delayed expansion to access variables inside loop
    setlocal enabledelayedexpansion
    for %%i in (%FILES_TO_DELETE%) do (
        if !COUNT! equ %%i (
            echo Deleting file: %%f
            del "%%f"
        )
    )
    endlocal
)
echo Done.
pause
