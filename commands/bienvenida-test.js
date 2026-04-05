const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildBienvenidaEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida-test')
    .setDescription('Simula el mensaje de bienvenida')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.reply(buildBienvenidaEmbed(interaction.user));
  }
};
