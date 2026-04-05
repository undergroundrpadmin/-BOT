const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Almacenamiento en memoria (reemplazar con DB si se necesita persistencia)
const organizaciones = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('org')
    .setDescription('Gestión de organizaciones')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('crear')
      .setDescription('Crear una organización')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addUserOption(o => o.setName('lider').setDescription('Líder de la org').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('info')
      .setDescription('Ver info de una organización')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('agregar')
      .setDescription('Agregar miembro a una organización')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addUserOption(o => o.setName('miembro').setDescription('Miembro a agregar').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('remover')
      .setDescription('Remover miembro de una organización')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addUserOption(o => o.setName('miembro').setDescription('Miembro a remover').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('lista')
      .setDescription('Ver todas las organizaciones')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'crear') {
      const nombre = interaction.options.getString('nombre');
      const lider = interaction.options.getUser('lider');
      if (organizaciones.has(nombre.toLowerCase())) {
        return interaction.reply({ content: `❌ Ya existe una org llamada **${nombre}**.`, ephemeral: true });
      }
      organizaciones.set(nombre.toLowerCase(), { nombre, lider: lider.id, miembros: [lider.id] });
      const embed = new EmbedBuilder()
        .setTitle('🏴 Organización creada')
        .addFields(
          { name: 'Nombre', value: nombre, inline: true },
          { name: 'Líder', value: `<@${lider.id}>`, inline: true }
        )
        .setColor(0xe74c3c)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'info') {
      const nombre = interaction.options.getString('nombre');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `❌ No existe la org **${nombre}**.`, ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle(`🏴 ${org.nombre}`)
        .addFields(
          { name: 'Líder', value: `<@${org.lider}>`, inline: true },
          { name: 'Miembros', value: org.miembros.map(id => `<@${id}>`).join('\n') || 'Ninguno', inline: false }
        )
        .setColor(0xe74c3c)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'agregar') {
      const nombre = interaction.options.getString('nombre');
      const miembro = interaction.options.getUser('miembro');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `❌ No existe la org **${nombre}**.`, ephemeral: true });
      if (org.miembros.includes(miembro.id)) return interaction.reply({ content: 'Ya es miembro.', ephemeral: true });
      org.miembros.push(miembro.id);
      return interaction.reply({ content: `✅ <@${miembro.id}> agregado/a a **${org.nombre}**.` });
    }

    if (sub === 'remover') {
      const nombre = interaction.options.getString('nombre');
      const miembro = interaction.options.getUser('miembro');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `❌ No existe la org **${nombre}**.`, ephemeral: true });
      org.miembros = org.miembros.filter(id => id !== miembro.id);
      return interaction.reply({ content: `✅ <@${miembro.id}> removido/a de **${org.nombre}**.` });
    }

    if (sub === 'lista') {
      if (organizaciones.size === 0) return interaction.reply({ content: 'No hay organizaciones registradas.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('🏴 Organizaciones activas')
        .setDescription([...organizaciones.values()].map(o => `• **${o.nombre}** — Líder: <@${o.lider}> — ${o.miembros.length} miembro(s)`).join('\n'))
        .setColor(0xe74c3c)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
};
