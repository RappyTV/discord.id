module.exports = {
    error(error, req, res, next) {
        error.version = server.version;
        res.render('error', error);
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

    getTimestamp(id) {
        return Number(BigInt(id) >> 22n) + 1_420_070_400_000;
    }
}