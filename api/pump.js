import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method === "GET") {
        const { data, error } = await supabase
            .from("pump_control")
            .select("pump_status")
            .eq("id", 1)
            .single();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        return res.status(200).json({
            pump_status: Boolean(data.pump_status)
        });
    }

    if (req.method === "POST") {
        const { pump_status } = req.body;

        if (typeof pump_status !== "boolean") {
            return res.status(400).json({
                error: "pump_status must be boolean"
            });
        }

        const { data, error } = await supabase
            .from("pump_control")
            .update({
                pump_status: pump_status
            })
            .eq("id", 1)
            .select("pump_status")
            .single();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        return res.status(200).json({
            pump_status: Boolean(data.pump_status)
        });
    }

    return res.status(405).json({
        error: "Method not allowed"
    });
}