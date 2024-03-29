# [https://id.rappytv.com](https://id.rappytv.com)
> This is an inofficial remake of [discord.id](https://discord.id)<br>
> You need to have [node.js](https://nodejs.org) installed!

### 1️⃣ Installation
You can clone the repository with
```
git clone https://github.com/RappyTV/discord.id.git
```
Or download it [here](https://github.com/RappyTV/discord.id/archive/refs/heads/master.zip) if you don't have [git](https://git-scm.com/downloads) installed.<br>
Then just install the needed dependencies with `npm i`.

### 2️⃣ Configure it
You should create a `src/config.json` file based on the [example config](https://github.com/RappyTV/discord.id/blob/master/src/config.json.example):
```json
{
    "port": 10000,
    "token": "",
    "testmode": false,
    "theme": "#ff0000",
    "hover": "#ff7777",
    "ssl": {
        "useSSL": true,
        "port": 11000,
        "cert": "",
        "key": ""
    }
}
```
- `port` - The http port
- `token` - Your bot's token (you can't fetch users without a bot token)
- `testmode` - Toggles the testmode (In testmode you don't need to provide a bot token)
- `theme` - The color of the button and navbar
- `hover` - The color of the button when hovering over it
- `ssl.useSSL` - If the server should use an SSL certificate
- `ssl.port` - The https port
- `ssl.cert` - The path to your fullchain certificate file
- `ssl.key` - The path to your private key file

### 3️⃣ Redirects
To redirect custom paths to a specific url add an object like this to the array in [src/redirects.json](https://github.com/RappyTV/discord.id/blob/master/src/redirects.json):
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
Just execute the `npm run start` or `node .` command to start the server.<br>
**Have fun!**
