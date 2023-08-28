const express = require(`express`);
global.server = {};
const app = express();
const https = require(`https`);
const http = require(`http`);
const path = require(`path`);
const { readFileSync, existsSync } = require("fs");

server.cfg = require(`./src/config.json`);
server.redirects = require(`./src/redirects.json`);
server.util = require(`./src/util`);
server.version = require(`./package.json`).version;

const options = {};

if(server.cfg.token.trim() == `` && !server.cfg.testmode) {
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

    if(!isTokenValid && !server.cfg.testmode) {
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

// Pass default values once
app.use((req, res, next) => {
    res.locals.version = server.version;
    res.locals.themeColor = server.cfg.theme;
    res.locals.theme = `<style>\n#nav {\n\tbackground: ${server.cfg.theme};\n}\n\n.btn {\n\tbackground-color: ${server.cfg.theme};\n}\n\n.btn:hover {\n\tbackground-color: ${server.cfg.hover};\n}\n\n.btn:focus {\n\tbackground-color: ${server.cfg.hover};\n}\n</style>`;
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
    if(server.cfg.testmode) {
        // Testmode values
        const random = Math.floor(Math.random() * 3);
        const created = new Date(server.util.getTimestamp(id)).toUTCString();

        if(random == 0) {
            res.render(`user`, {
                avatar: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`,
                id,
                tag: `Clyde#0000`,
                globalName: `@clyde`,
                displayName: `Clyde`,
                migrated: !!Math.floor(Math.random() * 2),
                bot: false,
                badges: ``,
                created,
                color: server.cfg.theme
            });
        } else if(random == 1) {
            res.render(`guild`, {
                icon: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`,
                id,
                name: `Discord Guild`,
                created,
                boosts: Math.floor(Math.random() * 99) + 1,
                level: 3,
                nsfw: false,
                invite: `https://discord.com/invite/discord`,
                channelName: `welcome`,
                inviteChannel: `https://discord.com/channels/${id}/1234567890`
            });
        } else {
            res.render(`any`, { id, created });
        }
        return;
    }

    const created = new Date(server.util.getTimestamp(id)).toUTCString();
    const user = await server.util.fetchUser(id);
    if(user.success) {
        const { data } = user;
    
        const avatar = data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/${data.discriminator % 5}.png`;
        const banner = data.banner ? `https://cdn.discordapp.com/banners/${id}/${data.banner}.${data.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024` : null;
        const badges = server.util.getUserBadges(data.public_flags).map((badge) => {
            return `<span><img src="img/${badge}.png" class="badgepng"></span>`;
        }).join(`\n`);
        const color = data.banner_color;
    
        return res.render(`user`, { avatar, banner, id, tag: `${data.username}#${data.discriminator}`, globalName: data.username, displayName: data.global_name, migrated: data.discriminator == '0', bot: data.bot, badges, created, color });
    }

    const invite = await server.util.fetchGuild(id);
    if(invite.success) {
        const { guild, channel, code } = invite;

        const icon = guild.icon ? `https://cdn.discordapp.com/icons/${id}/${guild.icon}.${guild.icon.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/0.png`;
        const banner = guild.banner ? `https://cdn.discordapp.com/banners/${id}/${guild.banner}.${guild.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024` : null;
        const inviteChannel = `https://discord.com/channels/${id}/${channel.id}`;
        const boosts = guild.premium_subscription_count;

        return res.render(`guild`, {
            icon,
            banner,
            id,
            name: guild.name,
            created,
            boosts,
            nsfw: guild.nsfw,
            invite: code,
            channelName: channel.name,
            inviteChannel
        });
    }

    res.render(`any`, { id, created });
});

app.get(`/:id/icon`, async (req, res, next) => {
    const id = req.params.id;
    if(!id) return next({ status: 400, error: `You have to enter a valid ID!`, back: `/` });
    if(!server.util.isSnowflake(id)) return next({ status: 400, error: `Invalid snowflake!`, back: `/` });
    if(server.cfg.testmode) return res.redirect(`https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`);

    const user = await server.util.fetchUser(id);
    if(user.success) return res.redirect(user.data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${user.data.avatar}.${user.data.avatar.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/${user.data.discriminator % 5}.png`);
    
    const invite = await server.util.fetchGuild(id);
    if(invite.success) return res.redirect(invite.guild.icon ? `https://cdn.discordapp.com/icons/${id}/${invite.guild.icon}.${invite.guild.icon.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/0.png`);
    
    res.status(404).send({ error: `Icon not found!` });
});

app.get(`/:id/banner`, async (req, res, next) => {
    const id = req.params.id;
    if(!id) return next({ status: 400, error: `You have to enter a valid ID!`, back: `/` });
    if(!server.util.isSnowflake(id)) return next({ status: 400, error: `Invalid snowflake!`, back: `/` });
    if(server.cfg.testmode) return res.status(404).send({ error: `Banner not found!` });

    const user = await server.util.fetchUser(id);
    if(user.success) {
        if(!user.data.banner) return res.status(404).send({ error: `Banner not found!` });
        return res.redirect(`https://cdn.discordapp.com/banners/${id}/${user.data.banner}.${user.data.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024`);
    }
    const invite = await server.util.fetchGuild(id);

    if(invite.success) {
        if(!invite.guild.banner) return res.status(404).send({ error: `Banner not found!` });
        return res.redirect(`https://cdn.discordapp.com/banners/${id}/${invite.guild.banner}.${invite.guild.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024`);
    }
    res.status(404).send({ error: `Banner not found!` });
});

app.use(server.util.error);
app.use((req, res, next) => server.util.error({ status: 404, error: `Page not found!`, back: `/` }, req, res, next));