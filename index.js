
const fs = require("fs"); 
const moment = require("moment");
const qrcode = require("qrcode-terminal"); 
const { Client, MessageMedia } = require("whatsapp-web.js"); 
const mqtt = require("mqtt"); 
const listen = mqtt.connect("mqtt://test.mosquitto.org"); 
const fetch = require("node-fetch"); 
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const SESSION_FILE_PATH = "./session.json";
// file is included here
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}
client = new Client({   
    
       puppeteer: {
        headless: true,
    args: [
      "--log-level=3", // fatal only
   
      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-site-isolation-trials",
      "--no-experiments",
      "--ignore-gpu-blacklist",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
    
      "--disable-extensions",
      "--disable-default-apps",
      "--enable-features=NetworkService",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    
      "--no-first-run",
      "--no-zygote"
    ]
    
    },        
    session: sessionCfg
});
// You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.

client.initialize();

// ======================= Begin initialize WAbot

client.on("qr", qr => {
  // NOTE: This event will not be fired if a session is specified.
  qrcode.generate(qr, {
    small: true
  });
  console.log(`[ ${moment().format("HH:mm:ss")} ] Please Scan QR with app!`);
});

client.on("authenticated", session => {
  console.log(`[ ${moment().format("HH:mm:ss")} ] Authenticated Success!`);
  // console.log(session);
  sessionCfg = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    if (err) {
      console.error(err);
    }
  });
});

client.on("auth_failure", msg => {
  // Fired if session restore was unsuccessfull
  console.log(
    `[ ${moment().format("HH:mm:ss")} ] AUTHENTICATION FAILURE \n ${msg}`
  );
  fs.unlink("./session.json", function(err) {
    if (err) return console.log(err);
    console.log(
      `[ ${moment().format("HH:mm:ss")} ] Session Deleted, Please Restart!`
    );
    process.exit(1);
  });
});

client.on("ready", () => {
  console.log(`[ ${moment().format("HH:mm:ss")} ] Whatsapp bot ready!`);
});

// ======================= Begin initialize mqtt broker

listen.on("connect", () => {
  listen.subscribe("corona", function(err) {
    if (!err) {
      console.log(`[ ${moment().format("HH:mm:ss")} ] Mqtt topic subscribed!`);
    }
  });
});

// ======================= WaBot Listen on Event

client.on("message_create", msg => {
  // Fired on all message creations, including your own
  if (msg.fromMe) {
    // do stuff here
  }
});

client.on("message_revoke_everyone", async (after, before) => {
  // Fired whenever a message is deleted by anyone (including you)
  // console.log(after); // message after it was deleted.
  if (before) {
    console.log(before.body); // message before it was deleted.
  }
});

client.on("message_revoke_me", async msg => {
  // Fired whenever a message is only deleted in your own view.
  // console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
  /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

  if (ack == 3) {
    // The message was read
  }
});
client.on('group_join', async (notification) => {
    // User has joined or been added to the group. 
    console.log('join', notification);
    const botno = notification.chatId.split('@')[0];
    let number = await notification.id.remote;
    client.sendMessage(number, `Hai perkenalkan aku WiBot, selamat datang di group ini`);
  
    const chats = await client.getChats();
    for (i in chats) {
        if (number == chats[i].id._serialized) {
            chat = chats[i];
        }
    }
    var participants = {};
    var admins = {};
    var i;
    for (let participant of chat.participants) {
        if (participant.id.user == botno) { continue; }
        //participants.push(participant.id.user);
        const contact = await client.getContactById(participant.id._serialized);
        participants[contact.pushname] = participant.id.user;
        // participant needs to send a message for it to be defined
        if (participant.isAdmin) {
            //admins.push(participant.id.user);
            admins[contact.pushname] = participant.id.user;
            client.sendMessage(participant.id._serialized, 'Hai admin, ada member baru di group mu');
            const media = MessageMedia.fromFilePath('./test/test.pdf');
            client.sendMessage(participant.id._serialized, media);
        }
    }
    console.log('Group Details');
    console.log('Name: ', chat.name);
    console.log('Participants: ', participants);
    console.log('Admins: ', admins);
    //notification.reply('User joined.'); // sends message to self
});

