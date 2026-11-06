(() => {
    "use strict";

    if (!window.supabase?.createClient) {
        console.error(
            "A biblioteca do Supabase não foi carregada."
        );
        return;
    }

    const SUPABASE_URL =
        "https://eyhqihpwwevwzifhpcye.supabase.co";

    const SUPABASE_PUBLIC_KEY =
        "sb_publishable_3wmLqHqwd5QE_A1V7cqryw_5A459YoH";

    window.smiSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLIC_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
})();