const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AuditLogEvent } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Ver logs recientes del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .addIntegerOption(o => o
      .setName('cantidad')
      .setDescription('Cantidad de logs a mostrar (máx 10)')
      .setMinValue(1)
      .setMaxValue(10)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const cantidad = interaction.options.getInteger('cantidad') ?? 5;

    const auditLogs = await interaction.guild.fetchAuditLogs({ limit: cantidad });
    const entries = auditLogs.entries;

    if (entries.size === 0) {
      return interaction.editReply('No hay logs disponibles.');
    }

    const actionNames = {
      [AuditLogEvent.MemberKick]: '👢 Kick',
      [AuditLogEvent.MemberBanAdd]: '🔨 Ban',
      [AuditLogEvent.MemberBanRemove]: '✅ Unban',
      [AuditLogEvent.MemberRoleUpdate]: '🎖️ Rol actualizado',
      [AuditLogEvent.ChannelCreate]: '📢 Canal creado',
      [AuditLogEvent.ChannelDelete]: '🗑️ Canal eliminado',
      [AuditLogEvent.RoleCreate]: '🏷️ Rol creado',
      [AuditLogEvent.RoleDelete]: '🗑️ Rol eliminado',
    };

    const desc = entries.map(entry => {
      const accion = actionNames[entry.action] ?? `Acción ${entry.action}`;
      const ejecutor = entry.executor ? `<@${entry.executor.id}>` : 'Desconocido';
      const objetivo = entry.target?.id ? `<@${entry.target.id}>` : entry.target?.name ?? '—';
      const tiempo = `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>`;
      return `${accion} — por ${ejecutor} → ${objetivo} ${tiempo}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('📋 Logs recientes')
      .setDescription(desc)
      .setColor(0x95a5a6)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
