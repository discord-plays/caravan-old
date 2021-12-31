function pineappleCommand(bot, msg, args = []) {
  if (args.length > 0) return bot.sendInvalidOptions("pineapple", msg);
  ({
    reply: (a) => {
      if (typeof a === "string") a = { content: a };
      if (!a.hasOwnProperty("allowedMentions")) a.allowedMentions = {};
      a.allowedMentions.repliedUser = false;
      return msg.reply(a);
    },
  }.reply(":pineapple:"));
}

var helpExample = ["`>pineapple`"];

var helpText = ["Summon pineapple emoji"];

module.exports = {
  messageCommand: pineappleCommand,
  help: helpText,
  isHidden: true,
  example: helpExample,
};
