const { Request, Response, NextFunction } = require("express");
const { default: axios } = require("axios");

module.exports = {

    /**
     * 
     * @param {{ status: number, error: string }} error 
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */

    error(error, req, res, next) {
        res.render('error', error);
    },

    /**
     * 
     * @param {string} token 
     * @returns {Promise<boolean>}
     */

    async checkToken(token) {
        try {
            await axios({
                url: `https://discord.com/api/v10/users/@me`,
                method: `get`,
                headers: {
                    "Authorization": `Bot ${token}`
                }
            });
        } catch(err) {
            return false;
        }
        return true;
    },
    
    getUserBadges(flags) {
        if(!flags) flags = 0;
        const data = [0, 1, 2, 3, 6, 7, 8, 9, 14, 16, 17, 18, 19, 22]
        const badges = [];

        data.forEach((flag) => {
            if((flags & (1 << flag)) != 0) {
                badges.push(flag);
            }
        });

        return badges;
    },

    /**
     * 
     * @param {string} id 
     * @returns {any}
     */

    async fetchUser(id) {
        try {
            const request = await axios({
                method: `get`,
                url: `https://discord.com/api/v10/users/${id}`,
                headers: {
                    'Authorization': `Bot ${server.cfg.token}`
                }
            });
            const { data } = request;
            return { success: true, data };
        } catch(err) {
            return { success: false, status: err.response?.status, error: err.response?.status };
        }
    },

    /**
     * 
     * @param {string} id 
     * @returns {any}
     */

    async fetchGuild(id) {
        try {
            const widget = await axios({
                url: `https://discord.com/api/v10/guilds/${id}/widget.json`,
                method: `get`,
                headers: {
                    "Authorization": `Bot ${server.cfg.token}`
                }
            });

            const { instant_invite } = widget.data;

            try {
                const request = await axios({
                    url: `https://discord.com/api/v10/invites/${instant_invite.split('/')[4]}`,
                    method: `get`,
                    headers: {
                        "Authorization": `Bot ${server.cfg.token}`
                    }
                });
                const { guild, channel } = request.data;

                return {
                    success: true,
                    guild,
                    channel,
                    code: instant_invite
                }
            } catch(err) {
                return { success: false, error: `The widget invite could not be retrieved!` };
            }
        } catch(err) {
            if(err.response.status == 404) return { success: false, error: `Unknown Guild.` };
            if(err.response?.status == 403) return { success: false, error: `This server's widget is disabled.` };
            return { success: false, error: err.response?.data?.msg };
        }
    },

    /**
     * 
     * @param {string} id 
     * @returns {boolean}
     */

    isSnowflake(id) {
        if(isNaN(id)) return false;
        if(id.length < 14) return false;
        return BigInt(id).toString() === id;
    },

    /**
     * 
     * @param {string} id 
     * @returns {number}
     */

    getTimestamp(id) {
        return Number((BigInt(id) >> 22n) + 1420070400000n);
    },

    clearCache() {
        server.cache.icons.clear();
        server.cache.banners.clear();
    }
}