client.on('group_leave', async (notification) => {
    // User has joined or been added to the group. 
    console.log('leave', notification);
    const botno = notification.chatId.split('@')[0];
    let number = await notification.id.remote;
    client.sendMessage(number, `Selamat tinggal kawan`);
  
    const chats = await client.getChats();
    for (i in chats) {
        if (number == chats[i].id._serialized) {
            chat = chats[i];
        }
    }
    var participants = {};
    var admins = {};
    var i;
    for (let participant of chat.participants) {
        if (participant.id.user == botno) { continue; }
        //participants.push(participant.id.user);
        const contact = await client.getContactById(participant.id._serialized);
        participants[contact.pushname] = participant.id.user;
        // participant needs to send a message for it to be defined
        if (participant.isAdmin) {
            //admins.push(participant.id.user);
            admins[contact.pushname] = participant.id.user;
            client.sendMessage(participant.id._serialized, 'Hai admin, ada member yang keluar di group mu');
            const media = MessageMedia.fromFilePath('./test/test.pdf');
            client.sendMessage(participant.id._serialized, media);
        }
    }
    console.log('Group Details');
    console.log('Name: ', chat.name);
    console.log('Participants: ', participants);
    console.log('Admins: ', admins);
    //notification.reply('User joined.'); // sends message to self
});

client.on("group_update", notification => {
  // Group picture, subject or description has been updated.
  console.log("update", notification);
});

client.on("disconnected", reason => {
  console.log("Client was logged out", reason);
});

// ======================= WaBot Listen on message

