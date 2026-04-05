const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const organizaciones = new Map();

const TIPOS = {
  banda:   { max: 6,  emoji: '🔫', color: 0xe74c3c },
  mafia:   { max: 12, emoji: '🕴️', color: 0x8b0000 },
  drifter: { max: 18, emoji: '🚗', color: 0xf39c12 },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('org')
    .setDescription('Gestion de organizaciones')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('crear')
      .setDescription('Crear una organizacion')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addUserOption(o => o.setName('lider').setDescription('Lider de la org').setRequired(true))
      .addStringOption(o => o
        .setName('tipo')
        .setDescription('Tipo de organizacion')
        .setRequired(true)
        .addChoices(
          { name: 'Banda (max 6)', value: 'banda' },
          { name: 'Mafia (max 12)', value: 'mafia' },
          { name: 'Drifter (max 18)', value: 'drifter' },
        )
      )
    )
    .addSubcommand(sub => sub
      .setName('info')
      .setDescription('Ver info de una organizacion')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('agregar')
      .setDescription('Agregar miembro a una organizacion')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addUserOption(o => o.setName('miembro').setDescription('Miembro a agregar').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('remover')
      .setDescription('Remover miembro de una organizacion')
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
      const tipo = interaction.options.getString('tipo');
      const cfg = TIPOS[tipo];

      if (organizaciones.has(nombre.toLowerCase())) {
        return interaction.reply({ content: `Ya existe una org llamada **${nombre}**.`, ephemeral: true });
      }

      const rol = await interaction.guild.roles.create({
        name: nombre,
        color: cfg.color,
        reason: `Org creada por ${interaction.user.username}`
      });

      const miembroLider = await interaction.guild.members.fetch(lider.id);
      await miembroLider.roles.add(rol);

      organizaciones.set(nombre.toLowerCase(), { nombre, tipo, lider: lider.id, miembros: [lider.id], rolId: rol.id });

      const embed = new EmbedBuilder()
        .setTitle(`${cfg.emoji} Organizacion creada`)
        .addFields(
          { name: 'Nombre', value: nombre, inline: true },
          { name: 'Tipo', value: `${cfg.emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, inline: true },
          { name: 'Maximo', value: `${cfg.max} miembros`, inline: true },
          { name: 'Lider', value: `<@${lider.id}>`, inline: true },
          { name: 'Rol', value: `<@&${rol.id}>`, inline: true },
        )
        .setColor(cfg.color)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'info') {
      const nombre = interaction.options.getString('nombre');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });
      const cfg = TIPOS[org.tipo];
      const embed = new EmbedBuilder()
        .setTitle(`${cfg.emoji} ${org.nombre}`)
        .addFields(
          { name: 'Tipo', value: `${cfg.emoji} ${org.tipo.charAt(0).toUpperCase() + org.tipo.slice(1)}`, inline: true },
          { name: 'Lider', value: `<@${org.lider}>`, inline: true },
          { name: 'Miembros', value: `${org.miembros.length}/${cfg.max}`, inline: true },
          { name: 'Lista', value: org.miembros.map(id => `<@${id}>`).join('\n') || 'Ninguno' }
        )
        .setColor(cfg.color)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'agregar') {
      const nombre = interaction.options.getString('nombre');
      const miembro = interaction.options.getUser('miembro');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });
      if (org.miembros.includes(miembro.id)) return interaction.reply({ content: 'Ya es miembro.', ephemeral: true });
      const cfg = TIPOS[org.tipo];
      if (org.miembros.length >= cfg.max) {
        return interaction.reply({ content: `La org **${org.nombre}** ya alcanzo el maximo de ${cfg.max} miembros.`, ephemeral: true });
      }
      org.miembros.push(miembro.id);
      if (org.rolId) {
        const miembroGuild = await interaction.guild.members.fetch(miembro.id);
        await miembroGuild.roles.add(org.rolId);
      }
      return interaction.reply({ content: `<@${miembro.id}> agregado/a a **${org.nombre}**. (${org.miembros.length}/${cfg.max})` });
    }

    if (sub === 'remover') {
      const nombre = interaction.options.getString('nombre');
      const miembro = interaction.options.getUser('miembro');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });
      org.miembros = org.miembros.filter(id => id !== miembro.id);
      if (org.rolId) {
        const miembroGuild = await interaction.guild.members.fetch(miembro.id);
        await miembroGuild.roles.remove(org.rolId);
      }
      return interaction.reply({ content: `<@${miembro.id}> removido/a de **${org.nombre}**.` });
    }

    if (sub === 'lista') {
      if (organizaciones.size === 0) return interaction.reply({ content: 'No hay organizaciones registradas.', ephemeral: true });
      const desc = [...organizaciones.values()].map(o => {
        const cfg = TIPOS[o.tipo];
        return `${cfg.emoji} **${o.nombre}** (${o.tipo}) — Lider: <@${o.lider}> — ${o.miembros.length}/${cfg.max}`;
      }).join('\n');
      const embed = new EmbedBuilder()
        .setTitle('🏴 Organizaciones activas')
        .setDescription(desc)
        .setColor(0x2b2d31)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  }
};
