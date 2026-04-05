const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const frases = [
  'Las calles de UGRP no perdonan a los débiles. Si llegaste hasta acá, más vale que sepas lo que hacés.',
  'Bienvenido al lado oscuro. Acá no hay héroes, solo sobrevivientes.',
  'Cada organización tiene su código. Rompelo y las consecuencias son tuyas.',
  'La lealtad vale más que el dinero. Pero el dinero también vale.',
  'Nadie llega inocente a estas calles. Todos tienen algo que esconder.',
  'El poder se gana, no se pide. Demostrá de qué estás hecho.',
  'UGRP no es un juego. Los que lo tratan así no duran mucho.',
  'Las alianzas de hoy son las traiciones de mañana. Elegí bien a tu gente.',
];

function buildBienvenidaEmbed(user) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle('🚨 Nuevo sujeto en la aduana')
        .setDescription(`**${user.username}** acaba de cruzar la frontera.\n\n> *${frases[Math.floor(Math.random() * frases.length)]}*\n\nVerificate para entrar. O quedate afuera.`)
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
  const canal = guild.channels.cache.get('1490168101294051430');
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
