/* =========================================
   MEDIAPIPE
========================================= */

import {
    FaceDetector,
    FilesetResolver
} from "@mediapipe/tasks-vision";

/* =========================================
   ELEMENTS
========================================= */

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const sidebar =
    document.querySelector(".sidebar");

const startCameraBtn =
    document.getElementById("startCameraBtn");

const openDoorBtn =
    document.getElementById("openDoorBtn");

const lockDoorBtn =
    document.getElementById("lockDoorBtn");

const connectDeviceBtn =
    document.getElementById("connectDeviceBtn");

const registerFaceBtn =
    document.getElementById("registerFaceBtn");

const clearLogBtn =
    document.getElementById("clearLogBtn");

const setupBtn =
    document.getElementById("setupBtn");

const activityLog =
    document.getElementById("activityLog");

const cameraVideo =
    document.getElementById("cameraVideo");

const faceCanvas =
    document.getElementById("faceCanvas");

const cameraBox =
    document.getElementById("cameraBox");

const cameraPlaceholder =
    document.getElementById(
        "cameraPlaceholder"
    );


/* =========================================
   STATE
========================================= */

let cameraConnected = false;

let espConnected = false;

let doorOpen = false;

let registeredFaces = 0;

let cameraStream = null;

let faceDetectionRunning = false;

let detectionLoopRunning = false;

let faceDetector = null;

let lastVideoTime = -1;


/* =========================================
   MEDIAPIPE MODEL
========================================= */

const MEDIAPIPE_WASM_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";


const FACE_MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";


/* =========================================
   MOBILE MENU
========================================= */

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );

        }
    );

}


/* =========================================
   SIDEBAR NAVIGATION
========================================= */

document
    .querySelectorAll(".side-action")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const targetId =
                    button.dataset.scroll;


                const target =
                    document.getElementById(
                        targetId
                    );


                if (target) {

                    target.scrollIntoView({

                        behavior: "smooth",

                        block: "start"

                    });

                }


                if (sidebar) {

                    sidebar.classList.remove(
                        "active"
                    );

                }

            }
        );

    });


/* =========================================
   CAMERA BUTTON
========================================= */

if (startCameraBtn) {

    startCameraBtn.addEventListener(
        "click",
        startCamera
    );

}


/* =========================================
   START CAMERA
========================================= */

async function startCamera() {

    try {

        /*
         * Prevent duplicate camera streams
         */

        if (cameraConnected) {

            return;

        }


        /*
         * Check browser camera support
         */

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera access is not supported by this browser."
            );

        }


        /*
         * Request camera permission
         */

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode: "user",

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }

                },

                audio: false

            });


        /*
         * Connect stream to video
         */

        if (!cameraVideo) {

            throw new Error(
                "cameraVideo element not found in HTML."
            );

        }


        cameraVideo.srcObject =
            cameraStream;


        await cameraVideo.play();


        /*
         * Camera connected
         */

        cameraConnected = true;


        /*
         * Update camera status
         */

        const cameraStatus =
            document.getElementById(
                "cameraStatus"
            );


        const indicator =
            document.getElementById(
                "cameraIndicator"
            );


        if (cameraStatus) {

            cameraStatus.textContent =
                "Connected";

        }


        if (indicator) {

            indicator.textContent =
                "Online";

            indicator.classList.remove(
                "offline"
            );

        }


        /*
         * Show live camera
         */

        if (cameraBox) {

            cameraBox.classList.add(
                "camera-active"
            );

        }


        /*
         * Wait until video dimensions
         * are available
         */

        if (
            cameraVideo.readyState >= 2
        ) {

            setupFaceCanvas();

        } else {

            cameraVideo.addEventListener(
                "loadedmetadata",
                setupFaceCanvas,
                {
                    once: true
                }
            );

        }


        /*
         * Activity log
         */

        addLog(
            "Camera connected successfully",
            "success"
        );


        /*
         * Start MediaPipe
         */

        await startFaceDetection();


    } catch (error) {

        console.error(
            "Camera Error:",
            error
        );


        /*
         * Clean failed stream
         */

        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

            cameraStream = null;

        }


        cameraConnected = false;


        alert(
            "Unable to access camera.\n\n" +
            error.message
        );


        addLog(
            "Camera access failed",
            "system"
        );

    }

}


/* =========================================
   SET CANVAS SIZE
========================================= */

function setupFaceCanvas() {

    if (
        !cameraVideo ||
        !faceCanvas
    ) {

        return;

    }


    const width =
        cameraVideo.videoWidth;


    const height =
        cameraVideo.videoHeight;


    if (
        width > 0 &&
        height > 0
    ) {

        faceCanvas.width =
            width;

        faceCanvas.height =
            height;

    }

}


