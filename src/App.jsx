import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "./App.css";

function App() {
  const [data, setData] = useState({
    temperature: 32.4,
    humidity: 58,
    soilMoisture: 24,
    pump: false
  });

  const [mode, setMode] = useState("AUTO");

  const [history, setHistory] = useState([
    { time: "10:00", soil: 58, temperature: 28 },
    { time: "10:30", soil: 52, temperature: 29 },
    { time: "11:00", soil: 45, temperature: 30 },
    { time: "11:30", soil: 38, temperature: 31 },
    { time: "12:00", soil: 31, temperature: 32 },
    { time: "12:30", soil: 24, temperature: 32 }
  ]);

  const [ai, setAi] = useState({
    decision: "IRRIGATION REQUIRED",
    reason: "Soil moisture is low and temperature is high.",
    duration: 30,
    confidence: 94
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        temperature: +(prev.temperature + (Math.random() - 0.5) * 0.4).toFixed(1),
        humidity: Math.max(
          0,
          Math.min(100, +(prev.humidity + (Math.random() - 0.5) * 1).toFixed(1))
        ),
        soilMoisture: Math.max(
          0,
          Math.min(100, +(prev.soilMoisture + (Math.random() - 0.5) * 2).toFixed(1))
        )
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.soilMoisture < 30) {
      setAi({
        decision: "IRRIGATION REQUIRED",
        reason: "Soil moisture is low.",
        duration: 30,
        confidence: 94
      });
    } else {
      setAi({
        decision: "IRRIGATION NOT REQUIRED",
        reason: "Soil moisture is sufficient.",
        duration: 0,
        confidence: 91
      });
    }
  }, [data.soilMoisture]);

  const togglePump = () => {
    if (mode === "MANUAL") {
      setData(prev => ({
        ...prev,
        pump: !prev.pump
      }));
    }
  };

  const changeMode = modeName => {
    setMode(modeName);

    if (modeName === "AUTO") {
      setData(prev => ({
        ...prev,
        pump: prev.soilMoisture < 30
      }));
    }
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>Smart Irrigation</h1>
          <p>AI Powered Irrigation Monitoring System</p>
        </div>

        <div className="connection">
          <span></span>
          ESP32 ONLINE
        </div>
      </header>

      <main>
        <section className="cards">
          <SensorCard
            title="Temperature"
            value={data.temperature}
            unit="°C"
            icon="🌡️"
          />

          <SensorCard
            title="Humidity"
            value={data.humidity}
            unit="%"
            icon="💧"
          />

          <SensorCard
            title="Soil Moisture"
            value={data.soilMoisture}
            unit="%"
            icon="🌱"
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>Environment History</h2>
              <span>Live</span>
            </div>

            <div className="chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="soil"
                    name="Soil Moisture"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel ai-panel">
            <div className="panel-header">
              <h2>AI Decision</h2>
              <span>AI</span>
            </div>

            <div className="ai-status">
              <div className="ai-icon">🤖</div>

              <h3>{ai.decision}</h3>

              <p>{ai.reason}</p>

              <div className="ai-details">
                <div>
                  <strong>{ai.duration}s</strong>
                  <span>Recommended Duration</span>
                </div>

                <div>
                  <strong>{ai.confidence}%</strong>
                  <span>Confidence</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel pump-panel">
            <div className="panel-header">
              <h2>Water Pump</h2>

              <div className={`pump-status ${data.pump ? "on" : "off"}`}>
                <span></span>
                {data.pump ? "ON" : "OFF"}
              </div>
            </div>

            <div className="pump-control">
              <div className={`pump-circle ${data.pump ? "active" : ""}`}>
                💦
              </div>

              <div>
                <p>Control Mode</p>

                <div className="mode-buttons">
                  <button
                    className={mode === "AUTO" ? "active-button" : ""}
                    onClick={() => changeMode("AUTO")}
                  >
                    AUTO
                  </button>

                  <button
                    className={mode === "MANUAL" ? "active-button" : ""}
                    onClick={() => changeMode("MANUAL")}
                  >
                    MANUAL
                  </button>
                </div>
              </div>

              <button
                className={`pump-button ${data.pump ? "stop" : ""}`}
                onClick={togglePump}
                disabled={mode === "AUTO"}
              >
                {data.pump ? "TURN OFF PUMP" : "TURN ON PUMP"}
              </button>
            </div>
          </div>

          <div className="panel status-panel">
            <div className="panel-header">
              <h2>System Status</h2>
            </div>

            <StatusRow
              name="ESP32"
              status="Online"
            />

            <StatusRow
              name="DHT22"
              status="Connected"
            />

            <StatusRow
              name="Soil Sensor"
              status="Connected"
            />

            <StatusRow
              name="AI Engine"
              status="Active"
            />
          </div>
        </section>
      </main>

      <footer>
        Smart Irrigation System • ESP32 + AI + React
      </footer>
    </div>
  );
}

function SensorCard({ title, value, unit, icon }) {
  return (
    <div className="sensor-card">
      <div className="sensor-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <h2>
          {value}
          <small>{unit}</small>
        </h2>
      </div>
    </div>
  );
}

function StatusRow({ name, status }) {
  return (
    <div className="status-row">
      <span>{name}</span>

      <div>
        <i></i>
        {status}
      </div>
    </div>
  );
}

export default App;