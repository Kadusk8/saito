const fetch = require('node-fetch');

async function test() {
  const url = "http://localhost:3001/api/instances/kadmo/send-from-url"; // Try to send audio to 'grupo 1'
  const body = {
    type: "audio",
    number: "120363405958710319@g.us", // "grupo 1"
    mediaUrl: "https://nyqvnuxzgaakdzdcshba.supabase.co/storage/v1/object/public/saito-temp-media/temp/test-audio.ogg"
  };
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error(e);
  }
}

test();
