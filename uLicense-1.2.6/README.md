# °º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸

Thanks for purchasing uLicense! <3

Startup guide:
I assume you have a solid understanding of linux & you know how to setup
a VPS or any other server to host on. You should have tmux or screen
so you have have one "window" for dashboard and one for Discord.
example: tmux a -t bot, tmux a -t dashboard. You can also run both,
Discord bot and Dashboard from one instance by installing required
node modules in main folder "npm install" & "npm start".

If you need any help with setup, please join our Discord-server
for support & questions: https://discord.gg/3bPF2GkeN5

There is channel for #support-tickets and you can also get your customer role in Discord 😊

# BEFORE YOU DO ANYTHING

1. Make sure you have Node installed in your system. You can check your node version using
   "node -v" and node package manager using npm -v. Node version should be 12.0.0 or higher!

    When you have Nodejs in your system you should update NPM(node package manager) to latest.
    => npm install -g npm@latest

    Node tutorial: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-debian-10
    => If you have a Windows machine, download Node.js here:
    Windows: https://nodejs.org/en/download/

2. Setup MongoDB in your system.
   Mongodb tutorial: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/
   => If you setup uLicense on a Windows machine, download mongodb community server!
   Windows: https://www.mongodb.com/try/download/community

3. TMUX/Screen is preferred for linux. You can have 2 instances (one for bot, and one for dashboard)
   or you can run both from one instance by downloading main folder Node modules and
   using start script from there => npm install & npm start

4. Remember that you can get support from our Discord. Link is on top of this readme file.
   There are no stupid questions. You can ask literally anything!

# DASHBOARD GUIDE

1.  Make sure you have Node installed in your system. Check: https://nodejs.org/en/
    => type "node -v" and "npm -v" in your terminal. Both should give your versions.

2.  Go inside dashboard and type "npm i" into your terminal.

3.  Open .env- file inside dashboard and fill in your information.
    => Port should be 80 unless you have a solid reason for using other port

4.  Make sure you have MongoDB installed and your connection string inside .env is valid!
    => Don't leave any fields empty inside .env
    => If you have your database in the same server, connection string should be this:
    => mongodb://localhost:27017/YOUR_DATABASE_NAME
    You can replace YOUR_DATABASE_NAME with anything you want!

5.  Run "npm start" in your terminal. Panel should be running after that. Default port is 80.

6.  You should get API key on your first start logged to console! Save this, because you need
    it later. Now if you have received dashboard message in your console, dashboard should be running
    on your IP. If you have Windows machine, dashboard is located in: http://localhost/

# You should have solid firewall in your VPS/Dedicated. Cloudflare is also recommended!

# DISCORD BOT GUIDE

1. Create Discord bot application in and get your bot token: https://discord.com/developers/applications

2. Fill in your details in config.json inside discord folder

3. Run "npm i" in your terminal (inside discord folder)

4. Run "npm start" and bot should be running.

5. MAKE SURE YOU SETUP YOUR DISCORDID IN DASHBOARDS "SETTINGS" MENU.
   => DISCORD BOT WILL ONLY WORK FOR THAT ID

# USING JAVA CLASS / API

1. You can access uLicense API by using 'POST' request. This is pre implemented in Java class.

2. Default route for api is: http://YOUR_DOMAIN/api/v1
   => When using the API you need to have your API key in the "Authorization" header.

    Different API responses [Note that logging these in clientside is not recommended]:

    FAILED_AUTHENTICATION // Wrong API key or wrong licensekey
    EXPIRED_LICENSE // Expired licensekey
    MAXIMUM_IPS // Maximum IPs reached
    INVALID_PLUGIN // Wrong plugin name
    SUCCESSFUL_AUTHENTICATION // Successful authentication
    BLACKLISTED_AUTH // Blacklisted IP or HWID

3. You can get your API key from MongoDB. You can use something like MongoDB compass for easy access.
   => API key is randomly generated in first startup and stored in database.

4. You need to include these values in your post request by default:
   {
   "hwid": "HardwareID",
   "license": "Licensekey",
   "plugin": "Plugin name",
   "version": "1.0.0",
   }

5. Node.js / javascript / LUA [FiveM] documentation can be found in our Discord-server! Join there!

# °º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸°º¤ø,¸¸,ø¤º°`°º¤ø,¸,ø¤°º¤ø,¸¸,ø¤º°`°º¤ø,¸

%%**NONCE**%%
