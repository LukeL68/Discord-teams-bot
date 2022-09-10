// To be able to use file system and other stuff
const Discord = require('discord.js');
const { DiscordAPIError } = require('discord.js');
const fs = require('fs');

// In the future, if the JSON file is no longer able to handle all the operations, look into using Enmap or some other database tool.

// Core function
module.exports = function picks(args, message, client, guild)
{
    // Get and output guild id to console
    messageServerID = message.guild.id
    console.log("Recieved command from server id: " + messageServerID)
    console.log("Amount of arguments: " + args.length)

    // Load stored information (picksData) from picksData.json.  
    // 1. readFile reads string from JSON file and stores it in picksDataJSON.
    // 2. This string is parsed into an array of objects (servers) so that the program can read it
    const picksDataJSON = fs.readFileSync('./src/picksData.json')
    var picksData = JSON.parse(picksDataJSON)

    console.log("Loaded picksData. There are currently " + picksData.length + " servers saved.")


    // Iterate over each server object in server object array and test each one's serverID property for a matching ID to find
    // the index of the server in the array. This is necessary for the entire program to function.
    serverIndex = picksData.findIndex((element, index) => 
    {
        console.log("Checking server at index + " + index + " with ID " + element.serverID)
        return element.serverID == messageServerID
    })

    // If the server is not found, the server will be added to the array and the user will have to reenter their command.
    if(serverIndex == -1)
    {
        console.log("Server not found")
        message.reply("Sorry, I was unable to retrieve data for your server. A fix will be applied. Please retry your command (it should work this time).")
        generateServerSave(messageServerID, picksData)
        return

    }
    else
    {
        console.log("Server found, index: " + serverIndex)
    }

    console.log("Stored picks data for this server:\n------------------------------")
    console.log(picksData[serverIndex])
    console.log("------------------------------")

    // Determine which command to run
    switch(args[0].toLowerCase())
    {
        case "start" : startPicks(args, message, client, guild, picksData, serverIndex); break;
        case "pick": choosePicks(args, message, client, guild, picksData, serverIndex); break;
        case "trade" : tradePicks(args, message, client, guild, picksData, serverIndex); break;
        case "give"  : givePicks(args, message, client, guild, picksData, serverIndex); break;
        case "remove": removePicks(args, message, client, guild, picksData, serverIndex); break;
        case "stop"  : stopPicks(args, message, client, guild, picksData, serverIndex); break;
        case "show"  : showPicks(picksData, message, Discord, serverIndex); break;
        case "help"  : linkHelp(message); break;
        default: message.reply("Invalid command"); break;
    }

    console.log("============ COMMAND ENDED ============")
}

// FUNCTIONS

// Main Functions

// Function to save server in case it is not found
function generateServerSave(newServerID, picksData)
{
    newServer = {"serverID":newServerID,"picksActive":false,"captainOne":"","captainTwo":"","teamOne":[],"teamTwo":[],"lastMessage":""}
    console.log("Generated new server save.")
    picksData.push(newServer)
    updatePicksData(picksData, serverIndex)
    console.log("New server added!")
}

// Function to start picks
function startPicks(args, message, client, guild, picksData, serverIndex)
{
    console.log("Start requested...")

    // Check if picks are happening already
    if (picksData[serverIndex].picksActive)
    {
        console.log("User tried to start picks when they have already started")
        console.log("Start cancelled!")
        return message.reply("Picks are already happening.")
    }

    
    if(invalidArgs(args,3))
    {
        return message.reply("Please enter two team captains.")
    }

    // Check if two captains are mentioned
    if(!args[1] || !args[2])
    {
        console.log("User did not enter two captains")
        console.log("Start cancelled!")
        return message.reply("Make sure to mention two team captains.")
    }

    // Store ID of captains
    captainOne = toID(args[1])
    captainTwo = toID(args[2])

    // Make sure captains have valid IDs
    if(!validateUser(captainOne, guild) || !validateUser(captainTwo, guild))
    {
        console.log("Start cancelled!")
        return message.reply("Invalid user(s). Make sure to @mention the players to add them.")
    }
    
    // Save captain IDs, set picks active to true, add both captains to their teams. Update JSON.
    console.log("Starting picks")
    picksData[serverIndex].picksActive = true
    picksData[serverIndex].captainOne = captainOne
    picksData[serverIndex].captainTwo = captainTwo
    picksData[serverIndex].teamOne.unshift(captainOne)
    picksData[serverIndex].teamTwo.unshift(captainTwo)
    updatePicksData(picksData, serverIndex)

    // Show picks
    message.reply("Picks started!")
    showPicks(picksData, message, Discord, serverIndex)
}

