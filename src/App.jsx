import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [sensor, setSensor] = useState(null);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pumpError, setPumpError] = useState(null);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSensor = async () => {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }

    if (!data) {
      setSensor(null);
      return;
    }

    setSensor(data);

    if (data.created_at) {
      setLastUpdated(new Date(data.created_at));
    }
  };

  const fetchPump = async () => {
    const { data, error } = await supabase
      .from("pump_control")
      .select("pump_status")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      setPumpError(error.message);
      return;
    }

    if (!data) {
      setPumpStatus(false);
      return;
    }

    setPumpStatus(Boolean(data.pump_status));
  };

  const togglePump = async () => {
    const newStatus = !pumpStatus;

    setPumpLoading(true);
    setPumpError(null);

    try {
      const response = await fetch(
        "https://irrigation-project26.vercel.app/api/pump",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            pump_status: newStatus
          })
        }
      );

      const text = await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          `Server returned ${response.status}: ${text || "Empty response"
          }`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to control pump"
        );
      }

      setPumpStatus(Boolean(result.pump_status));
    } catch (error) {
      setPumpError(error.message);
    } finally {
      setPumpLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSensor(),
        fetchPump()
      ]);

      setLoading(false);
    };

    loadData();

    const sensorChannel = supabase
      .channel("sensor-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings"
        },
        payload => {
          setSensor(payload.new);

          if (payload.new.created_at) {
            setLastUpdated(
              new Date(payload.new.created_at)
            );
          }
        }
      )
      .subscribe();

    const pumpChannel = supabase
      .channel("pump-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pump_control"
        },
        payload => {
          setPumpStatus(
            Boolean(payload.new.pump_status)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sensorChannel);
      supabase.removeChannel(pumpChannel);
    };
  }, []);

  const soilMoisture = sensor
    ? Number(sensor.soil_moisture) || 0
    : 0;

  const temperature = sensor
    ? Number(sensor.temperature) || 0
    : 0;

  const humidity = sensor
    ? Number(sensor.humidity) || 0
    : 0;

  const getSoilStatus = value => {
    if (value < 30) return "Dry";
    if (value < 60) return "Moderate";
    return "Wet";
  };

  const getSoilClass = value => {
    if (value < 30) return "danger";
    if (value < 60) return "warning";
    return "good";
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading irrigation data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Smart Irrigation</h1>
          <p>AI Powered Irrigation Monitoring System</p>
        </div>

        <div className="connection">
          <span className="online-dot"></span>
          <span>System Online</span>
        </div>
      </header>

      {error && (
        <div className="error">
          <strong>Database error:</strong> {error}
        </div>
      )}

      {sensor && (
        <>
          <section className="hero">
            <div>
              <p className="label">
                CURRENT SOIL CONDITION
              </p>

              <h2>
                {getSoilStatus(soilMoisture)}
              </h2>

              <p>
                Your soil currently has{" "}
                <strong>
                  {soilMoisture.toFixed(0)}%
                </strong>{" "}
                moisture.
              </p>
            </div>

            <div className="soil-circle">
              <span>
                {soilMoisture.toFixed(0)}%
              </span>

              <small>Moisture</small>
            </div>
          </section>

          <section className="cards">
            <div className="card">
              <div className="card-icon">🌡️</div>

              <div>
                <p>Temperature</p>
                <h3>
                  {temperature.toFixed(1)}°C
                </h3>
              </div>
            </div>

            <div className="card">
              <div className="card-icon">💧</div>

              <div>
                <p>Humidity</p>
                <h3>
                  {humidity.toFixed(1)}%
                </h3>
              </div>
            </div>

            <div
              className={`card ${getSoilClass(
                soilMoisture
              )}`}
            >
              <div className="card-icon">🌱</div>

              <div>
                <p>Soil Moisture</p>
                <h3>
                  {soilMoisture.toFixed(0)}%
                </h3>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="label">
                    SOIL MOISTURE
                  </p>

                  <h3>Moisture Level</h3>
                </div>

                <span
                  className={`status ${getSoilClass(
                    soilMoisture
                  )}`}
                >
                  {getSoilStatus(soilMoisture)}
                </span>
              </div>

              <div className="progress-container">
                <div
                  className="progress"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, soilMoisture)
                    )}%`
                  }}
                ></div>
              </div>

              <div className="progress-values">
                <span>0%</span>

                <strong>
                  {soilMoisture.toFixed(0)}%
                </strong>

                <span>100%</span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="label">
                    IRRIGATION CONTROL
                  </p>

                  <h3>Water Pump</h3>
                </div>

                <span
                  className={`status ${pumpStatus
                      ? "good"
                      : "warning"
                    }`}
                >
                  {pumpStatus
                    ? "Running"
                    : "Off"}
                </span>
              </div>

              <div className="pump-status">
                <div className="pump-icon">
                  💦
                </div>

                <div>
                  <h3>
                    {pumpStatus
                      ? "Pump ON"
                      : "Pump OFF"}
                  </h3>

                  <p>
                    {pumpStatus
                      ? "Water pump is currently running."
                      : "Water pump is currently stopped."}
                  </p>
                </div>
              </div>

              <button
                className={`pump-button ${pumpStatus
                    ? "pump-on"
                    : "pump-off"
                  }`}
                onClick={togglePump}
                disabled={pumpLoading}
              >
                {pumpLoading
                  ? "Updating..."
                  : pumpStatus
                    ? "Turn OFF Pump"
                    : "Turn ON Pump"}
              </button>

              {pumpError && (
                <div className="pump-error">
                  {pumpError}
                </div>
              )}
            </div>
          </section>

          <section className="info">
            <div>
              <span>
                Last sensor update
              </span>

              <strong>
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : "Waiting..."}
              </strong>
            </div>

            <div>
              <span>Soil reading</span>

              <strong>
                {soilMoisture.toFixed(0)}%
              </strong>
            </div>

            <div>
              <span>Temperature</span>

              <strong>
                {temperature.toFixed(1)}°C
              </strong>
            </div>

            <div>
              <span>Humidity</span>

              <strong>
                {humidity.toFixed(1)}%
              </strong>
            </div>
          </section>
        </>
      )}

      {!sensor && !error && (
        <div className="empty">
          <h2>No sensor data</h2>

          <p>
            Waiting for the ESP32 to send
            sensor readings.
          </p>
        </div>
      )}

      <footer>
        Smart Irrigation System · ESP32 +
        Supabase + React
      </footer>
    </div>
  );
}

export default App;