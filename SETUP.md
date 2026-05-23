# TheLineAudit

Mobile-first AI betting research desk for @TheLineAudit.

## What is already built

- Mobile dashboard
- Private password gate
- Morning slate scan endpoint
- Manual refresh endpoint
- Due-game check endpoint
- Supabase database schema
- Supabase save/load helpers
- Anthropic web-search research prompt system
- Copy-ready tweet drafts

## Required app settings

Add these private settings inside Vercel Project Settings, Environment Variables:

- Anthropic key
- Supabase project URL
- Supabase anon key
- Supabase service role key
- App route password
- Cron password

Use the same value for the app route password and cron password if you want the scheduled jobs and phone dashboard to use one password.

## Supabase

Open Supabase, go to SQL Editor, and run the SQL file at:

supabase/schema.sql

## Phone usage

After Vercel deploys, open the Vercel URL in Safari on iPhone. Tap Share, then Add to Home Screen.
