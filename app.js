const express = require(`express`);
global.server = {};
const app = express();
const https = require(`https`);
const http = require(`http`);
const path = require(`path`);
const axios = require(`axios`);
const { readFileSync, existsSync } = require("fs");

server.cfg = require(`./src/config.json`);
server.redirects = require(`./src/redirects.json`);
server.util = require(`./src/util`);
server.version = require(`./package.json`).version;

const options = {};

if(server.cfg.token.trim() == ``) {
    console.log(`[ERROR] Please provide a valid token in src/config.json!`);
    process.exit(1);
}
if(server.cfg.ssl.useSSL) {
    if(!existsSync(server.cfg.ssl.cert) || !existsSync(server.cfg.ssl.key)) {
        console.log(`[ERROR] Invalid certificate or private key path!\n[INFO] If you don't want to use an SSL certificate please disable the option in src/config.json!`);
        process.exit(1);
    }
    options.cert = readFileSync(server.cfg.ssl.cert);
    options.key = readFileSync(server.cfg.ssl.key);
}

if(server.cfg.ssl.useSSL) server.https = https.createServer(options, app).listen(server.cfg.ssl.port, () => {
    console.log(`[SERVER] HTTPS listening on port ${server.cfg.ssl.port}!`);
});

server.http = http.createServer(app).listen(server.cfg.port, async () => {
    const isTokenValid = await server.util.checkToken(server.cfg.token);

    if(!isTokenValid) {
        console.log(`[ERROR] Invalid token!`);
        process.exit(1);
    }
    console.log(`[SERVER] HTTP listening on port ${server.cfg.port}`);
});

// Views
app.set(`view engine`, `ejs`);
app.set(`views`, path.join(__dirname, `views`));
app.use(express.static(`./public`));

app.use((req, res, next) => {
    if(process.env.NODE_ENV != 'development' && !req.secure && server.cfg.ssl.useSSL) {
        return res.redirect("https://" + req.headers.host + req.url);
    }

    next();
});

// Index page
app.get(`/`, (req, res) => {
    res.status(200).render(`index`);
});

// Load pages without route
app.use((req, res, next) => {
    const file = req.originalUrl.slice(1).split(`?`)[0];
    const redirect = server.redirects.find((r) => r.path == file);
    if(redirect) return res.redirect(redirect.red);
    else next();
});

app.get(`/:id`, async (req, res, next) => {
    const id = req.params.id;
    if(!id) return next({ status: 400, error: `You have to enter a valid ID!`, back: `/` });
    if(!server.util.isSnowflake(id)) return next({ status: 400, error: `Invalid snowflake!`, back: `/` });

    const user = await server.util.fetchUser(id);
    const invite = await server.util.fetchGuild(id);

    if(user.success) {
        const { data } = user;
    
        const avatar = data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/${data.discriminator % 5}.png`;
        const banner = data.banner ? `https://cdn.discordapp.com/banners/${id}/${data.banner}.${data.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024` : null;
        const tag = `${data.username}#${data.discriminator}`;
        const badges = server.util.getUserBadges(data.public_flags).map((badge) => {
            return `<span><img src="img/${badge}.png" class="badgepng"></span>`;
        }).join(`\n`);
        const created = new Date(server.util.getTimestamp(id)).toUTCString();
        const color = data.banner_color;
    
        res.render(`user`, { avatar, banner, id, tag, bot: data.bot, badges, created, color });
    } else if(invite.success) {
        const { guild, channel, code } = invite;

        const icon = guild.icon ? `https://cdn.discordapp.com/icons/${id}/${guild.icon}.${guild.icon.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/0.png`;
        const banner = guild.banner ? `https://cdn.discordapp.com/banners/${id}/${guild.banner}.${guild.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024` : null;
        const inviteChannel = `https://discord.com/channels/${id}/${channel.id}`;
        const created = new Date(server.util.getTimestamp(id)).toUTCString();

        res.render(`guild`, {
            icon,
            banner,
            id,
            name: guild.name,
            created,
            invite: code,
            channelName: channel.name,
            inviteChannel
        });
    } else {
        // TODO: Create extra page
        res.render(`index`);
    }
});

app.use(server.util.error);