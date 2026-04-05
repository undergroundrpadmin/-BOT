const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/helpers');

const CANAL_ANUNCIOS_ID = '1489508803643703306';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('Enviar un anuncio oficial al canal de anuncios')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('titulo').setDescription('Titulo del anuncio').setRequired(true))
    .addStringOption(o => o.setName('mensaje').setDescription('Contenido del anuncio').setRequired(true))
    .addStringOption(o => o
      .setName('color')
      .setDescription('Color del embed')
      .addChoices(
        { name: 'Rojo', value: 'rojo' },
        { name: 'Dorado', value: 'dorado' },
        { name: 'Azul', value: 'azul' },
        { name: 'Verde', value: 'verde' },
        { name: 'Gris', value: 'gris' },
      )
    )
    .addStringOption(o => o.setName('imagen').setDescription('URL de imagen (opcional)'))
    .addBooleanOption(o => o.setName('ping').setDescription('Mencionar @everyone').setRequired(false)),

  async execute(interaction) {
    const titulo = interaction.options.getString('titulo');
    const mensaje = interaction.options.getString('mensaje');
    const colorOpt = interaction.options.getString('color') ?? 'dorado';
    const imagen = interaction.options.getString('imagen');
    const hacerPing = interaction.options.getBoolean('ping') ?? false;

    const colores = { rojo: 0xe74c3c, dorado: 0xf1c40f, azul: 0x3498db, verde: 0x57f287, gris: 0x95a5a6 };

    const canal = interaction.guild.channels.cache.get(CANAL_ANUNCIOS_ID);
    if (!canal) return interaction.reply({ content: 'No se encontro el canal de anuncios.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${titulo}`)
      .setDescription(mensaje)
      .setColor(colores[colorOpt])
      .setFooter({ text: `Anuncio por ${interaction.user.username} • OD UGRP` })
      .setTimestamp();

    if (imagen) embed.setImage(imagen);

    await canal.send({ content: hacerPing ? '@everyone' : null, embeds: [embed] });
    await interaction.reply({ content: 'Anuncio enviado.', ephemeral: true });
    await sendLog(interaction.guild, '📢 Anuncio enviado', `**${interaction.user.username}** envio un anuncio: **${titulo}**`, 0xf1c40f);
  }
};
