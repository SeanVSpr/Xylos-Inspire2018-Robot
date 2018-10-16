
let timerState = "off" // off (time = 0), running (time = counting up), done (time = ?)
let intervalTimer;
function toggleTimer(){
  if (timerState == "off"){
    timerState = "running";
    intervalTimer = setInterval( () => {
      console.log(timerState);
      // increment counter by one
      let c = parseInt(document.getElementById("seconds").innerHTML);     
      c += 1;
      document.getElementById("seconds").innerHTML  = c;    
    },1000);
  } else if (timerState=="running") {
    timerState = "done";
    document.getElementById("seconds").style.color = "green";
    clearInterval(intervalTimer);
  } else if (timerState="done") {
    timerState = "off"
    document.getElementById("seconds").innerHTML = "0";
    document.getElementById("seconds").style.color = "black";
  }
}

let keydown = false;
window.onload = function () {
  document.onkeydown = function (e) {
    // 'play' button on pointer alternates between 116 and 27 keycode event
    if (((e.keycode || e.which) == 116) || ((e.keycode || e.which) == 27)) {
      shoot()
      e.preventDefault();
    }
    // press 'X' to toggle timer
    if ((e.keycode || e.which) == 88) {
      toggleTimer();
    }
    if (keydown) {
      return;
    }
    if (guiState.input.control == "manual") {
      if ((e.keycode || e.which) == 32) {
        shoot();
        keydown = true;
      } else if ((e.keycode || e.which) == 37) {
        setCommand("left");
        keydown = true;
      } else if ((e.keycode || e.which) == 38) {
        setCommand("forward");
        keydown = true;
      } else if ((e.keycode || e.which) == 39) {
        setCommand("right");
        keydown = true;
      } else if ((e.keycode || e.which) == 40) {
        setCommand("backward");
        keydown = true;
      }
    }
  }
  document.onkeyup = function (e) {
    // 'play' button on pointer alternates between 116 and 27 keycode event
    if (((e.keycode || e.which) == 116) || ((e.keycode || e.which) == 27)) {
      keydown = false;
      e.preventDefault();

    }
    if (guiState.input.control == "manual") {
      if ((e.keycode || e.which) == 37 || (e.keycode || e.which) == 38 || (e.keycode || e.which) == 39 || (e.keycode || e.which) == 40) {
        setCommand("stay");
        keydown = false;
      }
    }
  }
} 