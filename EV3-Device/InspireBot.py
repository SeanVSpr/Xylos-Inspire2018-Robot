#!/usr/bin/env python3
from socketIO_client_nexus import SocketIO, LoggingNamespace
from ev3dev2.sound import Sound
from ev3dev2.led import Leds
import ev3dev.ev3 as ev3
import time
import logging
import os

# Creation of the socket where it needs to listen to...
socket = SocketIO('Insert the url of your websocket server here!!!')

# Binding of all the engines and displays we will be using.
sound = Sound()
leds = Leds()
m = ev3.MediumMotor('outA')
l = ev3.LargeMotor('outB')
r = ev3.LargeMotor('outC')


def shoot():
    # you can make position negative/positive to have a the robot shoot up or down
    m.run_to_rel_pos(speed_sp=900, position_sp=1080)

def speak(text):
    m.reset()
    sound.speak(text)

# All movement actions are continuous and will overwrite eachother when a new command is called.
def moveForward():
    r.run_forever(speed_sp=400)
    l.run_forever(speed_sp=400)


def moveBackward():
    r.run_forever(speed_sp=-400)
    l.run_forever(speed_sp=-400)


def turnLeft():
    r.run_forever(speed_sp=250)
    l.run_forever(speed_sp=-250)


def turnRight():
    r.run_forever(speed_sp=-250)
    l.run_forever(speed_sp=250)

def stop():
    r.stop()
    l.stop()

def set_font(name):
    '''
    Sets the console font

    A full list of fonts can be found with `ls /usr/share/consolefonts`
    '''
    os.system('setfont ' + name)


# Binding the commandos to messages of the websocket
set_font('Lat15-Terminus24x12')
print("Ready to go!")
socket.on('connect', speak('Powered up and ready to go!'))
socket.on('forward', moveForward)
socket.on('backward', moveBackward)
socket.on('left', turnLeft)
socket.on('right', turnRight)
socket.on('shoot', shoot)
socket.on('speak',speak)
socket.on('stop',stop)
leds.set_color("LEFT", "GREEN")
leds.set_color("RIGHT", "GREEN")
socket.wait()




