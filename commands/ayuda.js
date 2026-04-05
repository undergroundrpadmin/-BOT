const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Ver todos los comandos disponibles'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Comandos — OD UGRP')
      .setColor(0x2b2d31)
      .addFields(
        {
          name: '🏴 Organizaciones',
          value: [
            '`/org crear` — Crear una organización',
            '`/org info` — Ver info de una org',
            '`/org agregar` — Agregar miembro',
            '`/org remover` — Remover miembro',
            '`/org lista` — Ver todas las orgs',
          ].join('\n')
        },
        {
          name: '🎖️ Rangos',
          value: [
            '`/rango dar` — Dar un rol a un miembro',
            '`/rango quitar` — Quitar un rol',
            '`/rango ver` — Ver roles de un miembro',
          ].join('\n')
        },
        {
          name: '📋 Logs',
          value: '`/logs` — Ver logs recientes del servidor'
        }
      )
      .setFooter({ text: 'OD UGRP • Bot de gestión' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
