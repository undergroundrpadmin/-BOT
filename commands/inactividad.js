const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// TODO: migrar a base de datos
const ultimaActividad = new Map(); // userId -> timestamp

const ROL_OD_ID = '1490159958006824960';

const FRASES_INACTIVIDAD = [
  'Las calles no esperan a nadie. Tu organización te necesita activo.',
  'Se detectó tu ausencia. En este mundo, desaparecer tiene consecuencias.',
  'Los que no aparecen, son olvidados. No dejes que eso te pase.',
  'Tu silencio está siendo notado. Volvé antes de que sea tarde.',
  'En UGRP, la inactividad es una señal de debilidad. Demostrá lo contrario.',
  'Alguien preguntó por vos. No hagas esperar a tu gente.',
  'El tiempo corre y vos no aparecés. ¿Todo bien del otro lado?',
  'Las organizaciones se construyen con presencia. La tuya te extraña.',
  'Un fantasma no puede liderar ni seguir. Aparecé.',
  'La calle no perdona la ausencia. Recordá que tenés un lugar acá.',
  'Tu inactividad fue registrada. Esto es un aviso, no una amenaza... todavía.',
  'En este negocio, el que no aparece, pierde su lugar.',
  'Se te está buscando. Más vale que sea por buenas razones.',
  'Días sin verte. Tu organización sigue en pie, ¿y vos?',
  'El mundo sigue girando aunque vos no estés. Pero tu lugar podría no esperarte.',
  'Ausencia prolongada detectada. Considerá esto una llamada de atención.',
  'No sabemos si estás o no estás. Eso es un problema.',
  'Tu organización no puede cubrirte para siempre. Aparecé.',
  'Los inactivos son los primeros en ser reemplazados. No seas uno de ellos.',
  'Este es un recordatorio amistoso: existís, y se nota cuando no estás.',
  'La lealtad se demuestra con presencia. ¿Dónde estás?',
  'Días de silencio. En UGRP eso no pasa desapercibido.',
  'Tu lugar sigue siendo tuyo, pero no por mucho tiempo si no aparecés.',
  'Se registró inactividad en tu cuenta. Volvé al ruedo antes de que te saquen de él.',
];

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
      const frasesUsadas = new Set();

      for (const [, miembro] of miembrosOD) {
        const ultima = ultimaActividad.get(miembro.id);
        if (!ultima || ultima < limite) {
          inactivos.push({ id: miembro.id, ultima });

          // Enviar DM con frase aleatoria sin repetir hasta agotar todas
          if (frasesUsadas.size >= FRASES_INACTIVIDAD.length) frasesUsadas.clear();
          let idx;
          do { idx = Math.floor(Math.random() * FRASES_INACTIVIDAD.length); } while (frasesUsadas.has(idx));
          frasesUsadas.add(idx);

          miembro.send(`> *${FRASES_INACTIVIDAD[idx]}*\n\n— OD UGRP`).catch(() => {});
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
