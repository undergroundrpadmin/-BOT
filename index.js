require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { buildBienvenidaEmbed, sendLog } = require('./utils/helpers');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.commands = new Collection();

for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.on(Events.GuildMemberAdd, async (member) => {
  const canal = member.guild.channels.cache.get('1489121022580887655');
  if (canal) await canal.send(buildBienvenidaEmbed(member.user));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'verificar') {
    const rol = interaction.guild.roles.cache.get('1490160956662349947');
    if (!rol) return interaction.reply({ content: 'No existe el rol Ciudadano. Contacta a un admin.', ephemeral: true });
    if (interaction.member.roles.cache.has(rol.id)) return interaction.reply({ content: 'Ya estas verificado/a.', ephemeral: true });
    await interaction.member.roles.add(rol);
    await interaction.reply({ content: 'Verificado/a correctamente. Bienvenido/a al servidor.', ephemeral: true });
    await sendLog(interaction.guild, 'Verificacion', `**${interaction.user.username}** se verifico.`, 0x57f287);
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: 'Error al ejecutar el comando.', ephemeral: true };
    interaction.replied || interaction.deferred ? interaction.followUp(msg) : interaction.reply(msg);
  }
});

const ROL_OD_ID = '1490159958006824960';
const CATEGORIA_EXCLUIDA_ID = '1489512122709970954';

async function configurarPermisoRolOD(guild) {
  const rol = guild.roles.cache.get(ROL_OD_ID);
  if (!rol) return;

  for (const [, canal] of guild.channels.cache) {
    if (canal.type === 4) continue; // saltar categorias

    if (canal.parentId === CATEGORIA_EXCLUIDA_ID) {
      // Denegar acceso a canales de la categoria excluida
      await canal.permissionOverwrites.edit(rol, { ViewChannel: false, SendMessages: false }).catch(() => {});
    } else if (canal.id === '1490161234304303154') {
      // Solo este canal puede escribir
      await canal.permissionOverwrites.edit(rol, { ViewChannel: true, SendMessages: true }).catch(() => {});
    } else {
      // Ver pero no escribir en el resto
      await canal.permissionOverwrites.edit(rol, { ViewChannel: true, SendMessages: false }).catch(() => {});
    }
  }
}

// Quitar rol Perkin cuando termina el timeout
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const teniaSuspension = oldMember.communicationDisabledUntilTimestamp > Date.now();
  const yaNoTiene = !newMember.communicationDisabledUntilTimestamp || newMember.communicationDisabledUntilTimestamp <= Date.now();
  if (teniaSuspension && yaNoTiene) {
    const rolPerkin = newMember.guild.roles.cache.find(r => r.name === 'Perkin');
    if (rolPerkin && newMember.roles.cache.has(rolPerkin.id)) {
      await newMember.roles.remove(rolPerkin).catch(() => {});
      await sendLog(newMember.guild, 'Suspension terminada', `El timeout de <@${newMember.id}> termino. Rol Perkin removido.`, 0x57f287);
    }
  }
});

client.once(Events.ClientReady, async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (guild) await configurarPermisoRolOD(guild);
});

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

client.login(process.env.TOKEN);
