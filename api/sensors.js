export default function handler(req, res) {
    return res.status(200).json({
        supabaseUrlExists: !!process.env.SUPABASE_URL,
        serviceKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
}