/* =========================================
   STOP CAMERA
========================================= */

function stopCamera() {

    /*
     * Stop detection loop
     */

    detectionLoopRunning =
        false;

    faceDetectionRunning =
        false;


    /*
     * Stop camera tracks
     */

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        cameraStream = null;

    }


    /*
     * Remove video stream
     */

    if (cameraVideo) {

        cameraVideo.srcObject =
            null;

    }


    /*
     * Update state
     */

    cameraConnected =
        false;


    /*
     * Update camera status
     */

    const cameraStatus =
        document.getElementById(
            "cameraStatus"
        );


    const indicator =
        document.getElementById(
            "cameraIndicator"
        );


    if (cameraStatus) {

        cameraStatus.textContent =
            "Not Connected";

    }


    if (indicator) {

        indicator.textContent =
            "Offline";

        indicator.classList.add(
            "offline"
        );

    }


    /*
     * Hide live camera
     */

    if (cameraBox) {

        cameraBox.classList.remove(
            "camera-active"
        );

    }


    /*
     * Clear face canvas
     */

    if (faceCanvas) {

        const ctx =
            faceCanvas.getContext("2d");


        if (ctx) {

            ctx.clearRect(

                0,

                0,

                faceCanvas.width,

                faceCanvas.height

            );

        }

    }


    /*
     * Reset recognition display
     */

    updateRecognitionStatus(
        0
    );


    addLog(
        "Camera disconnected",
        "system"
    );

}


/* =========================================
   MEDIA PIPE FACE DETECTOR
========================================= */

async function startFaceDetection() {

    if (!cameraConnected) {

        return;

    }


    try {

        /*
         * Prevent duplicate detector
         */

        if (faceDetector) {

            detectionLoopRunning =
                true;

            faceDetectionRunning =
                true;

            detectFaces();

            return;

        }


        console.log(
            "Loading MediaPipe Face Detector..."
        );


        /*
         * Load MediaPipe WASM
         */

        const vision =
            await FilesetResolver.forVisionTasks(
                MEDIAPIPE_WASM_URL
            );


        /*
         * Create Face Detector
         */

        faceDetector =
            await FaceDetector.createFromOptions(
                vision,
                {

                    baseOptions: {

                        modelAssetPath:
                            FACE_MODEL_URL,

                        delegate:
                            "CPU"

                    },


                    runningMode:
                        "VIDEO",


                    minDetectionConfidence:
                        0.5

                }
            );


        console.log(
            "MediaPipe Face Detector loaded."
        );


        faceDetectionRunning =
            true;

        detectionLoopRunning =
            true;


        addLog(
            "AI face detection engine ready",
            "success"
        );


        /*
         * Start real-time detection
         */

        detectFaces();


    } catch (error) {

        console.error(
            "Face Detector Error:",
            error
        );


        faceDetectionRunning =
            false;

        detectionLoopRunning =
            false;


        addLog(
            "Face detection engine failed",
            "system"
        );


        alert(
            "Unable to load face detection model.\n\n" +
            error.message
        );

    }

}


/* =========================================
   REAL-TIME FACE DETECTION LOOP
========================================= */

async function detectFaces() {

    if (
        !faceDetector ||
        !cameraVideo ||
        !cameraConnected
    ) {

        detectionLoopRunning =
            false;

        return;

    }


    /*
     * Make sure video is ready
     */

    if (
        cameraVideo.readyState >= 2
    ) {

        /*
         * Process only new frames
         */

        if (
            cameraVideo.currentTime !==
            lastVideoTime
        ) {

            lastVideoTime =
                cameraVideo.currentTime;


            try {

                const timestamp =
                    performance.now();


                /*
                 * Detect faces
                 */

                const result =
                    faceDetector.detectForVideo(

                        cameraVideo,

                        timestamp

                    );


                /*
                 * Draw results
                 */

                drawFaceDetections(
                    result
                );


            } catch (error) {

                console.error(
                    "Face detection error:",
                    error
                );

            }

        }

    }


    /*
     * Continue detection
     */

    if (detectionLoopRunning) {

        requestAnimationFrame(
            detectFaces
        );

    }

}


/* =========================================
   DRAW FACE DETECTIONS
========================================= */

