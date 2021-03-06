
# EV3-API


This repository contains code to interact with an EV3 program via Websockets.

The code leverages [Express](https://expressjs.com/) and Socket.io to forward incoming API calls over a websocket.

  

It has the following endpoints:

* **/speak:** POST call with a message in the body to be spoken by the robot.

* **/forward:** Performs a forward movement

* **/backward:** Performs a backward movement

* **/left:** Performs a left turn of 90°

* **/right:** Performs a right turn of 90°

* **/shoot:** Performs a shooting operation of the robot