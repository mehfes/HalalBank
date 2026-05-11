Step 1: Stop the current API — press Ctrl+C in the API terminal
Step 2: Rebuild and restart:
cd src/API
dotnet run
Step 3: In your second terminal, send the reminder:
curl.exe -X POST http://localhost:5000/api/payment-task/send-reminders
Step 4: Check the API terminal logs. You should see:
✅ REAL EMAIL SENT to mefesak007@gmail.com