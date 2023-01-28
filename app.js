const express = require(`express`);
global.server = {};
const app = express();
const https = require(`https`);
const path = require(`path`);
const axios = require(`axios`);
const { readFileSync } = require("fs");

server.cfg = require(`./src/config.json`);
server.redirects = require(`./src/redirects.json`);
server.util = require(`./src/util`);

if(server.cfg.token.trim() == ``) {
    console.log(`[ERROR] Please provide a valid token in src/config.json!`);
    process.exit(1);
}

const options = {
    cert: readFileSync(server.cfg.certificate.cert),
    key: readFileSync(server.cfg.certificate.key)
}

server.https = https.createServer(options, app).listen(server.cfg.port, () => {
    console.log(`[SERVER] HTTPS listening on Port ${server.cfg.port}!`);
});

// Views
app.set(`view engine`, `ejs`);
app.set(`views`, path.join(__dirname, `views`));
app.use(express.static(`./public`));

app.use((req, res, next) => {
    if(process.env.NODE_ENV != 'development' && !req.secure) {
        return res.redirect("https://" + req.headers.host + req.url);
    }
    if(req.headers.host.includes(`rappytv.com:10000`)) return res.redirect(`https://id.rappytv.com`);

    next();
});

// Index page
app.get(`/`, (req, res) => {
    res.status(200).render(`index`);
});

// Test page
app.get(`/test`, (req, res) => {
    res.status(200).render(`test`);
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
    if(!id || id.trim() == `` || id.length < 15 || isNaN(id)) return next({ status: 404, error: `Page not found! You sure you clicked the correct link?`, back: `/` });

    const request = await axios({
        method: `get`,
        url: `https://discord.com/api/v10/users/${id}`,
        headers: {
            'Authorization': `Bot ${server.cfg.token}`
        }
    }).catch((err) => {
        return { err };
    });
    if(request.err) return next({ status: request.err.response.status, error: request.err.response.statusText });
    const { data } = request;

    const pfp = data.avatar ? `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${data.avatar.startsWith(`a_`) ? `gif` : `png`}?size=1024` : `https://cdn.discordapp.com/embed/avatars/${data.discriminator % 5}.png`;
    const banner = data.banner ? `https://cdn.discordapp.com/banners/${id}/${data.banner}.${data.banner.startsWith(`a_`) ? `gif` : `png`}?size=1024` : null;
    const tag = `${data.username}#${data.discriminator}`;
    const badges = server.util.getUserBadges(data.public_flags).map((badge) => {
        return `<span><img src="img/${badge}.png" class="badgepng"></span>`;
    }).join(`\n`);
    const created = new Date(server.util.getTimestamp(id)).toUTCString();
    const color = data.banner_color;

    res.render(`user`, { pfp, banner, id, tag, bot: data.bot, badges, created, color });
});

app.use(server.util.error);