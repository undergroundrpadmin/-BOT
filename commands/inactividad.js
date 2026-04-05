const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// TODO: migrar a base de datos
const ultimaActividad = new Map(); // userId -> timestamp

const ROL_OD_ID = '1490159958006824960';

module.exports = {
  ultimaActividad,

  data: new SlashCommandBuilder()
    .setName('inactividad')
    .setDescription('Sistema de inactividad de miembros')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('revisar')
      .setDescription('Ver miembros inactivos')
      .addIntegerOption(o => o
        .setName('dias')
        .setDescription('Dias sin actividad (default: 7)')
        .setMinValue(1)
        .setMaxValue(60)
      )
    )
    .addSubcommand(sub => sub
      .setName('ver')
      .setDescription('Ver ultima actividad de un miembro')
      .addUserOption(o => o.setName('miembro').setDescription('Miembro').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'revisar') {
      const dias = interaction.options.getInteger('dias') ?? 7;
      const limite = Date.now() - dias * 24 * 60 * 60 * 1000;

      await interaction.deferReply({ ephemeral: true });

      const miembrosOD = interaction.guild.members.cache.filter(m =>
        m.roles.cache.has(ROL_OD_ID) && !m.user.bot
      );

      const inactivos = [];
      for (const [, miembro] of miembrosOD) {
        const ultima = ultimaActividad.get(miembro.id);
        if (!ultima || ultima < limite) {
          inactivos.push({ id: miembro.id, ultima });
        }
      }

      if (inactivos.length === 0) {
        return interaction.editReply(`No hay miembros inactivos en los ultimos ${dias} dias.`);
      }

      const desc = inactivos.map(m => {
        const tiempo = m.ultima
          ? `<t:${Math.floor(m.ultima / 1000)}:R>`
          : 'Sin actividad registrada';
        return `<@${m.id}> — ${tiempo}`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`Miembros inactivos (+${dias} dias)`)
        .setDescription(desc)
        .setColor(0xe67e22)
        .setFooter({ text: 'Nota: solo se registra actividad desde que el bot esta en linea' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'ver') {
      const miembro = interaction.options.getUser('miembro');
      const ultima = ultimaActividad.get(miembro.id);
      const texto = ultima
        ? `Ultima actividad de <@${miembro.id}>: <t:${Math.floor(ultima / 1000)}:R>`
        : `No hay actividad registrada para <@${miembro.id}> desde que el bot esta en linea.`;
      return interaction.reply({ content: texto, ephemeral: true });
    }
  }
};
