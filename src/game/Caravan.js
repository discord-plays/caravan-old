const Discord = require("discord.js");
const CommandsList = require("./CommandsList");
const path = require("path");
const fs = require("fs");

const defaultGuildSettings = {
  prefix: ">",
};

class CaravanBot {
  constructor(client, options) {
    this.starttime = new Date();
    this.client = client;
    this.timerCheckId = 0;

    var $t = this;
    var k = Object.keys(options);
    for (var i = 0; i < k.length; i++) $t[k[i]] = options[k[i]];

    this.__commandslist = new CommandsList(this.basedir);
    let loadingCommands = this.__commandslist.load().then(() => {
      console.log("Loaded commands list");
      $t.loadedcommands++;
    });

    this.__boards = {};

    this.loadedresources = 0;

    Promise.all([loadingCommands]).then((x) => {
      $t.start();
    });
  }

  updateStatus(isReloading = false) {
    var $t = this;
    $t.client.user.setPresence({
      activities: [
        {
          name: $t.updateActivityVariables(isReloading ? $t.jsonfile.status.reloading : $t.jsonfile.status.activity),
          type: $t.jsonfile.status.presence.toUpperCase(),
        },
      ],
      status: isReloading ? "dnd" : "online",
    });
  }

  updateActivityVariables(act) {
    var $t = this;
    var active = $t.getRunningGames();
    act = act.replace("{{total-games}}", active);
    act = act.replace("{{label-games}}", active == 1 ? "game" : "games");
    act = act.replace("{{sad-emoji}}", active == 0 ? "😦" : "");
    return act;
  }

  getBoard(id) {
    if (this.isBoard(id)) return this.__boards[id];
    else return null;
  }

  isBoard(id) {
    return Object.keys(this.__boards).includes(id);
  }

  generateTip() {
    return randomarrayitem(this.TIPS).text;
  }

  getRunningGames() {
    var $t = this;
    return Object.keys($t.__boards).length;
  }

  getAllCommands() {
    return this.__commandslist.commands.map((x) => this.__commandslist.getCommandName(x));
  }

  findCommand(primaryCommand) {
    let cmd = this.__commandslist.find(primaryCommand);
    if (cmd !== null) {
      var commandScript = require(cmd);
      return commandScript;
    }
    return null;
  }

  sendInvalidOptions(command, msg) {
    var settings = this.getPerServerSettings(msg.guild == null ? "dm" : msg.guild.id);
    this.processReceivedError(new Error(`Error: Invalid options. Use \`${settings.prefix}help ${command}\` for help.`), msg);
  }

  // Provide the boards a constant update for time based events like a timer running out
  timerChecker() {
    let $t = this;
    for (const item in $t.__boards) {
      $t.__boards[item].timerCheck();
    }
  }

  // Start the Caravan handler
  start() {
    console.log("I think the bot is starting");
    this.updateStatus(true);
    require("dotenv").config();

    let $t = this;
    this.timerCheckId = setInterval(function () {
      $t.timerChecker($t);
    }, this.jsonfile.timerCheckInterval);

    this.load().then((x) => {
      Promise.allSettled(x.map((y) => $t.loadASingleBoard($t, y))).then((results) => {
        results.forEach((result, num) => {
          if (result.status == "fulfilled") {
            console.log(`Reloaded the game: ${x[num]}`);
          } else if (result.status == "rejected") {
            console.error(`Failed to load the game ${x[num]} due to:`);
            console.error(result.reason);
          }
        });
        $t.updateStatus();
      });
    });
  }

  // Clean up this class
  end() {
    let $t = this;
    if ($t.timerCheckId != 0) clearInterval($t.timerCheckId);
  }

  load() {
    return new Promise((resolve, reject) => {
      resolve([]);
    });
  }

  findCommand(primaryCommand) {
    let cmd = this.__commandslist.find(primaryCommand);
    if (cmd !== null) {
      var commandScript = require(cmd);
      return commandScript;
    }
    return null;
  }

  processMessageCommand(receivedMessage, config) {
    var that = this;
    try {
      let fullCommand = receivedMessage.content.substr(config.prefix.length); // Remove the leading prefix characters
      let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
      let primaryCommand = splitCommand[0].toLowerCase(); // The first word directly after the exclamation is the command
      let args = splitCommand.slice(1); // All other words are arguments/parameters/options for the command
      let commandScript = that.findCommand(primaryCommand);
      if (commandScript != null) {
        if (commandScript.hasOwnProperty("messageCommand")) return commandScript.messageCommand(that, receivedMessage, args);
      } else throw new Error(`Error: Unknown command. Use \`${config.prefix}help\` for help.`);
    } catch (err) {
      // Process the error
      if (that.processReceivedError(err, receivedMessage)) {
        // Swap hadError flag
        let [guildId, channelId] = [receivedMessage.guild == null ? "dm" : receivedMessage.guild.id, receivedMessage.channel.id];
        let boardId = `${guildId}-${guildId == "dm" ? receivedMessage.author.id : channelId}`;
        if (that.isBoard(boardId)) that.getBoard(boardId).hadError = true;
      }
    }
  }

