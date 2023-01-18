# [https://id.rappytv.com](https://id.rappytv.com)
> This is an inofficial remake of [discord.id](https://discord.id)<br>
> You need to have [node.js](https://nodejs.org) installed!

### 1️⃣ Installation
You can clone the repository with
```
git clone https://github.com/UltronDevelopment/discord.id.git
```
Or download it [here](https://github.com/UltronDevelopment/discord.id/archive/refs/heads/master.zip) if you don't have [git](https://git-scm.com/downloads) installed.<br>
Then just install the needed dependencies with `npm i`.

### 2️⃣ Configure it
Your [src/config.json](https://github.com/UltronDevelopment/discord.id/blob/master/src/config.json) will look like this:
```json
{
    "port": 10000,
    "token": "",
    "certificate": {
        "cert": "",
        "key": ""
    }
}
```
Just insert a bot token (you can't fetch users without a bot) and set the port to your desired port the website should run on (only https)<br>
Then insert the path to your certificate into `certificate.cert` and the path to your key to `certificate.key`.

### 3️⃣ Redirects
To redirect custom paths to a specific url add an object like this to the array in [src/redirects.json](https://github.com/UltronDevelopment/discord.id/blob/master/src/redirects.json):
```json
{
    "path": "",
    "red": ""
}
```
Into `path` you insert the custom path (domain.tld/PATH) and into `red` you put the url which the path should redirect to.<br>
**Example:**
```json
[
    {
        "path": "myserver",
        "red": "https://discord.gg/myserver"
    }
]
```
Now `https://domain.tld/myserver` will redirect you to `https://discord.gg/myserver`.

### 4️⃣ Start the server
Just execute the `npm run start` or `node .` command to start the bot.<br>
**Have fun!**