// Function to choose picks
function choosePicks(args, message, client, guild, picksData, serverIndex)
{
    console.log("Choose requested...")

    // Check if picks are active
    if(!picksData[serverIndex].picksActive)
    {
        console.log("User tried to choose a pick without picks having been started")
        return message.reply("Picks have not been started yet!")
    }

    if(invalidArgs(args,2))
    {
        return message.reply("You can only pick one player at a time.")
    }

    // Store pick
    pick = toID(args[1])

    // Check if pick is a valid user
    if(!validateUser(pick, guild))
    {
        return message.reply("Invalid user. Make sure to @mention the player to add them.")
    }
 
    console.log("Recieved pick, ID: " + pick)
    console.log("Team one has this pick? " + picksData[serverIndex].teamOne.includes(pick))
    console.log("Team two has this pick? " + picksData[serverIndex].teamTwo.includes(pick))

    // Check if the person picked has not already been picked
    if(picksData[serverIndex].teamOne.includes(pick))
    {
        console.log("Pick rejected.")
        return message.channel.send("<@" + pick + "> has already been picked by team 1.") //.then(msg => msg.delete({timeout: 7000}))
    }
    else if(picksData[serverIndex].teamTwo.includes(pick))
    {
        console.log("Pick rejected.")
        return message.channel.send("<@" + pick + "> has already been picked by team 2.")
    }

    // Check which captain picked
    if(message.author.id == picksData[serverIndex].captainOne)
    {
        console.log("Team one captain recognized! Adding pick: " + pick)

        picksData[serverIndex].teamOne.push(pick)
        updatePicksData(picksData, serverIndex)

        message.channel.send(toMention(pick) + " added to team one.")
        showPicks(picksData, message, Discord, serverIndex)


    }
    else if(message.author.id == picksData[serverIndex].captainTwo)
    {
        console.log("Team two captain recognized! Adding pick: " + pick)

        picksData[serverIndex].teamTwo.push(pick)
        updatePicksData(picksData, serverIndex)

        message.channel.send(toMention(pick) + "added to team two.")
        showPicks(picksData, message, Discord, serverIndex) 
    }
    else
    {   
        console.log("Non-captain tried to pick")
        return message.reply("You are not a team captain!")
    }
}