function drawFaceDetections(
    result
) {

    if (!faceCanvas) {

        return;

    }


    const ctx =
        faceCanvas.getContext(
            "2d"
        );


    if (!ctx) {

        return;

    }


    /*
     * Clear previous frame
     */

    ctx.clearRect(

        0,

        0,

        faceCanvas.width,

        faceCanvas.height

    );


    /*
     * No face
     */

    if (
        !result ||
        !result.detections ||
        result.detections.length === 0
    ) {

        updateRecognitionStatus(
            0
        );

        return;

    }


    /*
     * Draw each detected face
     */

    result.detections.forEach(
        (detection, index) => {

            const box =
                detection.boundingBox;


            if (!box) {

                return;

            }


            const x =
                box.originX;


            const y =
                box.originY;


            const width =
                box.width;


            const height =
                box.height;


            /*
             * Face rectangle
             */

            ctx.strokeStyle =
                "#5eead4";


            ctx.lineWidth =
                3;


            ctx.strokeRect(

                x,

                y,

                width,

                height

            );


            /*
             * Label background
             */

            const labelWidth =
                130;


            const labelHeight =
                28;


            const labelY =
                Math.max(
                    0,
                    y - labelHeight
                );


            ctx.fillStyle =
                "rgba(94, 234, 212, 0.95)";


            ctx.fillRect(

                x,

                labelY,

                labelWidth,

                labelHeight

            );


            /*
             * Label text
             */

            ctx.fillStyle =
                "#071312";


            ctx.font =
                "bold 13px Arial";


            ctx.fillText(

                `Face ${index + 1}`,

                x + 8,

                labelY + 18

            );

        }
    );


    /*
     * Update dashboard
     */

    updateRecognitionStatus(
        result.detections.length
    );

}


/* =========================================
   RECOGNITION STATUS
========================================= */

function updateRecognitionStatus(
    faceCount
) {

    const recognizedName =
        document.getElementById(
            "recognizedName"
        );


    const confidenceValue =
        document.getElementById(
            "confidenceValue"
        );


    /*
     * No status elements
     */

    if (
        !recognizedName ||
        !confidenceValue
    ) {

        return;

    }


    /*
     * No face
     */

    if (
        faceCount === 0
    ) {

        recognizedName.textContent =
            "No face detected";


        confidenceValue.textContent =
            "--";


        return;

    }


    /*
     * Face detected
     */

    if (
        faceCount === 1
    ) {

        recognizedName.textContent =
            "Face detected";

    } else {

        recognizedName.textContent =
            `${faceCount} faces detected`;

    }


    confidenceValue.textContent =
        "Detected";

}


/* =========================================
   DOOR CONTROL
========================================= */

if (openDoorBtn) {

    openDoorBtn.addEventListener(
        "click",
        () => {

            setDoorState(

                true,

                "Manual door open"

            );

        }
    );

}


if (lockDoorBtn) {

    lockDoorBtn.addEventListener(
        "click",
        () => {

            setDoorState(

                false,

                "Manual door lock"

            );

        }
    );

}


/* =========================================
   SET DOOR STATE
========================================= */

function setDoorState(
    isOpen,
    reason
) {

    doorOpen =
        isOpen;


    const doorStatus =
        document.getElementById(
            "doorStatus"
        );


    const doorIcon =
        document.getElementById(
            "doorIcon"
        );


    const doorText =
        document.getElementById(
            "doorText"
        );


    const accessText =
        document.getElementById(
            "accessText"
        );


    if (isOpen) {

        if (doorStatus) {

            doorStatus.textContent =
                "OPEN";

        }


        if (doorIcon) {

            doorIcon.textContent =
                "🔓";

        }


        if (doorText) {

            doorText.textContent =
                "Door Open";

        }


        if (accessText) {

            accessText.textContent =
                "Access granted.";

        }


        addLog(

            reason,

            "success"

        );

    } else {

        if (doorStatus) {

            doorStatus.textContent =
                "LOCKED";

        }


        if (doorIcon) {

            doorIcon.textContent =
                "🔒";

        }


        if (doorText) {

            doorText.textContent =
                "Door Locked";

        }


        if (accessText) {

            accessText.textContent =
                "Door is secured.";

        }


        addLog(

            reason,

            "system"

        );

    }

}


/* =========================================
   ESP32 CONNECTION
========================================= */

if (connectDeviceBtn) {

    connectDeviceBtn.addEventListener(
        "click",
        connectESP32
    );

}


/* =========================================
   CONNECT ESP32
========================================= */

