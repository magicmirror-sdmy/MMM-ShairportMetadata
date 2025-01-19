/* Magic Mirror
 * Module: MMM-ShairportMetadata
 *
 * By surekap <surekap@gmail.com>
 *
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const spawn = require('child_process').spawn;

module.exports = NodeHelper.create({
    start: function () {
        // Module initialization
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.getData();
        }
    },

    getData: function () {
        if (this.readableStream && this.readableStream !== null) {
            return; // Prevent multiple processes
        }

        const self = this;
        self.str_payload = "";

        this.readableStream = spawn(__dirname + "/shairport-metadata.sh", [this.config.metadataPipe, __dirname]);

        this.readableStream.stderr.on('data', function () {
            // Handle stderr if necessary
        });

        this.readableStream.on('error', function () {
            // Handle errors in the readable stream
        });

        this.readableStream.stdout.on('data', function (payload) {
            self.str_payload += payload.toString();
            const lines = self.str_payload.split('\n');
            self.str_payload = lines.pop();

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].length === 0) continue;

                try {
                    const data = JSON.parse(lines[i]);

                    // Handle Pause and Resume and prgr

                    if (data.type === "ssnc" && data.code === "prgr") {
                        console.log("Raw PRGR Data Received: " + data.value);
                        self.sendSocketNotification("PRGR", data.value); // Send the raw hexadecimal string
                    }

                    if (data.type === "ssnc" && data.code === "paus") {
                        console.log("Media Paused");
                        self.sendSocketNotification("PAUSE", {});
                    }

                    if (data.type === "ssnc" && data.code === "prsm") {
                        console.log("Media Resumed");
                        self.sendSocketNotification("RESUME", {});
                    }

                    self.sendSocketNotification("DATA_BROADCAST", data);
                } catch (err) {
                    // Handle JSON parse errors
                }
            }
        });

        this.readableStream.stdout.on('close', function () {
            self.readableStream.kill();
            self.readableStream = null;
        });
    },
});