client.on("message", async msg => {
  // console.log('MESSAGE RECEIVED', msg);
    const chat = await msg.getChat();
    const users = await msg.getContact()
    const dariGC = msg['author']
    const dariPC = msg['from']
  console.log(` ${chat} 
  participant
  `)
  msg.body = msg.body.toLowerCase()
const botTol = () => {
        msg.reply('🚫 Maaf, fitur ini hanya untuk admin(owner).')
        return
    }
    const botTol2 = () => {
        msg.reply(`🚫 Maaf, fitur ini hanya untuk 'Group Chat'.`)
        return
    }

    if (msg.body.startsWith('!subject ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.body.slice(9)
                chat.setSubject(title)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body === '!getmember') {
        const chat = await msg.getChat();

        let text = "";
        let mentions = [];

        for(let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);

            mentions.push(contact);
      text += "Hai ";
            text += `@${participant.id.user} `;
      text += "\n";
        }

        chat.sendMessage(text, { mentions });
    } else if (msg.body.startsWith('!deskripsi ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user ) {
                let title = msg.body.split("!deskripsi ")[1]
                chat.setDescription(title)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!promote ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                const contact = await msg.getContact();
                const title = msg.mentionedIds[0]
                chat.promoteParticipants([`${title}`])
                chat.sendMessage(`[:] @${title.replace('@c.us', '')} sekarang anda adalah admin sob 🔥`)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!demote ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.mentionedIds[0]
                chat.demoteParticipants([`${title}`])
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!add ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '')) {
                let title = msg.body.slice(5)
                if (title.indexOf('62') == -1) {
                    chat.addParticipants([`${title.replace('0', '62')}@c.us`])
                    msg.reply(`[:] Selamat datang @${title}! jangan lupa baca Deskripsi group yah 😎👊🏻`)
                } else {
                    msg.reply('[:] Format nomor harus 0821xxxxxx')
                }
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!kick ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.mentionedIds
                chat.removeParticipants([...title])
                // console.log([...title]);
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body == '!delete' && msg.hasQuotedMsg) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
              const quotedMsg = await msg.getQuotedMessage();
              if (quotedMsg.fromMe) {
                  quotedMsg.delete(true);
              } else {
                  msg.reply('Hanya bisa menghapus pesan dari saya sendiri');
              }
                // console.log([...title]);
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body == '!owner') {
        if (chat.isGroup) {
            msg.reply(JSON.stringify({
                owner: chat.owner.user
            }))
        } else {
            botTol2()
        }
    } 


  if (msg.type == "ciphertext") {
    // Send a new message as a reply to the current one
    msg.reply("kirim !menu atau !help untuk melihat menu.");
  }
  else if (msg.body == "!ping") {
    // Send a new message as a reply to the current one
    msg.reply("pong");
  }else if (msg.body.startsWith("!anime")) {
var fs = require('fs');
var files = fs.readdirSync('./kwpin')

/* now files is an Array of the name of the files in the folder and you can pick a random name inside of that array */
var  gambar = files[Math.floor(Math.random() * files.length)] 
var yuli = fs.readFileSync(
        "./kwpin/"+ gambar,
        "base64"
      );
const media = new MessageMedia('image/jpg', yuli);

console.log(gambar);
client.sendMessage(media);
}
 else if (msg.body.startsWith("!makeff ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!makeff ")[1];
   var nama = h.split("] ")[1];
   var kata1 = h.split("[")[1].split("]")[0];
    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://ephoto360.com/tao-banner-youtube-game-free-fire-online-635.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
          await page.click("#radio0-radio-83d1c1baf4c44e72bacc6cb8fe1c92a0");
     await page.type("#text-1", kata1);
   
      await page.type("#text-0", nama);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/ff.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/ff.jpg');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
 else if (msg.body.startsWith("!glowtext ")) {
   msg.reply("sebentarr.. kita proses dulu")
    var h = msg.body.split("!glowtext ")[1];

    const { exec } = require("child_process");

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,

    });
    const page = await browser.newPage();
    await page
      .goto("https://en.ephoto360.com/advanced-glow-effects-74.html", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
      await page.type("#text-0", h);
    await page.click("#submit");
    await new Promise(resolve => setTimeout(resolve, 10000));
        try {
         
          await page.waitForSelector(
            "#link-image"
          );
          const element = await page.$(
         "div.thumbnail > img"
          );
          const text = await (await element.getProperty("src")).jsonValue();
         console.log(text);

        exec('wget "' + text + '" -O mp4/glow.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/glow.jpg');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(error);
       

        }
      })
      .catch((err) => {
        console.log(error);
    
      });
   
   
  })();
 }
  else if (msg.body.startsWith("!fb ")) {
    msg.reply(`*Hai, Kita Proses Dulu Ya . . .*`);
    let link = msg.body.split(" ")[1];
  var namafile = "gue.mp4"
  const { exec } = require("child_process");
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
      ],
    });
    const page = await browser.newPage();
    await page
      .goto("https://id.savefrom.net/download-from-instagram", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
        await page.type("#sf_url", `${link}`);
        await page.click("#sf_submit");
        try {
          msg.reply("Mendownload Video!");
          await page.waitForSelector(
            "#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a"
          );
          const element = await page.$(
            "#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a"
          );
          const text = await (await element.getProperty("href")).jsonValue();
          const judul = await page.$(
            "#sf_result > div > div.result-box.video > div.info-box > div.meta > div"
          );
          const judul1 = await (await judul.getProperty("title")).jsonValue();
          console.log(
            `[${moment().format("hh:mm:ss")}][!fb][${
              msg.from
            }] > Berhasil Dilakukan`
          );
          msg.reply(
            `*BERHASIL!!!*
Judul : ${judul1}
        
        
 _ Facebook Downloader By InsideHeartz _`
          );
      
exec('wget "' + text + '" -O mp4/'+ namafile +'.mp4', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/'+ namafile +'.mp4');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(
            `[${moment().format("hh:mm:ss")}][!fb][${
              msg.from
            }] > GAGAL Dilakukan`
          );
          msg.reply(
            `[GAGAL] PASTIKAN LINK VIDEO BERSIFAT PUBLIK DAN DAPAT DIAKSES OLEH SEMUA ORANG!*`
          );
          browser.close();
        }
      })
      .catch((err) => {
        console.log(
          `[${moment().format("hh:mm:ss")}][!fb][${msg.from}] > GAGAL Dilakukan`
        );
        msg.reply(
          `[GAGAL] Server Sedang Down!\n\nSilahkan Coba Beberapa Saat Lagi!`
        );
        browser.close();
      });
   
   
  } 
