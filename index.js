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

// Cargar comandos
for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

// Bienvenida automática
client.on(Events.GuildMemberAdd, async (member) => {
  const canal = member.guild.channels.cache.get('1489121022580887655');
  if (canal) await canal.send(buildBienvenidaEmbed(member.user));
});

// Interacciones
client.on(Events.InteractionCreate, async (interaction) => {
  // Botón verificar
  if (interaction.isButton() && interaction.customId === 'verificar') {
    const rol = interaction.guild.roles.cache.find(r => r.name === 'OD');
    if (!rol) return interaction.reply({ content: '❌ No existe el rol "OD". Contacta a un admin.', ephemeral: true });
    if (interaction.member.roles.cache.has(rol.id)) return interaction.reply({ content: 'Ya estás verificado/a.', ephemeral: true });
    await interaction.member.roles.add(rol);
    await interaction.reply({ content: '✅ Verificado/a correctamente. Bienvenido/a al servidor.', ephemeral: true });
    await sendLog(interaction.guild, '✅ Verificación', `**${interaction.user.username}** se verificó.`, 0x57f287);
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: '❌ Error al ejecutar el comando.', ephemeral: true };
    interaction.replied || interaction.deferred ? interaction.followUp(msg) : interaction.reply(msg);
  }
});

client.once(Events.ClientReady, () => console.log(`✅ Bot conectado como ${client.user.tag}`));

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

client.login(process.env.TOKEN);
