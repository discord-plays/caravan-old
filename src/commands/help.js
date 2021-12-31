const Discord = require("discord.js");

function helpCommand(bot, guildId, replyFunc, cmd) {
  var settings = bot.getPerServerSettings(guildId);

  // if there are no args then null will be the 0th item in the array
  var embed = null;
  var arr = null;
  var exArr = [];
  if (cmd != null) {
    var commandScript = bot.findCommand(cmd);
    if (commandScript == null) throw new Error(`Error: Command \`${cmd}\` doesn't exist`);
    else if (commandScript.hasOwnProperty("help")) {
      let isHidden = commandScript.hasOwnProperty("isHidden") && commandScript.isHidden;
      let onlyDebug = commandScript.hasOwnProperty("debugOnly") && commandScript.debugOnly;

      if (isHidden || (!bot.DEBUG && onlyDebug)) throw new Error(`Error: Command \`${cmd}\` doesn't exist`);

      arr = commandScript.help;
      if (commandScript.hasOwnProperty("example")) {
        exArr = commandScript.example.map((x) => x.replace(/^`>/, `\`${settings.prefix}`));
      }
    }
  }
  embed = new Discord.MessageEmbed()
    .setColor("#15d0ed")
    .setAuthor("Minesweeper!", bot.jsonfile.logoQuestion)
    .setTitle(arr == null ? "General help" : "Help: " + cmd)
    .setDescription(arr == null ? generateGeneralHelpText(bot, guildId).join("\n") : arr.join("\n"));
  if (exArr.length != 0) embed.addField(`Example${exArr.length == 1 ? "" : "s"}`, exArr.join("\n"));
  replyFunc.reply({ embeds: [embed], ephemeral: true });
}

function generateGeneralHelpText(bot, guildId) {
  var settings = bot.getPerServerSettings(guildId);
  var commandNames = bot.getAllCommands();
  var commandDetails = [];
  for (var i = 0; i < commandNames.length; i++) {
    var comm = bot.findCommand(commandNames[i]);
    if (!comm.hasOwnProperty("help")) continue;
    let isHidden = comm.hasOwnProperty("isHidden") && comm.isHidden;
    let onlyDebug = comm.hasOwnProperty("debugOnly") && comm.debugOnly;
    if (isHidden || (!bot.DEBUG && onlyDebug)) continue;
    commandDetails.push(`\`${settings.prefix}help ${commandNames[i]}\` -${onlyDebug ? " (DEBUG)" : ""} ${bot.findCommand(commandNames[i]).help}`);
  }
  return commandDetails;
}

function helpMessage(bot, msg, args = []) {
  if (args.length > 1) return bot.sendInvalidOptions("help", msg);
  [guildId, channelId] = [msg.guild == null ? "dm" : msg.guild.id, msg.channel.id];
  helpCommand(
    bot,
    guildId,
    {
      reply: (a) => {
        if (typeof a === "string") a = { content: a };
        if (!a.hasOwnProperty("allowedMentions")) a.allowedMentions = {};
        a.allowedMentions.repliedUser = false;
        return msg.reply(a);
      },
    },
    args.length == 1 ? args[0] : null
  );
}

function helpInteraction(bot, interaction) {
  [guildId, channelId] = [interaction.guild == null ? "dm" : interaction.guild.id, interaction.channel.id];
  let cmd = interaction.options.getString("command");
  helpCommand(bot, guildId, interaction, cmd);
}

var helpExample = ["`>help`", "`>help <command>`", "`>help start`", "`>help settings`"];
var helpText = ['"Help Help! Help Help! Over Here! Thank you very much!"'];
var helpOptions = [
  {
    name: "command",
    type: "STRING",
    description: "The command get help with",
  },
];

module.exports = {
  messageCommand: helpMessage,
  interactionCommand: helpInteraction,
  help: helpText,
  example: helpExample,
  options: helpOptions,
};
