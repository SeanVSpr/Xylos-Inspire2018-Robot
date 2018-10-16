
/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */


const maxVideoSize = 513;
const canvasSize = 400;
const stats = new Stats();

guiState = {
  input: {
    mobileNetArchitecture: '0.75',
    outputStride: 16,
    imageScaleFactor: 0.5,
    inertia: 1,
    control: "pose",
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  output: {
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
  },
  net: null,
}

const PART_INDEX = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16
}

// The Stabilizer was created for an earlier version of the control. It stabilizes the control: the current
// command is only really changed when the detected command has changed for X consecutive frames. X = inertia
// In the current implementation, the Stabilizer is not very important. It allows to implement more advanced stabilization or other logic on the commands.
class Stabilizer {
  constructor(){
    this.command = "stay";
    this.inertia = 1;
    this.counter = {};
    }
  feedCommand(command){
    if (command == this.command) {
      this.reset();
    }
    if (this.counter[command]){
      this.counter[command] += 1;
      if (this.counter[command] > this.inertia) {
        this.command = command
        this.reset();
      }
    } else {
      this.counter[command] = 1;
    }
    return this.command;  
  }
  reset(){
    this.counter = {};
  }
}
const stabilizer = new Stabilizer();

 
// old getCommand function, based on head movement
// function getCommand(pose){
//   let leftEar = pose.keypoints[PART_INDEX.leftEar];
//   let rightEar = pose.keypoints[PART_INDEX.rightEar];
//   let leftWrist = pose.keypoints[PART_INDEX.leftWrist];
//   let rightWrist = pose.keypoints[PART_INDEX.rightWrist];

//   let anyHand = (leftWrist.score>guiState.singlePoseDetection.minPartConfidence || rightWrist.score>guiState.singlePoseDetection.minPartConfidence);
//   let bothHands = (leftWrist.score>guiState.singlePoseDetection.minPartConfidence && rightWrist.score>guiState.singlePoseDetection.minPartConfidence);
 

//   if (bothHands) {
//     return "backward"
//   }
//   if (!anyHand && leftEar.score < guiState.singlePoseDetection.minPartConfidence){
//     return "right";
//   }
//   if (!anyHand && rightEar.score < guiState.singlePoseDetection.minPartConfidence){
//     return "left";
//   }
//   if (!anyHand) {
//     return "forward";
//   }
//   return "stay";
// }

function getAngle(part1,part2) {
  let x1 = part1.position.x;
  let y1 = part1.position.y;
  let x2 = part2.position.x;
  let y2 = part2.position.y;
  let angle_rad = Math.atan2(-y2+y1,x2-x1);
  let angle_degree_abs = Math.abs(angle_rad * (180 / Math.PI));
  return angle_degree_abs;
}

function getDistance(part1,part2) {
  let x1 = part1.position.x;
  let y1 = part1.position.y;
  let x2 = part2.position.x;
  let y2 = part2.position.y;
  let distance = Math.sqrt(Math.pow(y1-y2,2)+Math.pow(x1-x2,2))
  return distance;
}

function getCommandV2(pose){

  let leftElbow = pose.keypoints[PART_INDEX.leftElbow];
  let rightElbow = pose.keypoints[PART_INDEX.rightElbow];

  let leftHand = pose.keypoints[PART_INDEX.leftWrist];
  let rightHand = pose.keypoints[PART_INDEX.rightWrist];

  let leftShoulder = pose.keypoints[PART_INDEX.leftShoulder];
  let rightShoulder = pose.keypoints[PART_INDEX.rightShoulder];

  let minConf = guiState.singlePoseDetection.minPartConfidence

  let leftHandAngle = (leftElbow.score > minConf && leftShoulder.score>minConf && getAngle(leftShoulder, leftElbow) > 30);
  let rightHandAngle = (rightElbow.score > minConf && rightShoulder.score>minConf && getAngle(rightShoulder, rightElbow) > 30);
  
  let leftHandUp = (leftHandAngle && leftElbow.position.y < leftShoulder.position.y);
  let leftHandDown = (leftHandAngle && leftElbow.position.y > leftShoulder.position.y);

  let rightHandUp = (rightHandAngle && rightElbow.position.y < rightShoulder.position.y);
  let rightHandDown = (rightHandAngle && rightElbow.position.y > rightShoulder.position.y);


  if (leftHand.score >= minConf && rightHand.score >= minConf && getDistance(leftHand, rightHand) < 
          80 && (Date.now() - lastShotTime) > 3000) {
    shoot();
  }

  // if not all relevant body parts are detected, stay
  let posedetect_flag = true;
  [leftElbow,rightElbow,leftShoulder,rightShoulder].forEach((part)=>{
    if (part.score<minConf) {
      posedetect_flag = false;
    }
  })
  if (!posedetect_flag) {
    return "stay";
  }

  if (rightHandUp && leftHandUp) {
    return "backward";
  }
  if (rightHandDown && leftHandDown) {
    return "stay";
  }
  if (rightHandUp && leftHandDown) {
    return "right";
  }
  if (rightHandDown && leftHandUp) {
    return "left";
  }
  return "forward";
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  let videoDevices = devices.filter(({kind}) => kind === 'videoinput');
  return videoDevices;
}

