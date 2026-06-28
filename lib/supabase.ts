import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://aqemzktuhlltkmomoaxb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZW16a3R1aGxsdGttb21vYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MTUwODIsImV4cCI6MjA5ODE5MTA4Mn0.TXVHmlfaDrQrHiIPHa8LdQ58eRVbfAU1Dk1_SBtioT0",
);