function tradePicks(args, message, client, guild, picksData, serverIndex)
{
    console.log("Trade requested...")

    if(!picksData[serverIndex].picksActive)
    {
        console.log("User tried to trade without picks having been started")
        return message.reply("Picks have not been started yet!")
    }

    if(!args[1] || !args[2])
    {
        return message.reply("Make sure to mention two people: the person you are offering and the person you want.")
    }

    if(invalidArgs(args,3))
    {
        return message.reply("Make sure to mention only two people: the person you are offering and the person you want.")
    }

    personOffered = toID(args[1])
    personWanted = toID(args[2])

    if(message.author.id == picksData[serverIndex].captainOne)
    {
        if(picksData[serverIndex].teamOne.includes(personOffered) && picksData[serverIndex].teamTwo.includes(personWanted))
        {
            message.channel.send(
                toMention(picksData[serverIndex].captainTwo) + "**, the other team is offering **" + toMention(personOffered) + "** in exchange for **" + toMention(personWanted) + "**.**\n" +
                "Do you accept? You have 10 seconds to respond or the trade will be cancelled.").then((message) => {
                    message.react("✅")
                    message.react("❌")

                    const filter = (reaction, user) => {
                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === picksData[serverIndex].captainTwo;
                    };

                    message.awaitReactions(filter, {max: 1, time: 10000, errors: ['time']})
                        .then(collected => 
                            {
                                const reaction = collected.first()

                                if(reaction.emoji.name === '✅')
                                {
                                    message.channel.send("Offer was accepted!")
                                    doTrade(personWanted, personOffered, picksData, message, serverIndex)
                                    showPicks(picksData, message, Discord, serverIndex)
                                }
                                else if(reaction.emoji.name === '❌')
                                {
                                    message.channel.send("Offer was rejected!")
                                    showPicks(picksData, message, Discord, serverIndex)
                                }

                            }).catch(collected => {
                                message.channel.send("Trade offer was not responded to in time, trade cancelled.");
                            });

                }).catch()

        }
        else
        {
            message.reply("One or both of the teams do not have the needed player(s) to do this trade.")
        }
    }
    else if(message.author.id == picksData[serverIndex].captainTwo)
    {
        if(picksData[serverIndex].teamTwo.includes(personOffered) && picksData[serverIndex].teamOne.includes(personWanted))
        {
            message.channel.send(
                toMention(picksData[serverIndex].captainOne) + "**, the other team is offering **" + toMention(personOffered) + "** in exchange for **" + toMention(personWanted) + "**.**\n" +
                "Do you accept? You have 10 seconds to respond or the trade will be cancelled.").then((message) => {
                    message.react("✅")
                    message.react("❌")

                    const filter = (reaction, user) => {
                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === picksData[serverIndex].captainOne;
                    };

                    message.awaitReactions(filter, {max: 1, time: 10000, errors: ['time']})
                        .then(collected => 
                            {
                                const reaction = collected.first()

                                if(reaction.emoji.name === '✅')
                                {
                                    message.channel.send("Offer was accepted!")
                                    doTrade(personOffered, personWanted, picksData, message, serverIndex)
                                    showPicks(picksData, message, Discord, serverIndex)
                                }
                                else if(reaction.emoji.name === '❌')
                                {
                                    message.channel.send("Offer was rejected!")
                                    showPicks(picksData, message, Discord, serverIndex)
                                }

                            }).catch(collected => {
                                message.channel.send("Trade offer was not responded to in time, trade cancelled.");
                            });

                }).catch()

        }
        else
        {
            message.reply("One or both of the teams do not have the needed player(s) to do this trade.")
        }
    }
    else 
    {
        console.log("Non-captain tried to trade")
        return message.reply("You are not a team captain!")
    }
}

