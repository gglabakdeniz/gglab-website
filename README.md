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
- `content/site-tablosu-sablon.xlsx` — site tablosunun boş şablonu (bkz. Site tablosu)
- `assets/img/logos/` — paydaş ve sponsor logoları

## Logo arşivi (`assets/img/logos/`)

Paydaş, sponsor ve kurum logoları tek klasörde. Uzantısız sade ad = sitede kullanılan,
koyu zemin için olan sürüm; açık zemin sürümü `-acik-zemin` eki alır. `.webp` küçültülmüş
kullanım sürümü, `.png` tam çözünürlüklü kaynak — silinmemeli.

Yeni logo eklerken: `.png` kaynağı + küçültülmüş `.webp` ekle, `<li class="has-logo">` içine
`<img class="logo-mark">` olarak koy, en/boy oranına göre `logo-tall` (~1.1 ve altı), `logo-square`
(~1.5) veya `logo-wide` (~2.8 ve üstü) sınıfı ver; ~2 civarı oranlar sınıfsız kalır.

Jam destekçilerinden gelen logolar (`rogue-duck`, `mages-market`, `demonsoft`, `broken-lyre-entertainment`,
`vellichor-games`) arşivde bekliyor; `#gamejam` jeneriği şimdilik düz metin, 16 logonun tamamı gelince
logolu sürüme geçilecek.

`akdeniz-universitesi.png` düşük çözünürlüklü (300×300); üniversiteden daha iyi sürüm gelirse
yalnızca `.png`'yi değiştirip `.webp`'yi yeniden üretmek yeterli.

## Bölüm düzeni

- Hero'daki partner listesi = topluluğun kendi paydaşları (sabit sıra, bant/carousel değil).
- `#gamejam` kendi sponsor/destekçi listesine sahip — partner listesiyle karıştırılmaz.
- `#etkinlikler` etkinlik **türlerini** tanıtır, tarih içermez. Tarihi kesin etkinlikler
  `#yaklasan`'da listelenir.

## Site tablosu (Google E-Tablolar + Drive)

Etkinlik listesi ve görseller koda dokunmadan tek bir Google E-Tablosundan yönetilir.
Tablo "Dosya → Paylaş → Web'de yayınla" ile her sheet ayrı CSV olarak yayında; adresi
`index.html`'de `<main data-sheets="…/pub">`, her bölüm kendi sheet'inin `data-gid`'ini taşır.
Görseller Drive'daki public kök klasörde, her sheet için aynı adlı bir alt klasörde durur.

| Sheet | gid | Bölüm | Sütunlar |
| --- | --- | --- | --- |
| `ana sayfa` | *(gid `<main data-home-gid>`'e yazılır)* | tüm bölüm başlıkları | `alan, ust, baslik, aciklama` — aşağıda |
| `etkinlikler` | 353119909 | `#yaklasan` | aşağıdaki tablo |
| `galeri` | 78690489 | `#galeri` | `gorsel, kucuk, aciklama, boyut` (normal/genis/uzun/buyuk) |
| `gamejam` | 1856434088 | `#gamejam` | `alan, gorsel, aciklama` — alan: kapak, ekran1–4 |
| `duzenli` | 1461908741 | `#etkinlikler` (düzenli etkinlik kartları) | `alan, gorsel, baslik, aciklama` — alan: kutu, atolye, talks, jam; baslik/aciklama kartın metni |
| `uyelik` | 892993642 | `#uyelik` sosyal bağlantıları | `alan, baslik, link, ikon` — aşağıda |

- `gorsel`: Drive paylaşım linki ya da repodaki yol (`assets/img/…`). Drive linki
  `lh3.googleusercontent.com/d/KİMLİK=wGENİŞLİK` adresine çevrilir (`main.js` > `safeImage`).
- `alan` değerleri HTML'deki `data-slot` öznitelikleriyle eşleşir; yeni bir yer için HTML'e de `data-slot` eklenmeli.
  Bir `data-slot` içindeki `data-col="sütun"` öğesi o sütunla doldurulur (`<img>` ise görsel, değilse metin); boş hücrede HTML'deki metin kalır.
- Drive görseli açılmazsa yerine bir şey konmaz, yeri boş kalır: Drive sorunu sitede hemen görünsün diye.
- Tablonun kendisi açılmazsa ya da hücre boşsa metinler HTML'deki hâliyle kalır. Görsellerin repoda
  yedeği yok: yerleri boş kutu olarak görünür. Üyelik arka planı tablodan gelmez, hep
  `assets/img/uyelik-gece.webp`.
  Yaklaşan etkinlikler açılmazsa "yüklenemedi" notu çıkar.
- Değişiklikler ~5 dakikada yansır (Google önbelleği). Linki değiştirmeden görsel yenilemek için
  Drive'da "Sürümleri yönet → Yeni sürüm yükle".
- Bu tablo herkese açık: form yanıtı ya da kişisel veri asla bu dosyaya konmaz.
- Tablodan gelen açıklamalar yalnızca Türkçe; İngilizce açılırsa `data-i18n` kapsamı dışında kalır.

### `ana sayfa` sheet'i (bölüm başlıkları)

```csv
alan,ust,baslik,aciklama
hakkimizda,01 — Biz Kimiz,Fikirleri oynanabilir şeylere dönüştüren *kampüs ekibi*.,GG Lab; oyun geliştirme …
faaliyet,03 — Ne Yaparız,Faaliyet alanlarımız,
```

- `alan` bölümün id'si: `hakkimizda, yaklasan, vizyon, faaliyet, gamejam, etkinlikler, galeri, iletisim, uyelik`.
- `ust` küçük turuncu başlık (numarası dahil yazılır), `baslik` büyük başlık, `aciklama` altındaki paragraf.
- Boş hücrede HTML'deki metin kalır. `vizyon` ve `faaliyet`te HTML'de açıklama yok; hücre doluysa görünür.
  `gamejam`te yalnızca `baslik` kullanılır.
- `*yıldız içindeki*` kısım vurgu rengiyle (turuncu) yazılır.
- Hero (en üst) ve bülten kutusu tablodan gelmez.

### `uyelik` sheet'i

```csv
alan,baslik,link,ikon
sosyal,Instagram,https://www.instagram.com/gglabakdeniz/,assets/img/icons/instagram.svg
sosyal,YouTube,https://www.youtube.com/@GGLabAkdeniz,assets/img/icons/youtube.svg
```

- Bölümün başlığı ve açıklaması `ana sayfa` sheet'inden (`alan` = `uyelik`).
- Her `sosyal` satırı bir bağlantı, sitede tablodaki sırayla dizilir. Satır eklemek/silmek yeterli.
  `baslik` ve `link` (http/https) zorunlu; geçerli `sosyal` satırı yoksa HTML'deki liste kalır.
- `ikon` yalnızca repodaki bir dosya olabilir (`assets/…`, `.svg/.webp/.png`); Drive linki kabul
  edilmez. Boşsa ya da geçersizse genel bağlantı ikonu (`assets/img/icons/link.svg`) çıkar.
  Hazır ikonlar `assets/img/icons/` altında: instagram, youtube, discord, x, linkedin, link.
  Yeni ikon: açık renkli (`#eef2ff`) tek renk SVG, 24×24 viewBox.
- "Başvuru Formu" düğmesi tablodan gelmez, HTML'de sabit.

## Yaklaşan etkinlikler

Liste site tablosunun **`etkinlikler`** sheet'inden okunur. Her etkinlik bir satır;
boş bırakılan alan sitede görünmez.

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
