# Welcome to the Installation Guide

This guide will help you set up the IoT-Railstation project, covering both hardware and software components.

## What you will need
NodeJS: https://nodejs.org/en/download \
Git: https://git-scm.com/install 


## Getting the Project
Open VSC on an empty Place and use this command in the Terminal. Make sure you have the extentions, Git and NodeJS installed.
```
git clone https://github.com/Gohst101/IoT-Railstation
```
This will fetch the latest release.

## Setting up MQTT
To Setup **MQTT** use this Guide here: [MQTT Setup](docs/setup/mqtt.md)


## Changing the Webserver Settings
Next you will need to rename the ".env_example" to ".env" and change the file like it is told in it with the comments.

## Running the Webserver for the first Time
To run the Webserver you need these npm packages: 
```
npm install dotenv ejs express express-session fs https mqtt path pem session
```

**Note:** If this fails somehow try to run this command and then retry it. If this dosnt help write an E-Mail to IoT-Railstation-Support@ghost-exe.de
```
npm init
```

To start the WebServer you need to use this command
```
npm run start
```
or
```
node backend.js
```


## More Links
- [MQTT Setup with Mosquitto (Windows only)](docs/setup/mqtt.md)
- [Hardware Setup](docs/setup/hardware.md)
- [Software Setup](docs/setup/software.md)
- [Troubleshooting](docs/setup/troubleshooting.md)
- [Docs](docs/)