import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { pump_status } = req.body;

        if (typeof pump_status !== "boolean") {
            return res.status(400).json({
                error: "pump_status must be true or false"
            });
        }

        const { data, error } = await supabase
            .from("pump_control")
            .update({
                pump_status: pump_status,
                updated_at: new Date().toISOString()
            })
            .eq("id", 1)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            pump_status: data.pump_status
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}