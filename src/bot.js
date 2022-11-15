import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User,
  ],
  failIfNotExists: false,
  presence: {
    activities: [this.status],
    status: "online",
  },
  allowedMentions: {
    parse: ["roles", "users", "everyone"],
    repliedUser: false,
  },
});
new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User,
  ],
  failIfNotExists: false,
  presence: {
    activities: [this.status],
    status: "online",
  },
  allowedMentions: {
    parse: ["roles", "users", "everyone"],
    repliedUser: false,
  },
});
import mongoose from "mongoose";
import { config } from "./config.js";
import colors from "colors";
import schema from "./adminSchema";
const embedColor = "#2f3136";
import { generate } from "generate-password";

import database from "./database";

function sendEmbed(message, embedTitle, embedDescription, embedColorParam) {
  if (!message || (!embedTitle && !embedDescription))
    return console.log("[sendEmbed function ERROR] invalid arguments");
  const embed = new Discord.MessageEmbed();
  if (embedTitle) embed.setTitle(embedTitle);
  if (embedColorParam) embed.setColor(embedColorParam);
  else embed.setColor(embedColor);
  if (embedDescription) embed.setDescription(embedDescription);
  return message.channel.send({ embeds: [embed] });
}

function genEmbed(embedTitle, embedDescription, embedColorParam) {
  if (!embedTitle && !embedDescription)
    return console.log("[sendEmbed function ERROR] invalid arguments");
  const embed = new Discord.MessageEmbed();
  if (embedTitle) embed.setTitle(embedTitle);
  if (embedColorParam) embed.setColor(embedColorParam);
  else embed.setColor(embedColor);
  if (embedDescription) embed.setDescription(embedDescription);
  return embed;
}

client.on("messageCreate", (message) => {
  if (
    message.author.bot ||
    !message.guild ||
    !message.content.startsWith(config.prefix)
  )
    return;

  const args = message.content.slice(config.prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "site") {
    const row = new Discord.MessageActionRow().setComponents(
      new Discord.MessageButton()
        .setURL("https://all-cracks.fr/")
        .setStyle("LINK")
        .setLabel("Click ICI")
    );

    message.channel.send({
      content: "Voici le lien de All-Cracks :",
      components: [row],
    });
  } else if (command === "add-admin") {
    config.admins.forEach((id) => {
      if (message.author.id === id) {
        if (message.deletable) message.delete();
        let filter = (m) => m.author.id === message.author.id;
        message.channel
          .send({
            embeds: [
              genEmbed("Merci d'envoyer l'adresse email de la personne"),
            ],
          })
          .then((initialMessage) => {
            message.channel
              .awaitMessages({
                filter,
                max: 1,
                time: 30000,
                errors: ["time"],
              })
              .then(async (message2) => {
                let msg = message2.first();
                if (msg.deletable) msg.delete();
                if (initialMessage.deletable) initialMessage.delete();
                const emailRegex =
                  /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
                if (!msg.content.match(emailRegex)) {
                  sendEmbed(message, ":x: Email invalide").then((msgg) => {
                    setTimeout(() => {
                      if (msgg.deletable) msgg.delete();
                    }, 5000);
                  });
                } else {
                  const email = msg.content;
                  const password = generate({
                    numbers: true,
                    symbols: true,
                  });
                  const embed = new Discord.MessageEmbed()
                    .setColor(embedColor)
                    .setTitle("Voila votre configuration :")
                    .setDescription(
                      "Voulez vous l'enregistrer dans la base de donnée ?"
                    )
                    .addFields([
                      { name: "Adresse mail", value: email },
                      { name: "Mot de passe", value: password },
                    ]);

                  const row = new Discord.MessageActionRow().setComponents(
                    new Discord.MessageButton()
                      .setStyle("SUCCESS")
                      .setLabel("Enregistrer")
                      .setCustomId("saveConfig"),
                    new Discord.MessageButton()
                      .setStyle("DANGER")
                      .setLabel("Annuler")
                      .setCustomId("cancelConfig")
                  );

                  message.channel
                    .send({ embeds: [embed], components: [row] })
                    .then(() => {
                      client.on("interactionCreate", (interaction) => {
                        if (!interaction.isButton()) return;
                        if (interaction.user.id !== message.member.id) {
                          return interaction.reply({
                            ephemeral: true,
                            embeds: [
                              genEmbed(
                                ":x: Vous n'avez pas la permission d'utiliser ce bouton."
                              ),
                            ],
                          });
                        }
                        if (!interaction.deferred) interaction.deferUpdate();

                        if (interaction.customId === "cancelConfig") {
                          interaction.message
                            .edit({
                              embeds: [
                                genEmbed(":white_check_mark: Requête annulé !"),
                              ],
                              components: [],
                            })
                            .then(() => {
                              setTimeout(() => {
                                if (interaction.message.deletable)
                                  interaction.message.delete();
                              }, 5000);
                            });
                        } else if (interaction.customId === "saveConfig") {
                          const data = new database({
                            _id: String(Date.now()),
                            email,
                            password,
                          });

                          data.save().then(() => {
                            interaction.message
                              .edit({
                                embeds: [
                                  genEmbed(
                                    ":white_check_mark: Nouveau compte enregistré !"
                                  ),
                                ],
                                components: [],
                              })
                              .then(() => {
                                setTimeout(() => {
                                  if (interaction.message.deletable)
                                    interaction.message.delete();
                                }, 5000);
                              });
                          });
                        }
                      });
                    });
                }
              })
              .catch(() => {
                sendEmbed(message, ":x: Temp écoulé").then((msgg) => {
                  setTimeout(() => {
                    if (msgg.deletable) msgg.delete();
                  }, 50000);
                });
              });
          });
        return;
      } else return;
    });
  }
});

client.on("ready", () => {
  client.user.setActivity({ type: "GAME", name: "https://all-cracks.fr" });
  console.log("✅ Bot logged in".green);
});

client.login(config.token);
