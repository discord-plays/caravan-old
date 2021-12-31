require("dotenv").config();
const CREDITS = require("./credits.json");
const TIPS = require("./tips.json");
const { version } = require("../package.json");
const path = require("path");
const fs = require("fs");

const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGES],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

const RubiksBot = require("./game/Caravan");
const loadingconfig = require("./config.json");

const basedir = __dirname;
const datadir = path.join(basedir, "..", ".data");
const guildSettingsPath = path.join(datadir, "GuildSettings");
const userSettingsPath = path.join(datadir, "UserSettings");
const tmpdir = path.join(datadir, "tmp");

const jsonfile = { ...loadingconfig };

const DISCORD_ID = process.env.DISCORD_ID;

const options = {
  DISCORD_ID,
  CREDITS,
  TIPS,
  jsonfile,
  basedir,
  datadir,
  guildSettingsPath,
  userSettingsPath,
  tmpdir,
};

// Make datadir and subfolders
if (!fs.existsSync(datadir)) fs.mkdirSync(datadir);
if (!fs.existsSync(guildSettingsPath)) fs.mkdirSync(guildSettingsPath);
if (!fs.existsSync(userSettingsPath)) fs.mkdirSync(userSettingsPath);

var bot = null;

client.on("ready", () => {
  console.log(`Discord Plays Caravan v${version}`);
  bot = new RubiksBot(client, options);
});

client.on("messageCreate", (message) => {
  if (bot == null) return;

  let config = bot.getPerServerSettings(message.guild == null ? "dm-" + message.author.id : message.guild.id.toString());
  if (message.mentions.has(client.user)) return bot.processPing(message.channel, config);
  if (message.content.startsWith(config.prefix) && !message.content.startsWith(`${config.prefix} `)) return bot.processMessageCommand(message, config);
});

client.on("guildCreate", (guild) => {
  if (bot == null) return;
  let config = bot.getPerServerSettings(guild.id.toString());
  var embed = new Discord.MessageEmbed()
    .setColor("#292340")
    .setAuthor("Discord Plays Caravan", bot.jsonfile.logoQuestion)
    .setTitle("Welcome")
    .setDescription(["Thanks for inviting me to your server, here's how to get started.", `Run \`${config.prefix}start\` to create a new game`, `Run \`${config.prefix}help\` for more information`].join("\n"));

  guild.channels.fetch().then((channels) => {
    channels = channels.filter((x) => x.isText());
    if (channels.size > 0) {
      let goodChannelRegex = /.+(general).+/i;
      let outChannel = channels.first();
      for (const value of channels.values()) {
        if (goodChannelRegex.test(value.name)) {
          outChannel = value;
          break;
        }
      }
      outChannel.send({ embeds: [embed] });
    }
  });
});

client.on("interactionCreate", (interaction) => {
  if (interaction.isButton()) {
    bot.menuController.clickButton(interaction, interaction.user);
  } else if (interaction.isCommand()) {
    let config = bot.getPerServerSettings(interaction.guild == null ? "dm-" + interaction.user.id : interaction.guild.id.toString());
    bot.processInteractionCommand(interaction, config);
  }
});

function execute() {
  // login stuffs
  client.login(process.env.DISCORD_TOKEN);
}

function shutdown() {
  // Gracefully close and cleanup Minesweeper class
  bot.end();
  // Gracefully logout and terminate the Discord client
  client.destroy();
}

module.exports = { execute, shutdown };