function givePicks(args, message, client, guild, picksData, serverIndex)
{
    console.log("Give requested...")

    // Check if picks are active
    if(!picksData[serverIndex].picksActive)
    {
        console.log("User tried to give a pick without picks having been started")
        return message.reply("Picks have not been started yet!")
    }

    if(invalidArgs(args,2))
    {
        return message.reply("You can only give one person at a time.")
    }

    personGiven = toID(args[1])

    if(message.author.id == picksData[serverIndex].captainOne)
    {
        if(!picksData[serverIndex].teamOne.includes(personGiven))
        {
            return message.reply("This player is not on your team.")
        }

        message.channel.send(
            toMention(picksData[serverIndex].captainTwo) + "**, the other team wants to give you **" + toMention(personGiven) + "**.**\n" +
            "Do you accept? You have 10 seconds to respond or the offer will be cancelled.").then((message) => {
                message.react("✅")
                message.react("❌")

                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === picksData[serverIndex].captainTwo;
                };

                message.awaitReactions(filter, {max: 1, time: 10000, errors: ['time']})
                    .then(collected => 
                        {
                            const reaction = collected.first()

                            if(reaction.emoji.name === '✅')
                            {
                                console.log("Giving person")
                                message.channel.send("Offer was accepted!")
                                index = picksData[serverIndex].teamOne.indexOf(personGiven)
                                picksData[serverIndex].teamOne.splice(index, 1)
                                picksData[serverIndex].teamTwo.push(personGiven)
                                message.channel.send(toMention(personGiven) + " moved to team 2.")
                                updatePicksData(picksData, serverIndex)
                                showPicks(picksData, message, Discord, serverIndex)
                            }
                            else if(reaction.emoji.name === '❌')
                            {
                                message.channel.send("Offer was rejected!")
                                showPicks(picksData, message, Discord, serverIndex)
                            }

                        }).catch(collected => {
                            message.channel.send("Offer was not responded to in time, offer cancelled.");
                        });

            }).catch()

    }
    else if(message.author.id == picksData[serverIndex].captainTwo)
    {
        if(!picksData[serverIndex].teamTwo.includes(personGiven))
        {
            return message.reply("This player is not on your team.")
        }

        message.channel.send(
            toMention(picksData[serverIndex].captainOne) + "**, the other team wants to give you **" + toMention(personGiven) + "**.**\n" +
            "Do you accept? You have 10 seconds to respond or the offer will be cancelled.").then((message) => {
                message.react("✅")
                message.react("❌")

                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === picksData[serverIndex].captainOne;
                };

                message.awaitReactions(filter, {max: 1, time: 10000, errors: ['time']})
                    .then(collected => 
                        {
                            const reaction = collected.first()

                            if(reaction.emoji.name === '✅')
                            {
                                console.log("Giving person")
                                message.channel.send("Offer was accepted!")
                                index = picksData[serverIndex].teamTwo.indexOf(personGiven)
                                picksData[serverIndex].teamTwo.splice(index, 1)
                                picksData[serverIndex].teamOne.push(personGiven)
                                message.channel.send(toMention(personGiven) + " moved to team 1.")
                                updatePicksData(picksData, serverIndex)
                                showPicks(picksData, message, Discord, serverIndex)
                            }
                            else if(reaction.emoji.name === '❌')
                            {
                                message.reply("Offer was rejected!")
                                showPicks(picksData, message, Discord, serverIndex)
                            }

                        }).catch(collected => {
                            message.channel.send("Offer was not responded to in time, offer cancelled.");
                        });

            }).catch()

        
    }
    else
    {
        message.reply("You are not a team captain!")
    }
}

function removePicks(args, message, client, guild, picksData, serverIndex)
{
    console.log("Remove requested...")

    // Check if picks are active
    if(!picksData[serverIndex].picksActive)
    {
        console.log("User tried to remove a pick without picks having been started")
        return message.reply("Picks have not been started yet!")
    }

    personRemoved = toID(args[1])

    if(message.author.id == picksData[serverIndex].captainOne)
    {
        if(!picksData[serverIndex].teamOne.includes(personRemoved))
        {
            return message.reply("This player is not on your team.")
        }

        index = picksData[serverIndex].teamOne.indexOf(personRemoved)
        picksData[serverIndex].teamOne.splice(index, 1)
        message.channel.send(toMention(personRemoved) + " removed from team 1.")
        updatePicksData(picksData, serverIndex)
        showPicks(picksData, message, Discord, serverIndex)
    }
    else if(message.author.id == picksData[serverIndex].captainTwo)
    {
        if(!picksData[serverIndex].teamTwo.includes(personRemoved))
        {
            return message.reply("This player is not on your team.")
        }

        index = picksData[serverIndex].teamTwo.indexOf(personRemoved)
        picksData[serverIndex].teamTwo.splice(index, 1)
        message.channel.send(toMention(personRemoved) + " removed from team 2.")
        updatePicksData(picksData, serverIndex)
        showPicks(picksData, message, Discord, serverIndex)
    }
    else
    {
        message.reply("You are not a team captain!")
    }
}

