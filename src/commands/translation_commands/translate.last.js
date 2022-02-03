// -----------------
// Global variables
// Err TAG: RC402??
// -----------------

//  Codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const translate = require("../../core/translate");
const logger = require("../../core/logger");
const sendMessage = require("../../core/command.send");
const auth = require("../../core/auth");

// -----------------------------
// Command Disabled Pending Fix
// -----------------------------

module.exports.run = function run (data)
{

   try
   {

      setTimeout(() => data.message.delete(), auth.time.short);

   }
   catch (err)
   {

      console.log(
         "Command Message Deleted Error, translate.last.js = Line 29",
         err
      );

   }
   return data.message.channel.send({"embeds": [{
      "author": {
         "icon_url": data.message.client.user.displayAvatarURL(),
         "name": data.message.client.user.username
      },
      "color": 13107200,
      "description": `:no_entry_sign: This command has been disabled Pending a fix \n
     We apologise for any inconvenience this may cause.`

   }]}).then((msg) =>
   {

      try
      {

         setTimeout(() => msg.delete(), auth.time.short);

      }
      catch (err)
      {

         console.log(
            "Command Message Deleted Error, transalte.last.js = 56",
            err
         );

      }

   });

};

function getCount (count)
{

   if (count)
   {

      return count;

   }
   return "-1";

}

// ---------------
// Translate last
// ---------------

module.exports.old = function old (data)
{

   // -------------------------
   // Prepare translation data
   // -------------------------

   data.translate = {
      "from": data.cmd.from,
      "to": data.cmd.to

   };

   // ----------------
   // Get count param
   // ----------------

   let count = getCount(data.cmd.num);

   // ---------
   // Set mode
   // ---------

   let mode = "all";

   if (count.startsWith("-") || count === "1")
   {

      mode = "single";
      data.translate.multi = true;

   }

   // eslint-disable-next-line no-inline-comments
   if (mode === "all" && Math.abs(count) > /* data.config.maxChains*/ 30)
   {

      data.color = "warn";
      data.text =
            `:warning:  Cannot translate more than __**\`${
               data.config.maxChains}\`**__ message chains at once.`;

      // -------------
      // Send message
      // -------------

      sendMessage(data);
      count = data.config.maxChains;

   }

   // -------------------------
   // Get requested collection
   // -------------------------

   // let limit = Math.abs(count) * data.config.maxChainLen + 1;
   let limit = Math.abs(count) + 1;
   if (limit > 100)
   {

      limit = 100;

   }

   data.message.channel.messages.fetch({
      limit
   }).then((messages) =>
   {

      let messagesArray = Array.from(messages);
      messagesArray.shift();
      messagesArray = messagesArray.reverse();

      let lastAuthor = null;
      const chains = [];

      for (let i = 0; i < messagesArray.length; i += 1)
      {

         if (
            !messagesArray[i][1].author.bot &&
            !messagesArray[i][1].content.startsWith(data.config.translateCmdShort)
         )
         {

            if (
               lastAuthor === messagesArray[i][1].author.id &&
               chains[chains.length - 1].msgs.length < data.config.maxChainLen
            )
            {

               chains[chains.length - 1].msgs.push(messagesArray[i][1].content);

            }

            else
            {

               messagesArray[i][1].server = data.message.server;
               chains.push({
                  data,
                  // eslint-disable-next-line sort-keys
                  "author": messagesArray[i][1].author,
                  // eslint-disable-next-line spaced-comment
                  //"color": fn.getRoleColor(messagesArray[i][1].member),
                  "color": messagesArray[i][1].member.displayColor,
                  "id": [messagesArray[i][1].id],
                  "message": messagesArray[i][1],
                  "msgs": [messagesArray[i][1].content],
                  "time": messagesArray[i][1].createdTimestamp
               });
               lastAuthor = messagesArray[i][1].author.id;

            }

         }

      }

      // --------------------------
      // Get requested chains only
      // --------------------------

      const reqChains = chains.slice(-Math.abs(count));

      // --------------------------
      // Error - No messages found
      // --------------------------

      if (reqChains.length < 1)
      {

         data.color = "warn";
         data.text =
            ":warning:  Could not find any valid messages to " +
            "translate. Bots and commands are ignored.";

         // -------------
         // Send message
         // -------------

         return sendMessage(data);

      }

      // -----------------------
      // Translate single chain
      // -----------------------

      if (mode === "single")
      {

         data.message.author = reqChains[0].author;
         data.translate.original = reqChains[0].msgs.join("\n");
         data.message.guild.id = reqChains[0].id;
         delete data.message.attachments;
         return translate(data);

      }

      // -----------------------------------
      // Translate multiple chains (buffer)
      // -----------------------------------

      data.bufferChains = reqChains;
      delete data.message.attachments;

      return translate(data);

   }).
      catch((err) => logger(
         "error",
         err,
         "command",
         data.message.guild.name
      ));

};

