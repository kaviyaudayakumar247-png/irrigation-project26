import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
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
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                error: "Pump control row with id 1 not found"
            });
        }

        return res.status(200).json({
            success: true,
            pump_status: Boolean(data.pump_status)
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}