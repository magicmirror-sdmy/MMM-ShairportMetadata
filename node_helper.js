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
        console.log("MMM-ShairportMetadata helper started...");
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

        const self = this; // Store reference to the module instance
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

                    if (data.event === "Pause" || data.event === "Resume") {
                        console.log(`Shairport Metadata: Media ${data.event}`); // Log Pause/Resume
                        self.sendSocketNotification("MEDIA_STATE", data.event); // Use self instead of this
                    } else {
                        self.sendSocketNotification("DATA_BROADCAST", data); // Use self instead of this
                    }
                } catch (err) {
                    console.error("Error parsing JSON:", err);
                }
            }
        });

        this.readableStream.stdout.on('close', function () {
            self.readableStream.kill();
            self.readableStream = null;
        });
    },
});
