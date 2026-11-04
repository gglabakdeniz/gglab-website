function doPost(e) {
  try {
    var p = e.parameter;
    var formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfkOgCkpMYZ9gA0aBbfutLg7HTju5x2HThv128ED1-JptEbPw/formResponse";
    
    var payload = {
      "fvv": "1",
      "pageHistory": "0",
      "fbzx": "3983006562636888000",
      "entry.1997965049": p["entry.1997965049"] || "", // Takım Durumu
      "entry.1184375414": p["entry.1184375414"] || "", // Ekip Adı
      "entry.1134329616": p["entry.1134329616"] || "", // Ekip Kişi Sayısı
      "entry.1931800937": p["entry.1931800937"] || "", // Ad Soyad
      "entry.1902448112": p["entry.1902448112"] || "", // Telefon Numarası
      "entry.1688247342": p["entry.1688247342"] || "", // E-Posta Adresi
      "entry.1100947727": p["entry.1100947727"] || "", // Discord Kullanıcı Adı
      "entry.2134735804": p["entry.2134735804"] || "", // Takım Arkadaşları Adı Soyadı
      "entry.668568936":  p["entry.668568936"]  || "", // Takım Arkadaşları Telefon Numarası
      "entry.1128498041": p["entry.1128498041"] || "", // Deneyimler
      "entry.779154997":  p["entry.779154997"]  || "", // Portfolyo
      "entry.803991046":  p["entry.803991046"]  || "", // Jam Deneyimi
      "entry.495135122":  p["entry.495135122"]  || "", // Rol
      "entry.1752156407": p["entry.1752156407"] || "", // Sorular / Eklemek istedikleriniz
      "entry.151869497":  p["entry.151869497"]  || ""  // Etkinlikten nasıl haberdar oldunuz
    };

    // 1. Google Form'a arka plandan gönderilir
    var response = UrlFetchApp.fetch(formUrl, {
      method: "post",
      payload: payload,
      muteHttpExceptions: true,
      followRedirects: true
    });

    var code = response.getResponseCode();

    if (code >= 200 && code < 400) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Yedek: Doğrudan aktif E-Tabloya yaz
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(),
      payload["entry.1997965049"],
      payload["entry.1184375414"],
      payload["entry.1134329616"],
      payload["entry.1931800937"],
      payload["entry.1902448112"],
      payload["entry.1688247342"],
      payload["entry.1100947727"],
      payload["entry.2134735804"],
      payload["entry.668568936"],
      payload["entry.1128498041"],
      payload["entry.779154997"],
      payload["entry.803991046"],
      payload["entry.495135122"],
      payload["entry.1752156407"],
      payload["entry.151869497"]
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("GGJ27 Form Doğrulama Servisi Aktif.")
    .setMimeType(ContentService.MimeType.TEXT);
}