else if (msg.body.startsWith("!translate ")) {
const translatte = require('translatte');
var codelang = msg.body.split("[")[1].split("]")[0];
var text = msg.body.split("]")[1];
translatte(text, {to: codelang}).then(res => {
    msg.reply(res.text);
}).catch(err => {
    msg.reply(err);
});
}
else if (msg.body.startsWith('!join ')) {
        const inviteCode = msg.body.split(' ')[1];
        try {
            await client.acceptInvite(inviteCode);
            msg.reply('Joined the group!');
        } catch (e) {
            msg.reply('That invite code seems to be invalid.');
        }
    }

else if (msg.body.startsWith("!wiki ")) {
const cheerio = require('cheerio');
const request = require('request');
var yos = msg.body.split("!wiki ")[1]
var jokowi = yos.replace(/ /g, "%20");
function foreach(arr, func){
  for(var i in arr){
    func(i, arr[i]);
  }
}
var url = "https://id.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles="+ jokowi
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     url,
},function(error, response, body){
    let $ = cheerio.load(body);
    var d = JSON.parse(body);
var fik = body.split('"extract":"')[1];
console.log(`

/////////////
`)
msg.reply(fik)
});

}
else if (msg.body.startsWith("!fb ")) {

const request = require('request');
var req = msg.body.split(" ")[1];
const { exec } = require("child_process");
var crypto = require('crypto');
var fs = require('fs'); 

var filename = 'video'+crypto.randomBytes(4).readUInt32LE(0)+'saya';
var path = require('path');
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'https://fbdownloader.net/download/?url='+ req,
},function(error, response, body){
    let $ = cheerio.load(body);
   var gehu = $('a[rel="noreferrer no-follow"]').attr('href');
msg.reply("bentarr lagi di proses dulu ya .. 😣");
exec('wget "' + gehu + '" -O mp4/gue.mp4', (error, stdout, stderr) => {
     const media = MessageMedia.fromFilePath('mp4/gue.mp4');
chat.sendMessage(media);
   
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
    msg.reply("yahh gagal 😭");
        return;
    }

    console.log(`stdout: ${stdout}`);
});
});
}else if (msg.body.startsWith("!igv ")) {
    msg.reply(`*Hai, Kita Proses Dulu Ya . . .*`);
    let link = msg.body.split(" ")[1];
  var namafile = link.split("/p/")[1].split("/")[0];

  const { exec } = require("child_process");
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
      ],
    });
    const page = await browser.newPage();
    await page
      .goto("https://id.savefrom.net/download-from-instagram", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
        await page.type("#sf_url", `${link}`);
        await page.click("#sf_submit");
        try {
          msg.reply("Mendownload Video!");
          await page.waitForSelector(
            "#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a"
          );
          const element = await page.$(
            "#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a"
          );
          const text = await (await element.getProperty("href")).jsonValue();
          const judul = await page.$(
            "#sf_result > div > div.result-box.video > div.info-box > div.meta > div"
          );
          const judul1 = await (await judul.getProperty("title")).jsonValue();
          console.log(
            `[${moment().format("hh:mm:ss")}][!fb][${
              msg.from
            }] > Berhasil Dilakukan`
          );
          msg.reply(
            `*BERHASIL..!!!*
Judul : ${judul1}
        
        
 _ Instagram Downloader By InsideHeartz _
 
 Sedang mengirimkan video .. 🎬`
          );

exec('wget "' + text + '" -O mp4/'+ namafile +'.mp4', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/'+ namafile +'.mp4');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(
            `[${moment().format("hh:mm:ss")}][!fb][${
              msg.from
            }] > GAGAL Dilakukan`
          );
          msg.reply(
            `[GAGAL] PASTIKAN LINK VIDEO BERSIFAT PUBLIK DAN DAPAT DIAKSES OLEH SEMUA ORANG!*`
          );
          browser.close();
        }
      })
      .catch((err) => {
        console.log(
          `[${moment().format("hh:mm:ss")}][!fb][${msg.from}] > GAGAL Dilakukan`
        );
        msg.reply(
          `[GAGAL] Server Sedang Down!\n\nSilahkan Coba Beberapa Saat Lagi!`
        );
        browser.close();
      });
   
   
  } 
  else if (msg.body.startsWith("!igp ")) {
    msg.reply(`*Hai, Kita Proses Dulu Ya . . .*`);
    let link = msg.body.split(" ")[1];
  var namafile = link.split("/p/")[1].split("/")[0];

  const { exec } = require("child_process");
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
      ],
    });
    const page = await browser.newPage();
    await page
      .goto("https://id.savefrom.net/download-from-instagram", {
        waitUntil: "networkidle2",
      })
      .then(async () => {
        await page.type("#sf_url", `${link}`);
        await page.click("#sf_submit");
        try {
          msg.reply("Mendownload Video!");
          await page.waitForSelector(
            "#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a"
          );
          const element = await page.$(
            "#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a"
          );
          const text = await (await element.getProperty("href")).jsonValue();
          const judul = await page.$(
            "#sf_result > div > div.result-box.video > div.info-box > div.meta > div"
          );
          const judul1 = await (await judul.getProperty("title")).jsonValue();
          console.log(
            `[${moment().format("hh:mm:ss")}][!fb][${
              msg.from
            }] > Berhasil Dilakukan`
          );
          msg.reply(
            `*BERHASIL..!!!*
Judul : ${judul1}
        
        
 _ Instagram Downloader By InsideHeartz _
 
 Sedang mengirimkan video .. 🎬`
          );

exec('wget "' + text + '" -O mp4/'+ namafile +'.jpg', (error, stdout, stderr) => {
  const media = MessageMedia.fromFilePath('mp4/'+ namafile +'.jpg');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
          browser.close();
        } catch (error) {
          console.log(
            `[${moment().format("hh:mm:ss")}][!fb][${
              msg.from
            }] > GAGAL Dilakukan`
          );
          msg.reply(
            `[GAGAL] PASTIKAN LINK VIDEO BERSIFAT PUBLIK DAN DAPAT DIAKSES OLEH SEMUA ORANG!*`
          );
          browser.close();
        }
      })
      .catch((err) => {
        console.log(
          `[${moment().format("hh:mm:ss")}][!fb][${msg.from}] > GAGAL Dilakukan`
        );
        msg.reply(
          `[GAGAL] Server Sedang Down!\n\nSilahkan Coba Beberapa Saat Lagi!`
        );
        browser.close();
      });
   
   
  } 
else if (msg.body.startsWith("!brainly ")) {
var hh = msg.body.split("!brainly ")[1]
var tanya = hh.replace(/ /g, "%20");
const fetch = require('node-fetch')

const url = "https://tools.aqin.my.id/api/brainly/?q="+ tanya
var regex = /<br\s*[\/]?>/gi;
const solution = () => {
  fetch(url).then(res => res.json()).then((res) => {
    
res.data.questionSearch.edges.slice(-2).forEach(item => {
  var tanyaan = item.node.content
    item.node.answers.nodes.slice(-2).forEach(item => { 
 var jawaban = item['content']
 var g = jawaban.replace(regex, "\n")
 var h  = g.replace(/<[^>]*>?/gm, '');
  msg.reply(
        `
        
      ======================
    
        Pertanyaan : 
    
      *${tanyaan.replace(regex, "\n")}*
      
      
      Jawaban : 
    
      *${h}*
    ======================
      `);
   
      })
      console.log("=========")
    })
  })
}

solution();

}

else if (msg.body.startsWith("!sial ")) {
const request = require('request');
var req = msg.body;
var tanggal = req.split(" ")[1];
var kk = req.split(" ")[2];
var bulan = kk.replace("0", "");
var tahun = req.split(" ")[3];
request.post({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://www.primbon.com/primbon_hari_naas.php',
  body: "tgl="+ tanggal +"&bln="+ bulan +"&thn="+ tahun +"&submit=+Submit%21+"
},function(error, response, body){
    let $ = cheerio.load(body);
var y = $.html().split('<b>PRIMBON HARI NAAS</b><br><br>')[1];
    var t = y.split('.</i><br><br>')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
    var d = h.replace("&amp;", '&')
console.log(""+ d);
msg.reply(` 

-----------------------------------

 Cek Hari Naas Kamu ~
 
 
 ${d}
 
 
 ----------------------------------
  _ InsideHeartz 2020_
 
 `); 
});
}

else if (msg.body.startsWith("!pasangan ")) {
const request = require('request');
var req = msg.body;
var gh = req.split("!pasangan ")[1];

var namamu = gh.split("&")[0];
var pasangan = gh.split("&")[1];
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'http://www.primbon.com/kecocokan_nama_pasangan.php?nama1='+ namamu +'&nama2='+ pasangan +'&proses=+Submit%21+',
 
},function(error, response, body){
    let $ = cheerio.load(body);
var y = $.html().split('<b>KECOCOKAN JODOH BERDASARKAN NAMA PASANGAN</b><br><br>')[1];
    var t = y.split('.<br><br>')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
    var d = h.replace("&amp;", '&')
console.log(""+ d);
msg.reply(` 

-----------------------------------

 *Cek Kecocokan Jodoh Berdasarkan Nama ~*
 
 
 ${d}
 
 
 ----------------------------------
  _ InsideHeartz 2020 _
 
 `); 
});
}

