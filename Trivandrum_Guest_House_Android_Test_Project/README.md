# Trivandrum Guest House Register — Android test build

This is a test APK project for the requirements discussed.

## Features in this test build
- Month and year selector; each date is a row and five rooms are columns.
- Rooms: Gemini 1, Gemini 2, Royal 1, Royal 2, VIP Room.
- Yellow = vacant; green = booked; red blinking = checkout due today.
- New Entry tab is blue and protected by passcodes 60608 and 60001.
- Guest name, occupants, designation (Retd./Employee/Other), employee number when Employee, room checkboxes, check-in and checkout.
- Completed records are sorted by earliest checkout date.
- Excel export of completed records protected by passcode 1117.
- Automatic completion is processed at 11:00 AM local device time while the app is open; if the app is closed, it is processed the next time the app is opened.

## Important limitation
This first Android test build stores records locally on the phone (localStorage). It does NOT yet synchronize bookings between phones. Supabase shared online database integration must be configured and tested separately before operational use. Do not enter real guest personal data into this test build.

The passcodes are client-side test controls and are not secure for production.

## Build the APK using GitHub Actions
1. Upload the contents of this folder to the root of your GitHub repository, preserving `.github/workflows/build-apk.yml`.
2. Commit and push to the `main` branch.
3. In GitHub, open **Actions** → **Build Android APK** → **Run workflow**.
4. Wait for the run to complete.
5. Open the completed workflow run and download the artifact named `guest-house-register-debug-apk`.
6. Extract the downloaded artifact ZIP; it contains `app-debug.apk`.
7. Transfer `app-debug.apk` to your Android phone and install it. If Android asks, allow installation from that source.

## Test on Android
Create a few sample bookings using passcode 60608 or 60001. Change month/year to inspect the room matrix. On checkout day, red blinking marks the room until 11:00 AM. For a quick test, temporarily change the phone date/time only on a test device; restore it afterward.

## Production next step
Connect Supabase with authenticated staff accounts, server-side authorisation, and scheduled 11:00 AM checkout processing. A client-side timer cannot reliably execute while Android has suspended or closed the app.
