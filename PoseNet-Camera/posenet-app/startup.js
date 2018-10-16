let currentCommand = "stay";
let lastShotTime = Date.now();
let guiState = {}; // true initial value: see camera.js

// function getJSON(path) {
//     var xhr = new XMLHttpRequest();
//     xhr.open('GET', path, true);
//     xhr.responseType = 'blob';
//     xhr.onload = function(e) { 
//       if (this.status == 200) {
//           var file = new File([this.response], 'temp');
//           var fileReader = new FileReader();
//           fileReader.addEventListener('load', function(){
//                //do stuff with fileReader.result
//           });
//           fileReader.readAsText(file);
//       } 
//     }
//     xhr.send();
// }



// const ROBOT_URL = "";
// var config_reader = new FileReader();
// config_reader.onload = function(){
//     // ROBOT_URL = "http://13.81.45.162/";
//     var config_text = reader.result;
//     ROBOT_URL = JSON.parse(config_text)["command_api_url"]
// };
// config_reader.readAsText("file://config.json");

var ROBOT_URL = "";
fetch("config.json")
    .then(response => response.json())
    .then(jsonResponse => {
        ROBOT_URL = jsonResponse["command_api_url"]
    })

function setCommand(command) {
    allowed = ["stay", "forward", "backward", "right", "left"]
    if (allowed.indexOf(command) > -1) { //check if command is in list of allowed commands.

        // set command
        currentCommand = command;

        // set colors etc
        document.getElementById("commandText").innerHTML = currentCommand;
        let controlbuttons = document.getElementsByClassName("controlbutton");
        for (var i = 0, len = controlbuttons.length; i < len; i++) {
            controlbuttons[i].style.background = "white";
        }

        document.getElementById(command).style.background = "yellow";

        const Http = new XMLHttpRequest();
        const url = ROBOT_URL + command;
        console.log("posting to ",url);
        Http.open("GET", url);
        Http.send();
        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                console.log(Http.responseText);
            }
        }
    }
}
function onclickArrow(command) {
    if (guiState.input.control == "manual") {
        setCommand(command);
    }
}
function shoot() {
    const Http = new XMLHttpRequest();
    const url = ROBOT_URL + "shoot";
    Http.open("GET", url);
    Http.send();
    console.log("Attempting to shoot...")
    Http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            console.log("SHOT FIRED");
        }
    }
    lastShotTime = Date.now(); // allow max one shot per 3s

}