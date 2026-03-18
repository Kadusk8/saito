const fetch = require('node-fetch');

async function test() {
  const url = "http://localhost:8080/message/sendWhatsAppAudio/kadmo";
  const body = {
    number: "120363405958710319@g.us",
    audio: "https://nyqvnuxzgaakdzdcshba.supabase.co/storage/v1/object/public/saito-temp-media/temp/1773254085548-file", // random or old public url
    encoding: true
  };
  
  const res = await fetch("http://localhost:8080/message/sendWhatsAppAudio/kadmo", {
    method: 'POST',
    headers: { 'apikey': 'global-api-key', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const text = await res.text();
  console.log(`STATUS: ${res.status}`);
  console.log(`RESPONSE: ${text}`);
}

test();
