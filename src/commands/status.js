const Discord = require("discord.js");

function statusCommand(bot, replyFunc) {
  let active = bot.getRunningGames();
  let guildCache = bot.client.guilds.cache;
  let guilds = guildCache.size;
  let lines = [`I am in ${guilds} server${guilds == 1 ? "" : "s"}, playing ${active} game${active == 1 ? "" : "s"}.`];
  replyFunc.reply({ embeds: [new Discord.MessageEmbed().setColor("#007766").setAuthor("Discord Plays Caravan", bot.jsonfile.logoGame).setDescription(lines.join("\n"))], ephemeral: true }).catch((reason) => {
    console.error(reason);
  });
  if (bot.DEBUG) console.log("Guild names:\n" + guildCache.map((x) => ` - ${x.name}`).join("\n"));
}

function statusMessage(bot, msg, args = []) {
  if (args.length > 0) return bot.sendInvalidOptions("status", msg);
  statusCommand(bot, {
    reply: (a) => {
      if (typeof a === "string") a = { content: a };
      if (!a.hasOwnProperty("allowedMentions")) a.allowedMentions = {};
      a.allowedMentions.repliedUser = false;
      return msg.reply(a);
    },
  });
}

function statusInteraction(bot, interaction) {
  statusCommand(bot, interaction);
}

var helpExample = ["`>status`"];

var helpText = ["Get bot status"];

module.exports = {
  messageCommand: statusMessage,
  interactionCommand: statusInteraction,
  help: helpText,
  example: helpExample,
};
