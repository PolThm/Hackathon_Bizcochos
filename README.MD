# Routines: Your AI-Powered Stretching Coach 🧘‍♂️⚡️

**Routines** is an agentic, context-aware recovery PWA that moves beyond static stretching templates. It uses AI to understand your physical strain—analyzing your workouts, your schedule, and even the weather—to generate the perfect mobility routine at the perfect time.

## 🚀 Stretching Powered by Gemini 3 Pro

The core of **Routines** is its "Smart Recovery" architecture, powered by **Gemini 3 Pro**. Unlike traditional apps that offer generic yoga flows, Routines reasons about your specific muscle fatigue to build a bespoke stretching experience.

### Key AI-Driven Features:
*   **Agentic Recovery (via LangGraph):** Gemini 3 Pro acts as a reasoning engine that autonomously decides which muscle groups need attention. It calls the **Strava API** to detect if you've just finished a heavy leg day or a long run, then immediately constructs a routine targeting those specific areas.
*   **Contextual Mobility Ingestion:** The model synthesizes data from your environment. If you've been sedentary all day (detected via calendar gaps), it pivots to "desk-relief" opening stretches. If it's cold outside, it adds dynamic warm-up movements to your flow.
*   **Native Function Calling & Precise Routines:** Leveraging Gemini's structured output, the backend delivers exact stretching durations and sequences directly to the PWA, ensuring your recovery is scientifically backed and perfectly timed.

---

## ✨ Core Features

*   **🧘‍♂️ Intelligent Stretching:** Real-time routine generation focused on mobility, flexibility, and injury prevention.
*   **📅 Automatic Recovery Slots:** Finds gaps in your Google Calendar and books your stretching sessions so recovery becomes a habit, not an afterthought.
*   **🏃‍♂️ Strava-Sync Fatigue Analysis:** Automatically suggests stretches based on your latest activities (e.g., hip flexor release after cycling, hamstring care after running).
*   **📱 Offline-First PWA:** Your coach goes everywhere. Works offline with a polished mobile UI designed for use on the mat.
*   **🌍 Multilingual Support:** Fully localized in English, Spanish, and French.

---

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14, TypeScript, Material UI, Workbox (PWA).
*   **Backend:** Fastify (Node.js), LangGraph.
*   **AI Orchestration:** Gemini 3 Pro (via Google AI SDK), LangChain.
*   **Integrations:** Google Calendar API, Strava API, Open-Meteo API.

---

## 🚦 Getting Started

### Prerequisites
*   Node.js v20+
*   API Keys for Gemini, Strava, and Google Calendar (see `.env.example`)

### Installation
1.  **Clone the repo:**
    ```bash
    git clone https://github.com/PolThm/Hackathon_Bizcochos.git
    cd Hackathon_Bizcochos
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the project:**
    ```bash
    npm run start
    ```

---

*Built with ❤️ for the Gemini Hackathon 2026.*