let currentStream = null;

function stopCurrentVideoStream() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

function loadVideo(cameraId) {
  return new Promise((resolve, reject) => {
    stopCurrentVideoStream();
    const video = document.getElementById('video');
    video.width = maxVideoSize;
    video.height = maxVideoSize;

    if (navigator.getUserMedia) {
      navigator.getUserMedia({
        video: {
          width: maxVideoSize,
          height: maxVideoSize,
          deviceId: {exact: cameraId},
        },
      }, handleVideo, videoError);
    }

    function handleVideo(stream) {
      currentStream = stream;
      video.srcObject = stream;

      resolve(video);
    }

    function videoError(e) {
      // do something
      reject(e);
    }
  });
}

function setupGui(cameras, net) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  let counter = 0
  let cameraOptions = {};
  cameras.forEach((camera) => {
    cameraOptions[counter.toString()] = camera.deviceId;
    counter += 1;
  });
  
  const gui = new dat.GUI({width: 500});
  gui.add(guiState, 'camera', cameraOptions).onChange((deviceId) => {
    loadVideo(deviceId);
  });

  let input = gui.addFolder('Input');
  const architectureController =
    input.add(guiState.input, 'mobileNetArchitecture', ['1.01', '1.00', '0.75', '0.50']);
  input.add(guiState.input, 'outputStride', [8, 16, 32]);
  input.add(guiState.input, 'imageScaleFactor').min(0.2).max(1.0);
  input.add(stabilizer, 'inertia').min(0).max(5);
  const controlInput = input.add(guiState.input, 'control', ["pose","manual"]);
  input.open();

  let single = gui.addFolder('Single Pose Detection');
  single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);
  single.open();

  
  let output = gui.addFolder('Output');
  output.add(guiState.output, 'showVideo');
  output.add(guiState.output, 'showSkeleton');
  output.add(guiState.output, 'showPoints');
  output.open();

  controlInput.onChange(function(newControl) {
    if (newControl == "manual"){
      setCommand("stay");
    }     
    stabilizer.counter = {};
  });

  architectureController.onChange(function(architecture) {
    guiState.changeToArchitecture = architecture;
  });

}

function setupFPS() {
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
}

function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');
  const flipHorizontal = true;

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  async function poseDetectionFrame() {
    if (guiState.changeToArchitecture) {
      guiState.net.dispose();

      guiState.net = await posenet.load(Number(guiState.changeToArchitecture));

      guiState.changeToArchitecture = null;
    }

    stats.begin();

    const imageScaleFactor = guiState.input.imageScaleFactor;
    const outputStride = Number(guiState.input.outputStride);

    let poses = [];
    const pose = await guiState.net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
    poses.push(pose);
    let minPoseConfidence = Number(guiState.singlePoseDetection.minPoseConfidence);
    let minPartConfidence = Number(guiState.singlePoseDetection.minPartConfidence);


    ctx.clearRect(0, 0, canvasSize, canvasSize);

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvasSize*-1, canvasSize);
      ctx.restore();
    }

    const scale = canvasSize / video.width;

    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx, scale);
        }
        if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx, scale);
        }
      }
    });

    if (guiState.input.control == "pose") {
        
        // Take the first detected pose from the list, use this one to control the robot.

        command = getCommandV2(poses[0]);
                 
        let stableCommand = stabilizer.feedCommand(command);
        if (stableCommand != currentCommand) {
          setCommand(stableCommand);
        }      
        document.getElementById("commandText").innerHTML = currentCommand;
    }
    
    stats.end();

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

async function bindPage() {

  const net = await posenet.load();

  document.getElementById('loading').style.display = 'none';
  document.getElementById('main').style.display = 'block';

  const cameras = await getCameras();

  if (cameras.length === 0) {
    alert('No webcams available.  Reload the page when a webcam is available.');
    return;
  }

  const video = await loadVideo(cameras[0].deviceId);

  setupGui(cameras, net);
  setupFPS();
  detectPoseInRealTime(video, net);
}

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;


bindPage();