else if (msg.body == "!wait") {
  const fs = require("fs");
const { exec } = require("child_process");

    const chat = await msg.getChat();
    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      
fs.writeFileSync("example.jpg", attachmentData.data, {encoding: 'base64'}, function(err) {
    console.log('File created');
});
const fetch = require("node-fetch")
const imageToBase64 = require('image-to-base64');
let response = ''
imageToBase64("example.jpg") // you can also to use url
    .then(
        (response) => {
fetch("https://trace.moe/api/search", {
  method: "POST",
  body: JSON.stringify({ image: response}),
  headers: { "Content-Type": "application/json" }
})
  .then(res => res.json())
  .then(result =>  {
var teks = `
*Informasi Anime*

Tingkat Kecocokan  : *${(result.docs[0].similarity * 100).toFixed(2)}%*
Judul Jepang : *${result.docs[0].title}*
Ejaan Judul : *${result.docs[0].title_romaji}*
Episode : *${result.docs[0].episode}*
Tayang Perdana  : *${result.docs[0].season}*

(Jika tingkat kecocokan dibawah 85%, kemungkinan salah)
`;
var video = `https://trace.moe/thumbnail.php?anilist_id=${result.docs[0].anilist_id}&file=${encodeURIComponent(result.docs[0].filename)}&t=${result.docs[0].at}&token=${result.docs[0].tokenthumb}`;
exec('wget "' + video + '" -O anime.jpg', (error, stdout, stderr) => {

let media = MessageMedia.fromFilePath('anime.jpg');
  client.sendMessage(msg.from, media, {
  caption: teks });
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
 });
 }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
        }
    )

  }
else{
    const tutor = MessageMedia.fromFilePath('tutor.jpeg');

    client.sendMessage(msg.from, tutor, {
        caption: "Kirim gambar dengan caption *!wait* \n sesuai gambar diatas lalu tunggu sampai \n kita menemukan hasilnya"
      });
    }
}

   else if (msg.body == "#donasi" ||
    msg.body === "donasi ") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, ` 
  null
  `);
  }
     else if (msg.body == "!rules" ||
    msg.body === "rules ") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, ` 
  Rules ... !!!


• *Jangan spam bot ..*
 
• *Jangan rusuh kalo bot gaaktif*
• *Jangan telfon / vc bot nya ..*
     ( _auto block_ )
• *Jangan req yang aneh aneh ..*
  _seperti mendownload video ber jam jam_
  
• *Sesuai kan perintah dengan formatnya..*

_salah format dan bot error = block_

Konsekuensi :

 Melanggar rules bot akan keluar 
atau member yang nge rusuh harus di kick 


Rules ini untuk kenyamanan semua yang memakai
bot ini


  `);
  }
 else if (msg.body == "!randomhentai") {
const cheerio = require('cheerio');
const request = require('request');

const { exec } = require("child_process");
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'https://api.computerfreaker.cf/v1/nsfwneko',
 
},function(error, response, body){
    let $ = cheerio.load(body);
    var d = JSON.parse(body);
console.log(d.url); 
exec('wget "' + d.url + '" -O ok.jpg', (error, stdout, stderr) => {
  var media = MessageMedia.fromFilePath('ok.jpg');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
});
}
else if (msg.body == "!randomanime") {
const cheerio = require('cheerio');
const request = require('request');

const { exec } = require("child_process");
request.get({
  headers: {'content-type' : 'application/x-www-form-urlencoded'},
  url:     'https://api.computerfreaker.cf/v1/anime',
 
},function(error, response, body){
    let $ = cheerio.load(body);
    var d = JSON.parse(body);
console.log(d.url); 
exec('wget "' + d.url + '" -O anime/nime.jpg', (error, stdout, stderr) => {
  var media = MessageMedia.fromFilePath('anime/nime.jpg');

  chat.sendMessage(media);
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
});
}
//test

else if (msg.body.startsWith("!nh ")) {
const  request = require('request');
const { exec } = require("child_process");
var nucc = msg.body.split("!nh ")[1];
request('http://3.80.205.249/' + nucc, function (error, response, body) {
const data = JSON.parse(body);

if (data.title == null) {msg.reply("Kode Tidak Ditemukan. Coba kode lain seperti 177013")}
else {

if (data.details.parodies == null) {var parodi = 'original' }
else {var parodi = data.details.parodies.join().replace((/[0-9]/g), "")};
if (data.details.artists == null) {var pembuat = 'tidak diketahui' }
else {var pembuat = data.details.artists.join().replace((/[0-9]/g), "")};
var teks = `*Judul*: ${data.title} 
*Parodi*: ${parodi}
*Genre*: ${data.details.tags.join().replace((/[0-9]/g), "").replace((/K/g), ", ")}
*Pembuat*: ${pembuat}
*Total Halaman*: ${data.details.pages} halaman
*Upload*: ${data.details.uploaded}
*Link*: ${data.link}`

var video = data.pages[0];
exec('wget "' + video + '" -O cover.jpg', (error, stdout, stderr) => {

let media = MessageMedia.fromFilePath('cover.jpg');
  client.sendMessage(msg.from, media, {
  caption: teks });
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
};
});
}



//end test

//test 2

else if (msg.body.startsWith("!sauce")) {
const  request = require('request');
const fs = require("fs");
const { exec } = require("child_process");

    const chat = await msg.getChat();
    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      
fs.writeFileSync("bego.jpg", attachmentData.data, {encoding: 'base64'}, function(err) {
    console.log('File created');
})


var nucc = Math.random().toString(36).substr(2, 4);
request('https://saucenao.com/search.php?db=999&output_type=2&testmode=1&numres=1&api_key=aba222eb501940e4c86031dcd93b2e3dce9e0e8b&url=http://3.80.205.249:5000/poto/' + nucc, function (error, response, body) {
const data = JSON.parse(body);

var isix = data.results[0].header;
var isiy = data.results[0].data;

if (isix.index_id == 2 || isix.index_id == 38 || isix.index_id == 18 || isix.index_id == 16 )
{
var sumber = isiy.source.replace((/ /g), "%20");
var teks = `*Sauce Hentai*: ${isiy.source} 
*Kemiripan*: ${isix.similarity}%
*Pembuat*: ${isiy.creator[0]}
*Link Sauce*: https://hitomi.la/search.html?${sumber}`
} else if ( isix.index_id == 21 )
{
  msg.reply("gunakan perintah !wait untuk mencari judul anime")
} else if ( isix.index_id == 37 )
{
var teks = `*Judul*: ${isiy.source} 
*Chapter*: ${isiy.part}
*Kemiripan*: ${isix.similarity}%
*Artist*: ${isiy.artist}
*Author*: ${isiy.author}
*Link Sauce*: ${isiy.ext_urls[0]}`
} else {
var teks = `*Judul*: ${isiy.title} 
*Kemiripan*: ${isix.similarity}%
*Pembuat*: ${isiy.member_name}
*Link Sauce*: ${isiy.ext_urls[0]}`
}

var video = isix.thumbnail;
exec('wget "' + video + '" -O coverx.jpg', (error, stdout, stderr) => {

let media = MessageMedia.fromFilePath('coverx.jpg');
  client.sendMessage(msg.from, media, {
  caption: teks });
  if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});

});
} else{
    const tutor = MessageMedia.fromFilePath('x.jpeg');

    client.sendMessage(msg.from, tutor, {
        caption: "Kirim gambar dengan caption *!sauce* \n sesuai gambar diatas lalu tunggu sampai \n kita menemukan hasilnya"
      });
    };
}

//end test 2

//start test 3

 else if (msg.body == "!penyegar" ){
    const axios = require("axios");
    const imageToBase64 = require('image-to-base64');
    var items = ["Cosplaystyle anime kawaii", "hijab cantik", "japanese girl", "cosplay japan girl"];
    var cewe = items[Math.floor(Math.random() * items.length)];
    var url = "http://api.fdci.se/rep.php?gambar=" + cewe;
    
 axios.get(url)
  .then((result) => {
    var b = JSON.parse(JSON.stringify(result.data));
    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {
 
    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Hai Kak 😊` });
            }
        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )
    
    });
    }
//end test 3

//test 4

else if (msg.body == "!menu" || msg.body == "!help") {
 const contact = await msg.getContact()
        const nama = contact.pushname !== undefined ? `Hai, kak ${contact.pushname} 😃` : 'Hai 😃'
        client.sendMessage(msg.from, `
${nama}
kenalin aku WiBot! 😂 robot buat para Wibu.
*DAFTAR PERINTAH*
!menu / !help  =>  Menampilkan menu utama
!ping  =>  pong
!nh (kode) misalnya !nh 177013 => melihat informasi kode nuklir.
!wait  =>  mencari judul anime
!sauce => mencari sumber fanart, manga, doujin
!randomanime  =>  gambar anime random
!randomhentai  =>  gambar Hentai random
!penyegar  =>  penyegar timeline.
Made with hateful, crazy and desperate 🤪 by Bobby`)
}

//end test 4

  else if (msg.body.startsWith("!sendto ")) {
    // Direct send a new message to specific id
    let number = msg.body.split(" ")[1];
    let messageIndex = msg.body.indexOf(number) + number.length;
    let message = msg.body.slice(messageIndex, msg.body.length);
    number = number.includes("@c.us") ? number : `${number}@c.us`;
    let chat = await msg.getChat();
    chat.sendSeen();
    client.sendMessage(number, message);
  }
  else if (msg.body == "iya?" ||
    msg.body === "iya") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, "Gabut bangettt sihhh ngechat bot.. 🤭");
  }
  else if (msg.body == "save dong" || msg.body == "save donk" || msg.body == "Save ya" || msg.body == "Save") {
    client.sendMessage(msg.from, "Ogah")
  }
  else if (msg.body == "kamu bot?" || msg.body == "kamu robot"|| msg.body == "bot ya") {
    client.sendMessage(msg.from, "ya")
  }
 else if (msg.body == "p" ||
    msg.body === "assalamualaikum") {
    // Send a new message to the same chat
    client.sendMessage(msg.from, "Iya?");
  } 

});

