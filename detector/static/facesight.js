const video = document.getElementById("video");
const aiStatus = document.getElementById("ai-status");


console.log("APP JS LOADED");
console.log("FACE API:", faceapi);



let modelsLoaded = false;



// ===============================
// CSRF TOKEN
// ===============================

function getCookie(name) {

    let cookieValue = null;


    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");


        for (let cookie of cookies) {

            cookie = cookie.trim();


            if (cookie.startsWith(name + "=")) {

                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;

            }

        }

    }


    return cookieValue;

}



// ===============================
// LOAD AI MODELS
// ===============================

async function loadModels(){


    console.log("START LOADING MODELS");


    if(aiStatus){

        aiStatus.innerHTML =
        "🔴 Loading AI Models...";

    }


    try {


        await faceapi.nets.tinyFaceDetector.loadFromUri(
            "/static/models"
        );


        console.log("FACE DETECTOR READY");



        await faceapi.nets.faceExpressionNet.loadFromUri(
            "/static/models"
        );


        console.log("EMOTION READY");



        await faceapi.nets.ageGenderNet.loadFromUri(
            "/static/models"
        );


        console.log("AGE READY");



        modelsLoaded = true;



        console.log(
            "ALL AI MODELS LOADED"
        );



        if(aiStatus){

            aiStatus.innerHTML =
            "🟢 AI Ready - Upload Image";

        }


    }


    catch(error){


        console.error(
            "MODEL LOADING ERROR:",
            error
        );



        if(aiStatus){

            aiStatus.innerHTML =
            "🔴 AI Model Loading Failed";

        }


    }


}



loadModels();

// ===============================
// SAVE RESULT TO DATABASE
// ===============================

function saveAnalysis(age, gender, emotion){


    fetch("/save-analysis/", {


        method:"POST",


        headers:{


            "Content-Type":"application/json",


            "X-CSRFToken": getCookie("csrftoken")


        },


        body:JSON.stringify({


            age: age,


            gender: gender,


            emotion: emotion


        })


    })


    .then(response => response.json())


    .then(data => {


        console.log(
            "DATABASE SAVED:",
            data
        );


    })


    .catch(error => {


        console.error(
            "SAVE ERROR:",
            error
        );


    });


}




// ===============================
// START CAMERA
// ===============================

function startCamera(){


    console.log("Camera button clicked");



    if(!modelsLoaded){


        alert(
            "AI models are still loading. Please wait."
        );


        return;

    }




    navigator.mediaDevices.getUserMedia({

        video:true

    })



    .then(stream=>{


        console.log(
            "Camera started"
        );



        video.srcObject = stream;



        document.getElementById(
            "camera-status"
        ).innerHTML =
        "🟢 Active";



        detectFaces();



    })



    .catch(error=>{


        console.error(
            "Camera error:",
            error
        );


        document.getElementById(
            "camera-status"
        ).innerHTML =
        "🔴 No Camera";


    });


}





// ===============================
// LIVE CAMERA DETECTION
// ===============================

async function detectFaces(){


    console.log(
        "Starting detection"
    );


    setInterval(async()=>{


        if(video.readyState !== 4){

            return;

        }



        try{


            const detections = await faceapi
            .detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withAgeAndGender()
            .withFaceExpressions();



            updateResults(detections);



        }


        catch(error){


            console.error(
                "Detection error:",
                error
            );


        }


    },1000);


}




// ===============================
// UPDATE RESULTS
// ===============================

function updateResults(detections){


    document.getElementById("faces").innerHTML =
    detections.length;



    if(detections.length > 0){


        const face = detections[0];



        const age =
        Math.round(face.age);



        const gender =
        face.gender;



        const emotion =
        Object.entries(face.expressions)
        .sort((a,b)=>b[1]-a[1])[0][0];



        document.getElementById("age").innerHTML =
        age;



        document.getElementById("gender").innerHTML =
        gender;



       document.getElementById("emotion").innerText =
    formatEmotion(emotion);



    }


    else{


        document.getElementById("age").innerHTML =
        "--";


        document.getElementById("gender").innerHTML =
        "--";


        document.getElementById("emotion").innerHTML =
        "--";


    }


}





// ===============================
// IMAGE UPLOAD ANALYSIS
// ===============================

const imageUpload =
document.getElementById("imageUpload");


const previewImage =
document.getElementById("preview-image");



if(imageUpload){


imageUpload.addEventListener(
"change",
function(){


    console.log(
        "IMAGE SELECTED"
    );



    const file = this.files[0];



    if(!file){

        return;

    }



    const reader = new FileReader();



    reader.onload = function(event){


        previewImage.src =
        event.target.result;



        previewImage.style.display =
        "block";



        previewImage.onload =
        async function(){



            if(!modelsLoaded){


                alert(
                    "AI models still loading"
                );


                return;

            }




            try{


                console.log(
                    "STARTING IMAGE DETECTION"
                );



                const detections =
                await faceapi
                .detectAllFaces(
                    previewImage,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize:416,
                        scoreThreshold:0.5
                    })
                )
                .withAgeAndGender()
                .withFaceExpressions();




                console.log(
                    "RESULTS:",
                    detections
                );



                updateResults(detections);




                if(detections.length > 0){


                    const face =
                    detections[0];



                    const age =
                    Math.round(face.age);



                    const gender =
                    face.gender;



                    const emotion =
                    Object.entries(face.expressions)
                    .sort((a,b)=>b[1]-a[1])[0][0];



                    saveAnalysis(
                        age,
                        gender,
                        emotion
                    );


                }



            }


            catch(error){


                console.error(
                    "IMAGE DETECTION ERROR:",
                    error
                );


            }



        };


    };



    reader.readAsDataURL(file);



});


}

function formatEmotion(emotion){

    const emotionMap = {

        happy: "😊 Happy",

        sad: "😢 Sad",

        angry: "😠 Angry",

        surprised: "😲 Surprised",

        fearful: "😨 Fearful",

        disgusted: "🤢 Disgusted",

        neutral: "😐 Neutral"

    };


    return emotionMap[emotion] || emotion;

}

function resetAnalysis(){

    // Clear uploaded image
    const preview = document.getElementById("preview-image");
    preview.src = "";
    preview.style.display = "none";


    // Reset camera status
    document.getElementById("camera-status").innerHTML = "Waiting...";


    // Reset AI results
    document.getElementById("faces").innerHTML = "0";
    document.getElementById("age").innerHTML = "--";
    document.getElementById("gender").innerHTML = "--";
    document.getElementById("emotion").innerHTML = "--";


    // Reset AI status
    document.getElementById("ai-status").innerHTML = "AI Ready - Upload Image";


    // Clear file input
    document.getElementById("imageUpload").value = "";


}