// Idk something to enable envionments
require("dotenv").config();

// Some setup for the program to work with discord
const { Client, ReactionCollector, MessageReaction } = require('discord.js');
const client = new Client();

// Importing functions files
const picks = require("./picks.js")

// Log into discord using token
client.login(process.env.DISCORDJS_BOT_TOKEN); 

// PREFIX
const PREFIX = "=";

// Output message when the bot connects to discord
client.on('ready', () => 
{
    console.log
    (
        `\n---------------------------------------------\n` + 
        `${client.user.tag} successfully logged in\n`+
        `---------------------------------------------`)

});

client.on('guildCreate', (guild) => 
{
    // To be able to use file system and other stuff
    const Discord = require('discord.js');
    const { DiscordAPIError } = require('discord.js');
    const fs = require('fs');

    console.log("New server joined.")
    newServerID = guild.id
    console.log("ID: " + newServerID)

    console.log("Creating new server save...")
    const picksDataJSON = fs.readFileSync('./src/picksData.json')
    var picksData = JSON.parse(picksDataJSON)
    console.log("JSON Read Test: serverID of the first saved server is " + picksData[0].serverID)

    newServer = {"serverID":newServerID,"picksActive":false,"captainOne":"","captainTwo":"","teamOne":[],"teamTwo":[],"lastMessage":""}
    console.log("Generated new server save.")
    picksData.push(newServer)
    data = JSON.stringify(picksData)
    fs.writeFileSync('./src/picksData.json', data)
    console.log("Picks data saved!")
    console.log("New server added!")
})

// This code will run when a message is sent
client.on('message', (message) =>
{
    
    // If the message came from the bot, return (do not take any action)
    if(message.author.bot) return;

    // Define guild object of the message
    var guild = message.guild;

    // Check if message starts with the prefix
    if (message.content.startsWith(PREFIX))
    {
        // Store message content, elements seperated by whitespace, into an array
        const args = message.content
        .trim()
        .substring(PREFIX.length)
        .split(/\s+/);

        // Output to console the arguements recieved
        console.log("\n\n========== COMMAND RECIEVED ==========\nRecieved: " + args);

        picks(args, message, client, guild, PREFIX);
    } 
})

