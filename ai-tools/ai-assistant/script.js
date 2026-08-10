const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const chatContainer =
    document.getElementById("chatContainer");

const newChatBtn =
    document.getElementById("newChatBtn");

let conversation = [];


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message) return;


    // Remove welcome screen

    const welcome =
        document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }


    // Show user message

    addMessage(
        "user",
        message
    );


    // Save user message

    conversation.push({
        role: "user",
        content: message
    });


    // Clear input

    messageInput.value = "";

    messageInput.style.height = "auto";


    // Disable send button

    sendBtn.disabled = true;


    // Show loading message

    const loading =
        addMessage(
            "ai",
            "Thinking..."
        );


    try {

        /*
         * Send message to Netlify Function
         *
         * Browser
         *    ↓
         * /.netlify/functions/ai
         *    ↓
         * ai.mjs
         *    ↓
         * OpenAI API
         */

        const response =
            await fetch(
                "/.netlify/functions/ai",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        messages:
                            conversation
                    })
                }
            );


        const data =
            await response.json();


        // Remove "Thinking..."

        loading.remove();


        // Check server response

        if (!response.ok) {

            throw new Error(
                data.error ||
                "AI service error"
            );
        }


        // Display AI response

        addMessage(
            "ai",
            data.reply
        );


        // Save AI response

        conversation.push({

            role: "assistant",

            content: data.reply

        });


    } catch (error) {

        // Remove loading message

        loading.remove();


        // Show error

        addMessage(
            "ai",
            "❌ " + error.message
        );


        console.error(
            "EmbedAI Error:",
            error
        );

    }


    // Enable send button

    sendBtn.disabled = false;

    messageInput.focus();
}


/* =========================
   ADD MESSAGE
========================= */

function addMessage(
    type,
    text
) {

    const message =
        document.createElement("div");


    message.className =
        `message ${type}`;


    // Avatar

    const avatar =
        document.createElement("div");


    avatar.className =
        "avatar";


    avatar.textContent =
        type === "ai"
            ? "🤖"
            : "👤";


    // Message content

    const content =
        document.createElement("div");


    content.className =
        "message-content";


    content.innerHTML =
        formatResponse(text);


    // Add elements

    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );


    // Add to chat

    chatContainer.appendChild(
        message
    );


    // Scroll to bottom

    chatContainer.scrollTop =
        chatContainer.scrollHeight;


    return message;
}


/* =========================
   FORMAT AI RESPONSE
========================= */

function formatResponse(text) {

    // Escape HTML first

    text =
        escapeHTML(text);


    // Format code blocks

    text =
        text.replace(
            /```(?:[\w+#.-]+)?\n?([\s\S]*?)```/g,

            '<pre class="code-block">$1</pre>'
        );


    // Format bold text

    text =
        text.replace(
            /\*\*(.*?)\*\*/g,

            "<strong>$1</strong>"
        );


    // Convert new lines

    text =
        text.replace(
            /\n/g,
            "<br>"
        );


    return text;
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

    return text

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================
   ENTER KEY
========================= */

messageInput.addEventListener(
    "keydown",
    function(event) {

        /*
         * Enter = Send
         *
         * Shift + Enter = New line
         */

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }

    }
);


/* =========================
   AUTO RESIZE
========================= */

messageInput.addEventListener(
    "input",
    function() {

        this.style.height =
            "auto";

        this.style.height =
            Math.min(
                this.scrollHeight,
                150
            ) + "px";

    }
);


/* =========================
   SEND BUTTON
========================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================
   NEW CHAT
========================= */

newChatBtn.addEventListener(
    "click",
    function() {

        conversation = [];

        location.reload();

    }
);


/* =========================
   SUGGESTION BUTTONS
========================= */

document
    .querySelectorAll(".suggestion")
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                const text =
                    this.textContent.trim();


                messageInput.value =
                    text;


                sendMessage();

            }
        );

    });