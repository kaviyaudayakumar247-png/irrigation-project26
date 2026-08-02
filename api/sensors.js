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
        const { temperature, humidity, soilMoisture } = req.body;

        console.log("Received:", {
            temperature,
            humidity,
            soilMoisture
        });

        const { data, error } = await supabase
            .from("sensor_readings")
            .insert({
                temperature: Number(temperature),
                humidity: Number(humidity),
                soil_moisture: Number(soilMoisture),
                pump_status: false
            })
            .select();

        if (error) {
            console.error("Supabase error:", error.message);

            return res.status(500).json({
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error("Server error:", error);

        return res.status(500).json({
            error: error.message
        });
    }
}