  processInteractionCommand(receivedInteraction, config) {
    var that = this;
    try {
      let commandScript = that.findCommand(receivedInteraction.commandName);
      if (commandScript != null) {
        if (commandScript.hasOwnProperty("interactionCommand")) return commandScript.interactionCommand(that, receivedInteraction);
      } else throw new Error(`Error: Unknown command. Use \`${config.prefix}help\` for help or as an admin use \`${config.prefix}deploy\` to setup slash commands again.`);
    } catch (err) {
      // Process the error
      if (that.processReceivedError(err, receivedInteraction)) {
        // Swap hadError flag
        let [guildId, channelId] = [receivedInteraction.guild == null ? "dm" : receivedInteraction.guild.id, receivedInteraction.channel.id];
        let boardId = `${guildId}-${guildId == "dm" ? receivedInteraction.user.id : channelId}`;
        if (that.isBoard(boardId)) that.getBoard(boardId).hadError = true;
      }
    }
  }

  processReceivedError(err, replyFunc) {
    if (err.message !== "Failed: bomb exploded") {
      if (err.message.indexOf("Error: ") == 0) {
        replyFunc.reply({ embeds: [new Discord.MessageEmbed().setColor("#ba0c08").setAuthor("Error:").setTitle(err.message.slice(7, err.message.length))] });
      } else {
        replyFunc.reply({ embeds: [new Discord.MessageEmbed().setColor("#ba0c08").setAuthor("Oops!!").setTitle("A fault occured :sob: Please inform my developer").setDescription("Use the kill command to remove the current board so you can start a new game")] });
        console.error("==================================");
        console.error("Fuck a fault occured");
        console.error("----------------------------------");
        console.error(err);
        console.error("==================================");
        return true;
      }
    }
    return false;
  }

  processPing(outChannel, config) {
    var embed = new Discord.MessageEmbed()
      .setColor("#292340")
      .setAuthor("Discord Plays Caravan", this.jsonfile.logoQuestion)
      .setTitle("Welcome")
      .setDescription([`Run \`${config.prefix}start\` to create a new game`, `Run \`${config.prefix}help\` for more information`].join("\n"));
    outChannel.send({ embeds: [embed] });
  }

  getPerServerSettings(guildId) {
    if (/^dm/.test(guildId.toString())) return defaultGuildSettings;
    var pathForGuildSettings = path.join(this.guildSettingsPath, guildId.toString().replace(/[^a-zA-Z0-9]/g, "") + ".json");
    if (fs.existsSync(pathForGuildSettings))
      return {
        ...defaultGuildSettings,
        ...JSON.parse(fs.readFileSync(pathForGuildSettings)),
      };
    else
      return {
        ...defaultGuildSettings,
      };
  }

  setPerServerSettings(guildId, obj) {
    if (/^dm/.test(guildId.toString()))
      return new Promise((_resolve, reject) => {
        reject("DMs cannot save guild customization settings");
      });
    return new Promise((resolve, reject) => {
      var pathForGuildSettings = path.join(this.guildSettingsPath, guildId.toString().replace(/[^a-zA-Z0-9]/g, "") + ".json");
      fs.writeFile(pathForGuildSettings, JSON.stringify(obj), function (err) {
        if (err) reject("Failed to save guild customization settings");
        else resolve();
      });
    });
  }

  getPerUserSettings(userId) {
    var pathForUserSettings = path.join(this.userSettingsPath, userId.toString().replace(/[^a-zA-Z0-9]/g, "") + ".json");
    if (fs.existsSync(pathForUserSettings))
      return {
        ...defaultUserSettings,
        ...require(pathForUserSettings),
      };
    else
      return {
        ...defaultUserSettings,
      };
  }

  setPerUserSettings(userId, obj) {
    return new Promise((resolve, reject) => {
      var pathForUserSettings = path.join(this.userSettingsPath, userId.toString().replace(/[^a-zA-Z0-9]/g, "") + ".json");
      fs.writeFile(pathForUserSettings, JSON.stringify(obj), function (err) {
        if (err) reject("Failed to save user settings");
        else resolve();
      });
    });
  }
}

module.exports = CaravanBot;
