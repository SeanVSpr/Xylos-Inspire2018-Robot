Operating a Lego Mindstorms robot using Tensorflow for Javascript (Xylos Inspire 2018 demonstration), as described in the blog.

posenet-app/Camera.js contains the main code for extracting body positions. Use browserify to generate bundle.js, which is imported in index.html. 

- browserify camera.js -o bundle.js

A connection must be set up between the app and the robot. The javascript application extracts the body positions and forwards them to the robot with a REST API (use the ROBOT_URL constant in index.html).

Operating can be done by the pose detector as described in the blog. When control is set to manual, the robot is controlled manually with the keyboard arrows keys or by clicking and holding the arrow buttons. 

