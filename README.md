# GG Lab — taslak web sitesi

Akdeniz Üniversitesi Oyun ve Oyunlaştırma Topluluğu (Games & Gamification Lab) tanıtım sitesi.
Bağımlılık yok: düz HTML + CSS + JS, build adımı yok.

Canlı: **https://nehirra.github.io/gglab-web/** (GitHub Pages, `main` dalına her push'ta yeniden yayınlanır)

## Çalıştırma

```bash
python3 -m http.server 4173
```
Sonra tarayıcıda `http://localhost:4173`. (`main.js` bir ES modülü olduğu için `file://` ile
doğrudan açılırsa çalışmaz; yerel sunucu gerekli.)

## Denetim (lint)

```bash
npx html-validate@9 index.html 404.html
npx stylelint@16 "css/*.css"
```

## Dosyalar

- `index.html` — tek sayfa, tüm bölümler
- `404.html` — GitHub Pages'in eksik adreslerde gösterdiği sayfa
- `uyelik/index.html` — başvuru formu (Google Form'a `formResponse` ile post eder)
- `css/style.css` — tema ve responsive kurallar
- `css/hud.css` — header + hero'nun HUD tarzı katmanı
- `js/main.js` — menü, scroll reveal, galeri lightbox, yaklaşan etkinlikler, form doğrulama
- `js/i18n.js` — TR/EN dil katmanı (şu an kapalı, bkz. Dil)
- `content/icerik.md` — topluluktan gelen ham metinler
- `content/etkinlikler.csv` — Yaklaşan etkinlikler listesi (bkz. aşağı)
- `assets/img/logos/` — paydaş ve sponsor logoları

## Logo arşivi (`assets/img/logos/`)

Paydaş, sponsor ve kurum logoları tek klasörde. Uzantısız sade ad = sitede kullanılan,
koyu zemin için olan sürüm; açık zemin sürümü `-acik-zemin` eki alır. `.webp` küçültülmüş
kullanım sürümü, `.png` tam çözünürlüklü kaynak — silinmemeli.

Yeni logo eklerken: `.png` kaynağı + küçültülmüş `.webp` ekle, `<li class="has-logo">` içine
`<img class="logo-mark">` olarak koy, en/boy oranına göre `logo-tall` (~1.1 ve altı), `logo-square`
(~1.5) veya `logo-wide` (~2.8 ve üstü) sınıfı ver; ~2 civarı oranlar sınıfsız kalır.

`akdeniz-universitesi.png` düşük çözünürlüklü (300×300); üniversiteden daha iyi sürüm gelirse
yalnızca `.png`'yi değiştirip `.webp`'yi yeniden üretmek yeterli.

## Bölüm düzeni

- Hero'daki partner listesi = topluluğun kendi paydaşları (sabit sıra, bant/carousel değil).
- `#gamejam` kendi sponsor/destekçi listesine sahip — partner listesiyle karıştırılmaz.
- `#etkinlikler` etkinlik **türlerini** tanıtır, tarih içermez. Tarihi kesin etkinlikler
  `#yaklasan`'da listelenir.

## Yaklaşan etkinlikler

Liste **`content/etkinlikler.csv`**'den okunur (ileride Google E-Tablosuna geçilebilir;
`data-sheet` attribute'üne yayınlanmış CSV linkini yazmak yeterli).

**Etkinlik eklemek / düzenlemek**
1. GitHub'da `content/etkinlikler.csv` dosyasını aç, kalem simgesiyle düzenle.
2. Her etkinlik bir satır. Boş bırakılan alan sitede görünmez.
3. "Commit changes" de; site 1–2 dakika içinde güncellenir.

```csv
baslik,tarih,saat,yer,tur,aciklama,link
Kutu Oyunu Günü,10.10.2026,18:00,Kampüs kafeterya,Kutu oyunu,Kısa açıklama,
Unity atölyesi,2026-11-05,18:00,"Mühendislik Fakültesi, Z-12",Atölye,Laptopunu getir.,https://forms.gle/…
Game Jam,Ocak 2027,,,Game Jam,Kesin tarih yakında.,
```

| Sütun | Zorunlu | Not |
| --- | --- | --- |
| `baslik` | evet | Etkinliğin adı |
| `tarih` | evet | `10.10.2026` ya da `2026-10-10`; günü belli değilse yalnızca ay: `Ocak 2027` |
| `saat` | hayır | `18:00` |
| `yer` | hayır | İçinde virgül varsa çift tırnak içine al |
| `tur` | hayır | Atölye, Söyleşi, Kutu oyunu, Game Jam… |
| `aciklama` | hayır | Bir iki cümle; virgül varsa çift tırnak |
| `link` | hayır | Kayıt formu / Discord etkinliği; yalnızca `https://…` |
| `gorsel` | hayır | Yerel görsel yolu veya HTTPS adresi |
| `oncelik` | hayır | `1`: büyük buluşma, `2`: özel etkinlik, `3`: düzenli buluşma (varsayılan) |

En fazla 6 etkinlik gösterilir, tarihi geçenler kendiliğinden gizlenir. Metinler düz metin
olarak yazılır (HTML çalışmaz).

## Bülten

İletişimdeki bülten kutusu şu an e-posta toplamıyor; servis bağlanınca (Formspree, Buttondown vb.)
forma `action`/`method="post"` eklemek yeterli, `main.js` zaten `fetch` ile post edip sonucu gösteriyor.

## Dil (TR / EN)

Site şu an yalnızca Türkçe; İngilizce altyapı hazır ama kapalı. Açmak için:
1. `index.html` sonundaki yorumdaki `<script src="js/i18n.js">` satırını geri koy
2. `#langToggle` düğmesinden `hidden` özniteliğini kaldır
3. `js/i18n.js` içinde `EN_ENABLED = true` yap

Yeni metin eklerken: HTML'e `data-i18n="bolum.anahtar"` ekle, `js/i18n.js`'teki `EN`
sözlüğüne aynı anahtarla İngilizcesini ekle. Karşılığı olmayan anahtar Türkçesine düşer.

## Eksikler

- [ ] Sosyal medya linkleri (Instagram, X, YouTube, LinkedIn, itch.io)
- [x] İletişim e-postası — team@gglabakdeniz.com
- [ ] Etkinlik tarihleri, yerleri ve geçmiş etkinlikler
- [ ] Etkinlik ve galeri fotoğrafları
- [x] Paydaş logoları
- [ ] Jam destekçi logoları — 16 destekçiden 4'ü geldi
- [ ] İletişim formunun bir servise bağlanması
- [ ] Bülten kutusunun bir servise bağlanması
- [ ] Alan adı bağlanınca `og:url` / `og:image` güncellenmesi
- [ ] Vizyon/misyon metinlerinin yönetim kurulu onayı

## Renkler

`css/style.css` `:root` bloğunda: lacivert `#10214d`, turuncu `#f47c20`, mavi `#4d7cff`, mor `#8b5cf6`.
