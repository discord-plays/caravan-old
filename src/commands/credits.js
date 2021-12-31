const Discord = require("discord.js");
const { version } = require("../../package.json");

function creditsCommand(bot, replyFunc) {
  var embed = new Discord.MessageEmbed().setColor("#15d0ed").setAuthor(`Discord Plays Minesweeper (v${version})`, bot.jsonfile.logoQuestion).setTitle("Credits").addFields(bot.CREDITS);
  replyFunc.reply({ embeds: [embed], ephemeral: true });
}

function creditsMessage(bot, msg, args = []) {
  if (args.length > 0) return bot.sendInvalidOptions("credits", msg);
  creditsCommand(bot, {
    reply: (a) => {
      if (typeof a === "string") a = { content: a };
      if (!a.hasOwnProperty("allowedMentions")) a.allowedMentions = {};
      a.allowedMentions.repliedUser = false;
      return msg.reply(a);
    },
  });
}

function creditsInteraction(bot, interaction) {
  creditsCommand(bot, interaction);
}

var helpExample = ["`>credits`"];

var helpText = ["Thanks to all these people for working on the bot"];

module.exports = {
  messageCommand: creditsMessage,
  interactionCommand: creditsInteraction,
  help: helpText,
  example: helpExample,
};
