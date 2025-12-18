<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1dn5_wdJBAFvu6G2YXsMJZC5Q_KVSH-Eo

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Set the `GEMINI_API_KEY` in `.env` to your Gemini API key
   - Set up your Supabase project and add credentials:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

3. Set up Supabase database:
   - Follow the instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to create the required database tables and policies

4. Run the app:
   ```bash
   npm run dev
   ```

## Authentication

This app uses Supabase authentication with role-based access control:

- **Driver Role**: Access to driver dashboard with trip management, expenses, and real-time tracking
- **Manager Role**: Access to manager dashboard with fleet overview, analytics, and driver management

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed setup instructions.
