# MQTT Setup with Mosquitto (Windows only)

This guide explains how to set up MQTT on a **Windows System** for the IoT-Railstation project.


## What is MQTT?
MQTT (Message Queuing Telemetry Transport) is a lightweight messaging protocol widely used in IoT.  
It allows devices like **ESP32 microcontrollers** to communicate with a central broker using a **publish/subscribe** model.


## What You Need

- Windows 10 or 11  
- Internet connection (2.4 GHz Wi-Fi for ESP32 connection)  
- Basic PC knowledge  

---

## Installing Mosquitto on Windows

1. Go to [https://mosquitto.org/download](https://mosquitto.org/download) and download the **latest Windows version** of Mosquitto.  

2. Run the installer. After installation, locate the Mosquitto folder, usually:  
   ```
   C:\Program Files\Mosquitto
   ```

3. Open **Notepad as Administrator** (you need admin rights for this).  
   Open the file **mosquitto.conf** in the Mosquitto folder.

4. Find the line that says `#listener` and replace it with:  
   ```
   listener 1883 0.0.0.0
   ```  
   This enables the MQTT listener on port 1883 for all devices.  
   **Save the file.**

5. Open **Command Prompt as Administrator**.  
   Navigate to the Mosquitto folder and start the service:  
   ```
   net start mosquitto
   ```  
   To stop the service:  
   ```
   net stop mosquitto
   ```

---

## Adding Authentication for MQTT

1. Open **Command Prompt as Administrator**.  
2. Go to the Mosquitto installation folder.  
3. Run the following command to create a user:  
   ```
   mosquitto_passwd -c pwfile myuser
   ```  
   You will be prompted to enter a password.  

4. This creates a user account with the username **myuser** and your chosen password.  

5. Open **mosquitto.conf** again and set the password file by replacing the line:  
   ```
   #password_file
   ```  
   with:  
   ```
   password_file C:/path/to/mosquitto/pwfile
   ```  
   Save the file.  

6. Restart Mosquitto to apply the changes:  
   ```
   net stop mosquitto
   net start mosquitto
   ```

## Things to connect later
- IP Address from the Broker
- 2,4GHz Wlan

## Trouble Shooting

Run Mosquitto Debug Mode
   ```
   mosquitto -v -c "C:\Program Files\Mosquitto\mosquitto.conf"
   ```

### Errors I have run into
Esp32 cannot connect to the Broker -> Make sure your using 2.4GHz Wlan, that your Profile is set to "Private Network" in the "Settings/Network and Internet/Wlan/yourWlan"