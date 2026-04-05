const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rango')
    .setDescription('Gestión de rangos de miembros')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('dar')
      .setDescription('Dar un rango a un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro').setRequired(true))
      .addRoleOption(o => o.setName('rol').setDescription('Rol a asignar').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('quitar')
      .setDescription('Quitar un rango a un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro').setRequired(true))
      .addRoleOption(o => o.setName('rol').setDescription('Rol a quitar').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('ver')
      .setDescription('Ver los rangos de un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const miembro = interaction.options.getMember('miembro');

    if (sub === 'dar') {
      const rol = interaction.options.getRole('rol');
      if (miembro.roles.cache.has(rol.id)) {
        return interaction.reply({ content: `Ya tiene el rol **${rol.name}**.`, ephemeral: true });
      }
      await miembro.roles.add(rol);
      const embed = new EmbedBuilder()
        .setTitle('🎖️ Rango asignado')
        .setDescription(`Se le asignó el rol **${rol.name}** a <@${miembro.id}>.`)
        .setColor(0xf1c40f)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await sendLog(interaction.guild, '🎖️ Rango dado', `**${interaction.user.username}** dio el rol **${rol.name}** a <@${miembro.id}>.`, 0xf1c40f);
    }

    if (sub === 'quitar') {
      const rol = interaction.options.getRole('rol');
      if (!miembro.roles.cache.has(rol.id)) {
        return interaction.reply({ content: `No tiene el rol **${rol.name}**.`, ephemeral: true });
      }
      await miembro.roles.remove(rol);
      const embed = new EmbedBuilder()
        .setTitle('🎖️ Rango removido')
        .setDescription(`Se le quitó el rol **${rol.name}** a <@${miembro.id}>.`)
        .setColor(0xe67e22)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await sendLog(interaction.guild, '🎖️ Rango quitado', `**${interaction.user.username}** quitó el rol **${rol.name}** a <@${miembro.id}>.`, 0xe67e22);
    }

    if (sub === 'ver') {
      const roles = miembro.roles.cache
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(r => `<@&${r.id}>`)
        .join(', ') || 'Sin roles';

      const embed = new EmbedBuilder()
        .setTitle(`🎖️ Rangos de ${miembro.user.username}`)
        .setDescription(roles)
        .setColor(0x3498db)
        .setThumbnail(miembro.user.displayAvatarURL())
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
};
