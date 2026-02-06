# Routines: Your Smart Digital Coach 🧘‍♂️⚡️

**Routines** is an agentic, context-aware fitness PWA that moves beyond static workout templates. It uses AI to understand your life—your schedule, your fatigue, and even the weather—to generate the perfect routine at the perfect time.

## 🚀 The Gemini 3 Pro Integration

The core of **Routines** is its "Smart Digital Coach" architecture, powered by **Gemini 3 Pro**. Unlike traditional apps, Routines doesn't just show videos; it reasons about your context to build a bespoke experience.

### Key Gemini 3 Pro Features:
*   **Agentic Tool Use (via LangGraph):** Gemini 3 Pro acts as a reasoning engine within a state machine. It autonomously decides when to call the **Strava API** (to check recovery needs) or the **Google Calendar API** (to find and book a 15-minute training gap).
*   **Multimodal Context Ingestion:** The model synthesizes disparate data points—from hyper-local weather to granular fitness profiles—to adapt workouts dynamically. If it's raining, it pivots to indoor mobility; if you just finished a 10km run, it prioritizes psoas and glute recovery.
*   **Native Function Calling & Structured Outputs:** By leveraging Gemini's reliable JSON generation, the backend delivers complex workout schemas directly to the PWA frontend, ensuring a seamless and error-free user experience.

---

## ✨ Core Features

*   **🤖 AI-Powered Personalization:** Real-time routine generation based on your actual physical state and environmental conditions.
*   **📅 Calendar Synchronization:** Automatically finds free slots in your Google Calendar and books your session so you never miss a workout.
*   **🏃‍♂️ Strava Integration:** Analyzes your recent activities to suggest recovery or complementary strength training.
*   **📱 Offline-First PWA:** Built for the gym or the park. Works offline with sync capabilities, installation support, and a polished mobile UI.
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
    git clone https://github.com/your-repo/routines.git
    cd routines
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