function connectESP32() {

    /*
     * DEMO CONNECTION
     *
     * Real ESP32 communication will
     * be added later.
     */

    espConnected =
        true;


    const espStatus =
        document.getElementById(
            "espStatus"
        );


    const deviceId =
        document.getElementById(
            "deviceId"
        );


    const deviceBadge =
        document.getElementById(
            "deviceBadge"
        );


    if (espStatus) {

        espStatus.textContent =
            "Connected";

    }


    if (deviceId) {

        deviceId.textContent =
            "ESP32-DEMO-001";

    }


    if (deviceBadge) {

        deviceBadge.textContent =
            "Online";


        deviceBadge.classList.remove(
            "offline"
        );

    }


    if (connectDeviceBtn) {

        connectDeviceBtn.textContent =
            "ESP32 Connected";

    }


    addLog(

        "ESP32 device connected",

        "success"

    );

}


/* =========================================
   FACE REGISTRATION
========================================= */

if (registerFaceBtn) {

    registerFaceBtn.addEventListener(
        "click",
        registerFace
    );

}


/* =========================================
   REGISTER FACE
========================================= */

function registerFace() {

    const nameInput =
        document.getElementById(
            "personName"
        );


    const idInput =
        document.getElementById(
            "personId"
        );


    const name =
        nameInput
            ? nameInput.value.trim()
            : "";


    const id =
        idInput
            ? idInput.value.trim()
            : "";


    /*
     * Validate name
     */

    if (!name) {

        alert(
            "Please enter Person Name."
        );

        return;

    }


    /*
     * Validate ID
     */

    if (!id) {

        alert(
            "Please enter Person ID."
        );

        return;

    }


    /*
     * Camera required
     */

    if (!cameraConnected) {

        alert(
            "Please start the camera first."
        );

        return;

    }


    /*
     * Check if face is
     * currently detected
     */

    if (!faceDetectionRunning) {

        alert(
            "Face detection is not ready yet. Please wait."
        );

        return;

    }


    /*
     * Current stage:
     * We are only counting registration.
     *
     * Actual face embedding and
     * identity matching comes next.
     */

    registeredFaces++;


    const faceCount =
        document.getElementById(
            "faceCount"
        );


    if (faceCount) {

        faceCount.textContent =
            registeredFaces;

    }


    /*
     * Activity log
     */

    addLog(

        `${name} registered (${id})`,

        "success"

    );


    /*
     * Clear fields
     */

    if (nameInput) {

        nameInput.value =
            "";

    }


    if (idInput) {

        idInput.value =
            "";

    }


    /*
     * Confirmation
     */

    alert(

        `${name} registered successfully.`

    );

}


/* =========================================
   ACTIVITY LOG
========================================= */

function addLog(
    message,
    type
) {

    if (!activityLog) {

        return;

    }


    /*
     * Remove empty state
     */

    const empty =
        activityLog.querySelector(
            ".empty-log"
        );


    if (empty) {

        empty.remove();

    }


    /*
     * Create log item
     */

    const item =
        document.createElement(
            "div"
        );


    item.style.cssText = `

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 15px;

        padding: 12px 0;

        border-bottom:
            1px solid #202a34;

        font-size: 11px;

    `;


    /*
     * Message
     */

    const left =
        document.createElement(
            "span"
        );


    left.textContent =
        message;


    /*
     * Time

    */

    const time =
        document.createElement(
            "span"
        );


    time.textContent =
        new Date().toLocaleTimeString(

            [],

            {

                hour: "2-digit",

                minute: "2-digit"

            }

        );


    time.style.color =
        "#657384";


    /*
     * Message color
     */

    if (
        type === "success"
    ) {

        left.style.color =
            "#34d399";

    } else {

        left.style.color =
            "#8b98a8";

    }


    /*
     * Add children
     */

    item.appendChild(
        left
    );


    item.appendChild(
        time
    );


    /*
     * Add newest first
     */

    activityLog.prepend(
        item
    );

}


/* =========================================
   CLEAR ACTIVITY LOG
========================================= */

if (clearLogBtn) {

    clearLogBtn.addEventListener(
        "click",
        () => {

            activityLog.innerHTML = `

                <div class="empty-log">

                    <span>
                        📋
                    </span>

                    <p>
                        No activity yet
                    </p>

                </div>

            `;

        }
    );

}


/* =========================================
   PROJECT SETUP
========================================= */

if (setupBtn) {

    setupBtn.addEventListener(
        "click",
        () => {

            const deviceSection =
                document.getElementById(
                    "deviceSection"
                );


            if (deviceSection) {

                deviceSection.scrollIntoView({

                    behavior: "smooth",

                    block: "start"

                });

            }

        }
    );

}


/* =========================================
   INITIAL LOG
========================================= */

addLog(

    "Face Recognition Control initialized",

    "system"

);


/* =========================================
   PAGE CLEANUP
========================================= */

window.addEventListener(
    "beforeunload",
    () => {

        detectionLoopRunning =
            false;


        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(track => {

                    track.stop();

                });

        }

    }
);