/* =====================================================
   ELEMENTS
===================================================== */

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const chatContainer =
    document.getElementById("chatContainer");

const newChatBtn =
    document.getElementById("newChatBtn");


/* =====================================================
   MOBILE SIDEBAR ELEMENTS
===================================================== */

const menuBtn =
    document.getElementById("menuBtn");

const closeMenuBtn =
    document.getElementById("closeMenuBtn");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");


/* =====================================================
   CONVERSATION
===================================================== */

let conversation = [];


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

function openSidebar() {

    if (!sidebar || !sidebarOverlay) {
        return;
    }

    sidebar.classList.add("active");

    sidebarOverlay.classList.add("active");

}


function closeSidebar() {

    if (!sidebar || !sidebarOverlay) {
        return;
    }

    sidebar.classList.remove("active");

    sidebarOverlay.classList.remove("active");

}


/* OPEN MENU */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        openSidebar
    );

}


/* CLOSE MENU */

if (closeMenuBtn) {

    closeMenuBtn.addEventListener(
        "click",
        closeSidebar
    );

}


/* CLOSE BY OVERLAY */

if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

}


/* CLOSE AFTER CLICKING AI TOOLS */

const backButton =
    document.querySelector(".back-btn");

if (backButton) {

    backButton.addEventListener(
        "click",
        closeSidebar
    );

}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    /* Remove welcome */

    const welcome =
        document.getElementById("welcome");

    if (welcome) {

        welcome.remove();

    }


    /* User message */

    addMessage(
        "user",
        message
    );


    /* Save user message */

    conversation.push({

        role: "user",

        content: message

    });


    /* Clear input */

    messageInput.value = "";

    messageInput.style.height =
        "auto";


    /* Disable send */

    sendBtn.disabled = true;


    /* Thinking */

    const loading =
        addMessage(
            "ai",
            "Thinking..."
        );


    try {

        /*
         * Browser
         *     ↓
         * Netlify Function
         *     ↓
         * Gemini API
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

                    body:
                        JSON.stringify({

                            messages:
                                conversation

                        })

                }
            );


        const data =
            await response.json();


        /* Remove thinking */

        loading.remove();


        /* Server error */

        if (!response.ok) {

            throw new Error(

                data.error ||
                "AI service error"

            );

        }


        /* AI response */

        addMessage(
            "ai",
            data.reply
        );


        /* Save AI response */

        conversation.push({

            role: "assistant",

            content: data.reply

        });


    } catch (error) {


        /* Remove thinking */

        loading.remove();


        /* Error message */

        addMessage(

            "ai",

            "❌ " +
            error.message

        );


        console.error(
            "EmbedAI Error:",
            error
        );

    }


    /* Enable send */

    sendBtn.disabled = false;

    messageInput.focus();

}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(
    type,
    text
) {


    const message =
        document.createElement(
            "div"
        );


    message.className =
        `message ${type}`;


    /* Avatar */

    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "avatar";


    avatar.textContent =
        type === "ai"
            ? "🤖"
            : "👤";


    /* Content */

    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    content.innerHTML =
        formatResponse(text);


    /* Append */

    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );


    /* Add to chat */

    chatContainer.appendChild(
        message
    );


    /* Scroll */

    chatContainer.scrollTop =
        chatContainer.scrollHeight;


    return message;

}


/* =====================================================
   FORMAT RESPONSE
===================================================== */

function formatResponse(text) {


    /* Escape HTML */

    text =
        escapeHTML(text);


    /* Code blocks */

    text =
        text.replace(

            /```(?:[\w+#.-]+)?\n?([\s\S]*?)```/g,

            '<pre class="code-block">$1</pre>'

        );


    /* Bold */

    text =
        text.replace(

            /\*\*(.*?)\*\*/g,

            "<strong>$1</strong>"

        );


    /* New lines */

    text =
        text.replace(
            /\n/g,
            "<br>"
        );


    return text;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   ENTER KEY
===================================================== */

messageInput.addEventListener(

    "keydown",

    function(event) {


        /*
         * Enter = Send
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


/* =====================================================
   AUTO RESIZE
===================================================== */

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


/* =====================================================
   SEND BUTTON
===================================================== */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =====================================================
   NEW CHAT
===================================================== */

newChatBtn.addEventListener(

    "click",

    function() {

        conversation = [];

        closeSidebar();

        location.reload();

    }

);


/* =====================================================
   SUGGESTION BUTTONS
===================================================== */

document
    .querySelectorAll(".suggestion")
    .forEach(

        button => {

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

        }

    );