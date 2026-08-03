import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [sensor, setSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLatestSensor = async () => {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSensor(data);
    setLastUpdated(new Date());
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    fetchLatestSensor();

    const channel = supabase
      .channel("sensor-readings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings"
        },
        payload => {
          setSensor(payload.new);
          setLastUpdated(new Date());
          setError(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
              <p className="label">CURRENT SOIL CONDITION</p>
              <h2>{getSoilStatus(Number(sensor.soil_moisture))}</h2>
              <p>
                Your soil currently has{" "}
                <strong>{Number(sensor.soil_moisture).toFixed(0)}%</strong>{" "}
                moisture.
              </p>
            </div>

            <div className="soil-circle">
              <span>{Number(sensor.soil_moisture).toFixed(0)}%</span>
              <small>Moisture</small>
            </div>
          </section>

          <section className="cards">
            <div className="card">
              <div className="card-icon">🌡️</div>
              <div>
                <p>Temperature</p>
                <h3>{Number(sensor.temperature).toFixed(1)}°C</h3>
              </div>
            </div>

            <div className="card">
              <div className="card-icon">💧</div>
              <div>
                <p>Humidity</p>
                <h3>{Number(sensor.humidity).toFixed(1)}%</h3>
              </div>
            </div>

            <div className={`card ${getSoilClass(Number(sensor.soil_moisture))}`}>
              <div className="card-icon">🌱</div>
              <div>
                <p>Soil Moisture</p>
                <h3>{Number(sensor.soil_moisture).toFixed(0)}%</h3>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="label">SOIL MOISTURE</p>
                  <h3>Moisture Level</h3>
                </div>

                <span className={`status ${getSoilClass(Number(sensor.soil_moisture))}`}>
                  {getSoilStatus(Number(sensor.soil_moisture))}
                </span>
              </div>

              <div className="progress-container">
                <div
                  className="progress"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(sensor.soil_moisture))
                    )}%`
                  }}
                ></div>
              </div>

              <div className="progress-values">
                <span>0%</span>
                <strong>
                  {Number(sensor.soil_moisture).toFixed(0)}%
                </strong>
                <span>100%</span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="label">IRRIGATION STATUS</p>
                  <h3>Water Pump</h3>
                </div>
              </div>

              <div className="pump-status">
                <div className="pump-icon">
                  💦
                </div>

                <div>
                  <h3>
                    {sensor.pump_status ? "Running" : "Off"}
                  </h3>

                  <p>
                    {sensor.pump_status
                      ? "Water is currently being supplied."
                      : "Pump is currently inactive."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="info">
            <div>
              <span>Last sensor update</span>
              <strong>
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : "Waiting..."}
              </strong>
            </div>

            <div>
              <span>Soil reading</span>
              <strong>
                {Number(sensor.soil_moisture).toFixed(0)}%
              </strong>
            </div>

            <div>
              <span>Temperature</span>
              <strong>
                {Number(sensor.temperature).toFixed(1)}°C
              </strong>
            </div>

            <div>
              <span>Humidity</span>
              <strong>
                {Number(sensor.humidity).toFixed(1)}%
              </strong>
            </div>
          </section>
        </>
      )}

      {!sensor && !error && (
        <div className="empty">
          <h2>No sensor data</h2>
          <p>Waiting for the ESP32 to send sensor readings.</p>
        </div>
      )}

      <footer>
        Smart Irrigation System · ESP32 + Firebase/Supabase + React
      </footer>
    </div>
  );
}

export default App;