const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "Aayushaa",
    version: "1.0",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function() {},

  onChat: async function({ event, message, api, getLang }) {
    if (event.body && event.body.toLowerCase().includes("owner")) {
      try {
        // Set reaction to the message
        api.setMessageReaction("💋", event.messageID, () => {}, true);

        // Define the Imgur video link
        const videoUrl = "https://i.imgur.com/TCuQx0p.mp4";

        // Download the video from the Imgur link
        const response = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream",
        });

        // Send the reply with the video
        return message.reply({
          body: "Hi, I am Prōxima. Developed by Miss Aāyusha Shrestha and my Second developer is Luzzixy.🤍🌌",
          attachment: response.data,
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
      }
    }
  },
};