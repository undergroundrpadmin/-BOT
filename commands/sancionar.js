const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/helpers');

const sanciones = new Map();

const ROL_OD_ID = '1490159958006824960';
let rolPerkinId = null;

async function getRolPerkin(guild) {
  if (rolPerkinId) {
    const rol = guild.roles.cache.get(rolPerkinId);
    if (rol) return rol;
  }
  const existente = guild.roles.cache.find(r => r.name === 'Perkin');
  if (existente) { rolPerkinId = existente.id; return existente; }
  const nuevo = await guild.roles.create({ name: 'Perkin', color: 0x95a5a6, reason: 'Rol de suspension' });
  rolPerkinId = nuevo.id;
  return nuevo;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sancionar')
    .setDescription('Gestion de sanciones')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub => sub
      .setName('agregar')
      .setDescription('Agregar una sancion a un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro a sancionar').setRequired(true))
      .addStringOption(o => o
        .setName('tipo')
        .setDescription('Tipo de sancion')
        .setRequired(true)
        .addChoices(
          { name: 'Advertencia', value: 'advertencia' },
          { name: 'Suspension', value: 'suspension' },
          { name: 'Expulsion', value: 'expulsion' },
        )
      )
      .addStringOption(o => o.setName('razon').setDescription('Razon de la sancion').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('ver')
      .setDescription('Ver sanciones de un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('limpiar')
      .setDescription('Limpiar sanciones de un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'agregar') {
      const miembro = interaction.options.getUser('miembro');
      const tipo = interaction.options.getString('tipo');
      const razon = interaction.options.getString('razon');

      if (!sanciones.has(miembro.id)) sanciones.set(miembro.id, []);
      sanciones.get(miembro.id).push({
        tipo, razon,
        fecha: new Date().toISOString(),
        moderador: interaction.user.id
      });

      const emojis = { advertencia: '⚠️', suspension: '🔇', expulsion: '🚫' };
      const embed = new EmbedBuilder()
        .setTitle(`${emojis[tipo]} Sancion aplicada`)
        .addFields(
          { name: 'Miembro', value: `<@${miembro.id}>`, inline: true },
          { name: 'Tipo', value: tipo, inline: true },
          { name: 'Razon', value: razon },
          { name: 'Moderador', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Total sanciones', value: `${sanciones.get(miembro.id).length}`, inline: true },
        )
        .setColor(tipo === 'advertencia' ? 0xf1c40f : tipo === 'suspension' ? 0xe67e22 : 0xe74c3c)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Si es suspension, timeout de 12 horas y dar rol Perkin
      if (tipo === 'suspension') {
        const miembroGuild = await interaction.guild.members.fetch(miembro.id).catch(() => null);
        if (miembroGuild) {
          await miembroGuild.timeout(12 * 60 * 60 * 1000, razon).catch(() => {});
          const rolPerkin = await getRolPerkin(interaction.guild);
          await miembroGuild.roles.add(rolPerkin).catch(() => {});
        }
      }

      // Si es expulsion, quitar rol OD y roles de org
      if (tipo === 'expulsion') {
        const miembroGuild = await interaction.guild.members.fetch(miembro.id).catch(() => null);
        if (miembroGuild) {
          // Quitar rol OD
          if (miembroGuild.roles.cache.has(ROL_OD_ID)) await miembroGuild.roles.remove(ROL_OD_ID).catch(() => {});
          // Quitar todos los roles que no sean del sistema
          const rolesAQuitar = miembroGuild.roles.cache.filter(r =>
            r.id !== interaction.guild.id && // no @everyone
            r.id !== ROL_OD_ID // ya lo quitamos
          );
          for (const [, rol] of rolesAQuitar) {
            await miembroGuild.roles.remove(rol).catch(() => {});
          }
        }
      }

      await sendLog(interaction.guild, `${emojis[tipo]} Sancion`, `**${interaction.user.username}** sanciono a <@${miembro.id}> (${tipo}): ${razon}`, 0xe74c3c);
      return;
    }

    if (sub === 'ver') {
      const miembro = interaction.options.getUser('miembro');
      const lista = sanciones.get(miembro.id);
      if (!lista || lista.length === 0) {
        return interaction.reply({ content: `<@${miembro.id}> no tiene sanciones.`, ephemeral: true });
      }
      const emojis = { advertencia: '⚠️', suspension: '🔇', expulsion: '🚫' };
      const desc = lista.map((s, i) =>
        `**${i + 1}.** ${emojis[s.tipo]} ${s.tipo} — ${s.razon} — <@${s.moderador}> — <t:${Math.floor(new Date(s.fecha).getTime() / 1000)}:R>`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`Sanciones de ${miembro.username}`)
        .setDescription(desc)
        .setColor(0xe74c3c)
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'limpiar') {
      const miembro = interaction.options.getUser('miembro');
      sanciones.delete(miembro.id);
      // Quitar rol Perkin si lo tiene
      const miembroGuild = await interaction.guild.members.fetch(miembro.id).catch(() => null);
      if (miembroGuild && rolPerkinId && miembroGuild.roles.cache.has(rolPerkinId)) {
        await miembroGuild.roles.remove(rolPerkinId).catch(() => {});
      }
      await interaction.reply({ content: `Sanciones de <@${miembro.id}> limpiadas.` });
      await sendLog(interaction.guild, '🧹 Sanciones limpiadas', `**${interaction.user.username}** limpio las sanciones de <@${miembro.id}>.`, 0x95a5a6);
      return;
    }
  }
};
