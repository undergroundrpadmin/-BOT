const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildBienvenidaEmbed(user) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle('🚨 Nuevo sujeto en la aduana')
        .setDescription(`**${user.username}** acaba de cruzar la frontera.\n\n> *Las calles de UGRP no perdonan a los débiles. Si llegaste hasta acá, más vale que sepas lo que hacés.*\n\nVerificate para entrar. O quedate afuera.`)
        .setColor(0x8b0000)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: 'OD UGRP • Nadie entra sin pasar por acá' })
        .setTimestamp()
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verificar')
          .setLabel('✅ Verificarme')
          .setStyle(ButtonStyle.Success)
      )
    ]
  };
}

async function sendLog(guild, titulo, descripcion, color = 0x95a5a6) {
  const canal = guild.channels.cache.find(c => c.name === 'logs-bot');
  if (!canal) return;
  await canal.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(descripcion)
        .setColor(color)
        .setTimestamp()
    ]
  });
}

module.exports = { buildBienvenidaEmbed, sendLog };
