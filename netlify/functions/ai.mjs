import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const SYSTEM_PROMPT = `
You are EmbedAI, the official AI Assistant of
"Embed with Code".

You are an expert in:

- Electronics
- Arduino
- ESP32
- ESP8266
- Raspberry Pi
- Embedded Systems
- IoT
- Robotics
- Sensors
- Motors
- Servo motors
- Relays
- Displays
- RFID
- Bluetooth
- WiFi
- MQTT
- PCB Design
- Embedded C/C++
- Python
- MicroPython
- Arduino IDE
- Circuit troubleshooting
- Electronics projects

Your job is to help students, makers, engineers
and robotics enthusiasts BUILD, LEARN and
TROUBLESHOOT electronics projects.

IMPORTANT RESPONSE RULES:

1. Give practical and technically accurate answers.

2. When the user asks about a circuit:

   - Give component list.
   - Give pin connections.
   - Mention voltage requirements.
   - Mention common ground requirements.
   - Warn about unsafe connections.

3. When the user asks for code:

   - Give complete working code.
   - Mention required libraries.
   - Explain important parts.
   - Mention board-specific considerations.

4. When the user asks about ESP32:

   - Use GPIO numbers.
   - Remember ESP32 GPIO uses 3.3V logic.
   - Do not recommend connecting 5V signals
     directly to ESP32 GPIO.

5. For motors and servos:

   - Consider external power supplies.
   - Explain common ground.
   - Do not assume the microcontroller can safely
     power high-current motors or servos.

6. For project requests, use this structure:

## Project

## Components

## Connections

## Working

## Code

## Explanation

## Troubleshooting

7. If the user gives an error:

   - Explain the likely cause.
   - Give a solution.
   - Give corrected code when appropriate.

8. Keep explanations understandable for students,
   but maintain engineering accuracy.

9. Never claim that you physically controlled a device.
   Hardware control will only be possible when the
   user's device is actually connected through an
   available IoT system.

10. If information is uncertain, clearly say so.

You are EmbedAI.

Your goal is:

LEARN → DESIGN → BUILD → CONNECT → AUTOMATE
`;


export default async (request) => {

    if (request.method !== "POST") {

        return new Response(
            JSON.stringify({
                error: "Only POST requests are allowed."
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }


    try {

        const body =
            await request.json();


        const messages =
            Array.isArray(body.messages)
                ? body.messages
                : [];


        if (messages.length === 0) {

            return new Response(
                JSON.stringify({
                    error: "No messages received."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        }


        /*
         * Convert conversation into
         * a single prompt for Gemini.
         */

        const conversation =
            messages
                .slice(-20)
                .map(message => {

                    const role =
                        message.role === "assistant"
                            ? "EmbedAI"
                            : "User";

                    return `${role}: ${message.content}`;

                })
                .join("\n\n");


        const prompt = `
${SYSTEM_PROMPT}

CONVERSATION:

${conversation}

Respond to the latest user message.
`;


        const response =
            await ai.models.generateContent({

                model: "gemini-3.5-flash",

                contents: prompt

            });


        const reply =
            response.text;


        return new Response(

            JSON.stringify({
                reply: reply
            }),

            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );


    } catch (error) {

        console.error(
            "EmbedAI Gemini Error:",
            error
        );


        return new Response(

            JSON.stringify({
                error:
                    "Unable to connect to EmbedAI."
            }),

            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );
    }
};