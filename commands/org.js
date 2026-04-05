const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { sendLog } = require('../utils/helpers');

const organizaciones = new Map();

const TIPOS = {
  banda:   { max: 6,  emoji: '🔫', color: 0xe74c3c },
  mafia:   { max: 12, emoji: '🕴️', color: 0x8b0000 },
  drifter: { max: 18, emoji: '🚗', color: 0xf39c12 },
};

// Canal donde los roles de org pueden hablar
const CANAL_ORG_ID = '1490161234304303154';
// Canal exclusivo para lideres
const CANAL_LIDERES_ID = '1489510451564904558';

async function configurarPermisosCanalOrg(guild, rol) {
  const canal = guild.channels.cache.get(CANAL_ORG_ID);
  if (!canal) return;
  await canal.permissionOverwrites.edit(rol, {
    SendMessages: true,
    ViewChannel: true,
  });
}

async function configurarCanalLideres(guild, rolLider) {
  const canal = guild.channels.cache.get(CANAL_LIDERES_ID);
  if (!canal) return;
  // Asegurar que @everyone no puede escribir (solo una vez)
  await canal.permissionOverwrites.edit(guild.roles.everyone, {
    SendMessages: false,
    ViewChannel: false,
  });
  // Dar permiso al rol lider
  await canal.permissionOverwrites.edit(rolLider, {
    SendMessages: true,
    ViewChannel: true,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('org')
    .setDescription('Gestion de organizaciones')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('crear')
      .setDescription('Crear una organizacion')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addStringOption(o => o.setName('iniciales').setDescription('Iniciales de la org (ej: LCN)').setRequired(true))
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
      .setName('disolver')
      .setDescription('Disolver una organizacion y eliminar su rol')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('transferir')
      .setDescription('Transferir liderazgo de una org')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre de la org').setRequired(true))
      .addUserOption(o => o.setName('nuevo_lider').setDescription('Nuevo lider').setRequired(true))
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
      .setName('buscar')
      .setDescription('Ver a que org pertenece un usuario')
      .addUserOption(o => o.setName('usuario').setDescription('Usuario a buscar').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('lista')
      .setDescription('Ver todas las organizaciones')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'crear') {
      const nombre = interaction.options.getString('nombre');
      const iniciales = interaction.options.getString('iniciales').toUpperCase();
      const lider = interaction.options.getUser('lider');
      const tipo = interaction.options.getString('tipo');
      const cfg = TIPOS[tipo];

      if (organizaciones.has(nombre.toLowerCase())) {
        return interaction.reply({ content: `Ya existe una org llamada **${nombre}**.`, ephemeral: true });
      }

      await interaction.deferReply();

      // Rol de la org (para todos los miembros)
      const rolOrg = await interaction.guild.roles.create({
        name: nombre,
        color: cfg.color,
        reason: `Org creada por ${interaction.user.username}`
      });

      // Rol de lider con iniciales
      const rolLider = await interaction.guild.roles.create({
        name: `[${iniciales}] Lider`,
        color: cfg.color,
        reason: `Lider de ${nombre}`
      });

      // Permisos: rol org solo puede hablar en canal org
      await configurarPermisosCanalOrg(interaction.guild, rolOrg);
      // Permisos: rol lider puede escribir en canal lideres
      await configurarCanalLideres(interaction.guild, rolLider);

      // Dar ambos roles al lider
      const miembroLider = await interaction.guild.members.fetch(lider.id);
      await miembroLider.roles.add(rolOrg);
      await miembroLider.roles.add(rolLider);

      organizaciones.set(nombre.toLowerCase(), {
        nombre, iniciales, tipo,
        lider: lider.id,
        miembros: [lider.id],
        rolId: rolOrg.id,
        rolLiderId: rolLider.id
      });

      const embed = new EmbedBuilder()
        .setTitle(`${cfg.emoji} Organizacion creada`)
        .addFields(
          { name: 'Nombre', value: nombre, inline: true },
          { name: 'Iniciales', value: iniciales, inline: true },
          { name: 'Tipo', value: `${cfg.emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, inline: true },
          { name: 'Maximo', value: `${cfg.max} miembros`, inline: true },
          { name: 'Lider', value: `<@${lider.id}>`, inline: true },
          { name: 'Rol org', value: `<@&${rolOrg.id}>`, inline: true },
          { name: 'Rol lider', value: `<@&${rolLider.id}>`, inline: true },
        )
        .setColor(cfg.color)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendLog(interaction.guild, `${cfg.emoji} Org creada`, `**${interaction.user.username}** creo la org **${nombre}** [${iniciales}] (${tipo}) con lider <@${lider.id}>.`, cfg.color);
      return;
    }

    if (sub === 'disolver') {
      const nombre = interaction.options.getString('nombre');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });

      await interaction.deferReply();
      const cfg = TIPOS[org.tipo];

      // Eliminar roles
      const rolOrg = interaction.guild.roles.cache.get(org.rolId);
      const rolLider = interaction.guild.roles.cache.get(org.rolLiderId);
      if (rolOrg) await rolOrg.delete();
      if (rolLider) await rolLider.delete();

      organizaciones.delete(nombre.toLowerCase());

      await interaction.editReply({ content: `La org **${nombre}** fue disuelta y sus roles eliminados.` });
      await sendLog(interaction.guild, `${cfg.emoji} Org disuelta`, `**${interaction.user.username}** disolvio la org **${nombre}**.`, 0x95a5a6);
      return;
    }

    if (sub === 'transferir') {
      const nombre = interaction.options.getString('nombre');
      const nuevoLider = interaction.options.getUser('nuevo_lider');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });

      await interaction.deferReply();
      const cfg = TIPOS[org.tipo];

      const anteriorLider = await interaction.guild.members.fetch(org.lider);
      const nuevoLiderMember = await interaction.guild.members.fetch(nuevoLider.id);

      // Quitar rol lider al anterior
      if (org.rolLiderId) await anteriorLider.roles.remove(org.rolLiderId);
      // Dar rol lider al nuevo
      if (org.rolLiderId) await nuevoLiderMember.roles.add(org.rolLiderId);
      // Asegurar que el nuevo lider tiene el rol de org
      if (org.rolId) await nuevoLiderMember.roles.add(org.rolId);

      const liderAnteriorId = org.lider;
      org.lider = nuevoLider.id;
      if (!org.miembros.includes(nuevoLider.id)) org.miembros.push(nuevoLider.id);

      await interaction.editReply({ content: `Liderazgo de **${org.nombre}** transferido a <@${nuevoLider.id}>.` });
      await sendLog(interaction.guild, `${cfg.emoji} Liderazgo transferido`, `**${interaction.user.username}** transfrio el liderazgo de **${org.nombre}** de <@${liderAnteriorId}> a <@${nuevoLider.id}>.`, cfg.color);
      return;
    }

    if (sub === 'info') {
      const nombre = interaction.options.getString('nombre');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });
      const cfg = TIPOS[org.tipo];
      const embed = new EmbedBuilder()
        .setTitle(`${cfg.emoji} ${org.nombre} [${org.iniciales}]`)
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
      await interaction.reply({ content: `<@${miembro.id}> agregado/a a **${org.nombre}**. (${org.miembros.length}/${cfg.max})` });
      await sendLog(interaction.guild, `${cfg.emoji} Miembro agregado`, `**${interaction.user.username}** agrego a <@${miembro.id}> a **${org.nombre}**. (${org.miembros.length}/${cfg.max})`, cfg.color);
      return;
    }

    if (sub === 'remover') {
      const nombre = interaction.options.getString('nombre');
      const miembro = interaction.options.getUser('miembro');
      const org = organizaciones.get(nombre.toLowerCase());
      if (!org) return interaction.reply({ content: `No existe la org **${nombre}**.`, ephemeral: true });
      const cfg = TIPOS[org.tipo];
      org.miembros = org.miembros.filter(id => id !== miembro.id);
      if (org.rolId) {
        const miembroGuild = await interaction.guild.members.fetch(miembro.id);
        await miembroGuild.roles.remove(org.rolId);
      }
      await interaction.reply({ content: `<@${miembro.id}> removido/a de **${org.nombre}**.` });
      await sendLog(interaction.guild, `${cfg.emoji} Miembro removido`, `**${interaction.user.username}** removio a <@${miembro.id}> de **${org.nombre}**.`, cfg.color);
      return;
    }

    if (sub === 'buscar') {
      const usuario = interaction.options.getUser('usuario');
      const orgsDelUsuario = [...organizaciones.values()].filter(o => o.miembros.includes(usuario.id));
      if (orgsDelUsuario.length === 0) {
        return interaction.reply({ content: `<@${usuario.id}> no pertenece a ninguna organizacion.`, ephemeral: true });
      }
      const desc = orgsDelUsuario.map(o => {
        const cfg = TIPOS[o.tipo];
        const esLider = o.lider === usuario.id ? ' (Lider)' : '';
        return `${cfg.emoji} **${o.nombre}** [${o.iniciales}] — ${o.tipo}${esLider}`;
      }).join('\n');
      const embed = new EmbedBuilder()
        .setTitle(`Organizaciones de ${usuario.username}`)
        .setDescription(desc)
        .setColor(0x2b2d31)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'lista') {
      if (organizaciones.size === 0) return interaction.reply({ content: 'No hay organizaciones registradas.', ephemeral: true });
      const desc = [...organizaciones.values()].map(o => {
        const cfg = TIPOS[o.tipo];
        return `${cfg.emoji} **${o.nombre}** [${o.iniciales}] (${o.tipo}) — Lider: <@${o.lider}> — ${o.miembros.length}/${cfg.max}`;
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
