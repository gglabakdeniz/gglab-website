function doPost(e) {
  try {
    var p = e.parameter;
    var formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfEpftE9JDVqMI04wBRz5IhrA6Ta3Fx3TKP5myDxRIIstmIMw/formResponse";

    // Rol çoklu seçim: aynı entry birden fazla değer taşıyabilir
    var roles = (e.parameters && e.parameters["entry.1275043880"]) || [];

    var payload = {
      "fvv": "1",
      "pageHistory": "0,1,2",
      "entry.715307404":  p["entry.715307404"]  || "", // Ad Soyad
      "entry.594352403":  p["entry.594352403"]  || "", // E-posta
      "entry.1559231557": p["entry.1559231557"] || "", // Telefon
      "entry.2093882172": p["entry.2093882172"] || "", // Fakülte
      "entry.1921067409": p["entry.1921067409"] || "", // Bölüm
      "entry.1670716095": p["entry.1670716095"] || "", // Öğrenci no
      "entry.1508233597": p["entry.1508233597"] || "", // TC Kimlik
      "entry.860246774":  p["entry.860246774"]  || "", // Daha önce proje yaptın mı
      "entry.2092844788": p["entry.2092844788"] || "", // Detay
      "entry.1275043880": roles,                       // Roller
      "entry.1275043880.other_option_response": p["entry.1275043880.other_option_response"] || "",
      "entry.1070764940": p["entry.1070764940"] || "", // Katkı
      "entry.970005994":  p["entry.970005994"]  || "", // Beklenti
      "entry.1987817685": p["entry.1987817685"] || ""  // Eklemek istedikleri
    };

    // Diğer seçilmediyse boş "other" alanını gönderme
    if (!payload["entry.1275043880.other_option_response"]) {
      delete payload["entry.1275043880.other_option_response"];
    }

    // 1. Google Form'a arka plandan gönderilir (ve bağlı E-Tabloya yazar)
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
      payload["entry.715307404"],
      payload["entry.594352403"],
      payload["entry.1559231557"],
      payload["entry.2093882172"],
      payload["entry.1921067409"],
      payload["entry.1670716095"],
      payload["entry.1508233597"],
      payload["entry.860246774"],
      payload["entry.2092844788"],
      roles.join(", "),
      payload["entry.1070764940"],
      payload["entry.970005994"],
      payload["entry.1987817685"]
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
    .createTextOutput("GG Lab Üyelik Form Doğrulama Servisi Aktif.")
    .setMimeType(ContentService.MimeType.TEXT);
}