function stopPicks(args, message, client, guild, picksData, serverIndex)
{
    console.log("Stop requested...")

    if(picksData[serverIndex].picksActive)
    {
        console.log("Stopping picks!")
        picksData[serverIndex].captainOne = ""
        picksData[serverIndex].captainTwo = ""
        picksData[serverIndex].teamOne = []
        picksData[serverIndex].teamTwo = []
        picksData[serverIndex].lastMessage = ""
        picksData[serverIndex].picksActive = false
        updatePicksData(picksData, serverIndex)
        message.reply("Picks stopped!")
    }
    else
    {
        message.reply("Picks are aready stopped.")
        console.log("Picks already stopped.")
    }
}

async function showPicks(picksData, message, Discord, serverIndex)
{
    console.log("Showing picks!")
    console.log(picksData[serverIndex])

    if(!picksData[serverIndex].picksActive)
    {
        return message.reply("Picks are not active right now.")
    }

    // Storing JSON data in variables
    captainOne = picksData[serverIndex].captainOne
    captainTwo = picksData[serverIndex].captainTwo
    teamOne = picksData[serverIndex].teamOne
    teamTwo = picksData[serverIndex].teamTwo

    // Convert team 1 ids to @mentions
    teamOne.forEach((id, i) => teamOne[i] = toMention(id))

    // Convert team 2 ids to @mentions
    teamTwo.forEach((id, i) => teamTwo[i] = toMention(id))

    const embed = new Discord.MessageEmbed()
        .setTitle('Picks')
        .setColor('PURPLE')
        .addFields
        (
            { name: 'Team Captains', value: "<@" + captainOne + "> and " + "<@" + captainTwo + ">\n\n" },
            { name: "Team 1", value: teamOne, inline: true },
            { name: "Team 2", value: teamTwo, inline: true },
        )

    // Convert team 1 @mentions back to ids
    teamOne.forEach((mention, i) => teamOne[i] = toID(mention))

    // Convert team 2 @mentions back to ids
    teamTwo.forEach((mention, i) => teamTwo[i] = toID(mention))

    // Saving the ID of the message sent
    let sent = await message.channel.send(embed)
    let messageID = sent.id
    console.log("Sent Message ID: " + messageID)

    // Attempt to delete any previous messages
    message.channel.messages.fetch(picksData[serverIndex].lastMessage).then(msg => msg.delete()).catch(error => { console.log("No message to delete") })

    // Update picks data JSON with the message ID to be deleted in the future
    picksData[serverIndex].lastMessage = messageID
    updatePicksData(picksData, serverIndex)
}


// Secondary Functions


function validateUser(id, guild)
{
    if(guild.member(id))
    {
        console.log("User id check success!")
        return true
    }
    else
    {
        console.log("User not valid")
        return false
    }
}

function doTrade(toTeamOne, toTeamTwo, picksData, message, serverIndex)
{
    indexOne = picksData[serverIndex].teamOne.indexOf(toTeamTwo)
    picksData[serverIndex].teamOne.splice(indexOne, 1, toTeamOne)
    message.channel.send(toMention(toTeamTwo) + " moved to team 2")
    

    indexTwo = picksData[serverIndex].teamTwo.indexOf(toTeamOne)
    picksData[serverIndex].teamTwo.splice(indexTwo, 1, toTeamTwo)
    message.channel.send(toMention(toTeamOne) + " moved to team 1")

    updatePicksData(picksData, serverIndex)
}

function updatePicksData(picksData, serverIndex)
{
    data = JSON.stringify(picksData)
    fs.writeFileSync('./src/picksData.json', data)
    console.log("Picks data saved!")
}

function toID(mention)
{
    id = mention.replace(/[\\<>@#&!]/g, "")
    return id
}

function toMention(id)
{
    mention = "<@" + id + ">"
    return mention
}

function linkHelp(message)
{
    message.reply("Here is the help doc: " + "https://docs.google.com/document/d/1To0k9IVND90R3_CxJUthMrCdugpEvia0QVNFWq2NVzo/edit?usp=sharing")
}

function invalidArgs(args, amount)
{
    if(args.length != amount)
    {
        console.log("User entered invalid amount of arguments.")
        return true
    }
}

    /*function idToUserTag(id, message)
{
    user = message.guild.members.cache.get(id)
    console.log(user)
    user = user.tag
    return user
}
*/