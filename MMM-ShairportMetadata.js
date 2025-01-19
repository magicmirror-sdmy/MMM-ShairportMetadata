/* global Log, Module */
/* Magic Mirror
 * Module: MMM-ShairportMetadata
 *
 * By Prateek Sureka <surekap@gmail.com>
 * MIT Licensed.
 */

Module.register("MMM-ShairportMetadata", {

    defaults: {
        metadataPipe: "/tmp/shairport-sync-metadata",
        alignment: "center"
    },

    start: function () {
        this.data.header = "";
        this.albumart = null;
        this.metadata = {};

        this.sendSocketNotification('CONFIG', this.config);

        setInterval(() => {
            this.updateDom(1000);
        }, 1000);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'PAUSE') {
            Log.info("Global Notification: Media Paused");
            this.sendNotification("PAUSE");
        }
        if (notification === 'RESUME') {
            Log.info("Global Notification: Media Resumed");
            this.sendNotification("RESUME");
        }
        if (notification === 'DATA_BROADCAST') {
            this.sendNotification("DATA_BROADCAST", payload);
            Log.info("MMM-ShairportMetadata sent DATA_BROADCAST notification");

            if (payload.hasOwnProperty('image')) {
                this.albumart = payload['image'];
                this.animateLeftToRight();
            } else {
                this.metadata = payload;
            }
            this.updateDom(1000);
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = this.config.classes ? this.config.classes : "small";
        const alignment = (this.config.alignment === "left") ? "left" : ((this.config.alignment === "right") ? "right" : "center");
        wrapper.setAttribute("style", "text-align:" + alignment + ";");

        if (!this.metadata || (Object.keys(this.metadata).length === 0)) {
            wrapper.setAttribute("style", "display:none;");
            return wrapper;
        }

        const metadata = document.createElement("div");
        const img = document.createElement("img");
        if (this.albumart) {
            img.setAttribute('src', this.albumart);
            img.setAttribute('style', "width:280px;height:320px;");
            img.className = 'albumart pulse-animation';
        } else {
            img.className = 'albumart';
        }
        metadata.appendChild(img);

        const titletag = document.createElement("div");
        titletag.innerHTML = (this.metadata['Title']) ? this.metadata['Title'] : "";
        titletag.className = "bright album-title pulse-animation";
        metadata.appendChild(titletag);

        wrapper.appendChild(metadata);
        return wrapper;
    },

    animateLeftToRight: function () {
        const metadataElement = document.querySelector(".MMM-ShairportMetadata .albumart");
        if (!metadataElement) return;

        metadataElement.style.animation = "leftToRight 10s linear";
        setTimeout(() => {
            metadataElement.style.animation = "";
        }, 10000);
    },

    getStyles: function () {
        return ["MMM-ShairportMetadata.css"];
    },
});
