const Discord = require("discord.js");

function inviteCommand(bot, replyFunc) {
  let invite = bot.client.generateInvite({
    scopes: ["bot"],
    permissions: [Discord.Permissions.FLAGS.VIEW_CHANNEL, Discord.Permissions.FLAGS.SEND_MESSAGES, Discord.Permissions.FLAGS.ATTACH_FILES, Discord.Permissions.FLAGS.EMBED_LINKS, Discord.Permissions.FLAGS.USE_EXTERNAL_EMOJIS, Discord.Permissions.FLAGS.USE_APPLICATION_COMMANDS],
  });
  let embed = new Discord.MessageEmbed().setColor("#15d0ed").setAuthor("Minesweeper!", bot.jsonfile.logoQuestion).setTitle("Invite").setDescription("Click on the button below to invite the Discord Plays Minesweeper bot to one of your servers.");
  var row = new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setLabel(`Invite @${bot.client.user.tag}`).setStyle("LINK").setURL(invite.toString()));
  replyFunc.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

function inviteMessage(bot, msg, args = []) {
  if (args.length > 0) return bot.sendInvalidOptions("invite", msg);
  inviteCommand(bot, {
    reply: (a) => {
      if (typeof a === "string") a = { content: a };
      if (!a.hasOwnProperty("allowedMentions")) a.allowedMentions = {};
      a.allowedMentions.repliedUser = false;
      return msg.reply(a);
    },
  });
}

function inviteInteraction(bot, interaction) {
  inviteCommand(bot, interaction);
}

var helpExample = ["`>invite`"];

var helpText = ["Shows the invite link"];

module.exports = {
  messageCommand: inviteMessage,
  interactionCommand: inviteInteraction,
  help: helpText,
  example: helpExample,
};
