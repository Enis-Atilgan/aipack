# AIPack Mimari Kararları — Derinlemesine Analiz

## Soru 1: Sistem Nerede Çalışacak?

### Kararım: **Aşamalı Hibrit (C → A → B)**

Bu sorunun tek bir cevabı yok çünkü "basit persona paketi" ile "3 agentlı e-ticaret sistemi" aynı runtime'a ihtiyaç duymuyor.

#### v1 (MVP) — Sadece Config Dağıtımı (Opsiyon C)

Marketplace'in ilk versiyonunda **çalıştırma işini biz yapmıyoruz.** Sadece doğru formatta config dosyası üretip kullanıcıya veriyoruz.

Neden:
- Server maliyeti neredeyse sıfır. Startup'ın ilk günlerinde bu hayati.
- Teknik karmaşıklık minimum. Bir web sitesi + dosya indirme. Hepsi bu.
- Kullanıcı zaten Cursor/Claude/ChatGPT kullanıyor. Onlardan koparmaya çalışmıyoruz, **üstüne ekliyoruz.**
- Bu aşamada multi-agent paketler marketplace'te "tarif" olarak satılır. İçinde mimari açıklanır, config dosyaları verilir, kullanıcı kendi ortamında kurar.

Kullanıcı deneyimi:
```
1. Marketplace'e gir
2. "Senior Go Backend" paketini bul
3. "Download for Cursor" butonuna bas
4. .cursorrules dosyası iner
5. Projenin kök dizinine at
6. Bitti ✓
```

#### v1.5 — Lokal CLI Runtime (Opsiyon A)

Basit paketler için config export yeterli. Ama multi-agent sistemler için bir **orkestratör** lazım. Bu aşamada bir CLI aracı çıkarıyoruz:

```bash
aipack run e-commerce-support-system
```

Bu CLI:
- Kullanıcının kendi API key'lerini kullanır (bize maliyet yok)
- `.aipack` dosyasını okur, agentları başlatır, aralarındaki iletişimi yönetir
- Kullanıcının makinesinde çalışır (privacy-friendly, KVKK/GDPR dostu)

Neden bulutta değil:
- Bulut runtime demek = her kullanıcının API çağrılarını biz ödüyoruz = felaket
- Bulut runtime demek = kullanıcının verisini biz işliyoruz = hukuki sorun
- Lokal runtime demek = sınırsız ölçeklenme, sıfır maliyet

#### v2+ — Opsiyonel Bulut (Opsiyon B, Premium)

"Ben CLI kuramam, API key nedir bilmem, sadece çalışsın" diyen kullanıcılar için opsiyonel bulut hosting. Aylık abonelik modeli. Ama bu v1'in işi değil.

> [!IMPORTANT]
> **Kural: v1'de runtime yapmıyoruz. Sadece dosya üretip dağıtıyoruz. Bu startup'ın hayatta kalma meselesi.**

---

## Soru 2: İlk Desteklenecek Platformlar

### Kararım: **Cursor → Claude → ChatGPT**

#### Neden bu sıra?

**1. Cursor (.cursorrules, .cursor/rules/)**
- Marketplace'in ilk hedef kitlesi yazılımcılar. Yazılımcıların en aktif olarak AI config paylaştığı platform Cursor.
- Export etmek teknik olarak en kolay: düz bir .md veya .txt dosyası üretmek yeterli.
- `.cursorrules` formatı zaten toplulukta viral olmuş durumda, insanlar aktif olarak arıyor ve paylaşıyor.
- Reddit'te r/cursor, X/Twitter'da #cursorrules hashtag'i ile organik talep var.

**2. Claude (CLAUDE.md + Claude Projects)**
- Claude Code kullanıcıları hızla artıyor ve bunlar **ödeme yapan**, teknik açıdan bilinçli kullanıcılar.
- `CLAUDE.md` dosyası da düz metin — export kolay.
- Claude Projects API'si ile programatik olarak proje oluşturmak mümkün (ilerisi için).

**3. ChatGPT (Custom Instructions)**
- En büyük kullanıcı tabanı ama Custom Instructions çok sınırlı (karakter limiti var, yapılandırılmış değil).
- GPT'lere export etmek daha anlamlı olabilir ama GPT Store zaten bu işi yapmaya çalışıyor (ve başarısız oluyor).
- Yine de kullanıcı tabanı çok büyük olduğu için göz ardı edemeyiz.

#### v1'de desteklemeyeceklerimiz (ve neden):
- **Windsurf:** Pazar payı küçük, format Cursor'a çok benziyor, sonra kolayca eklenir.
- **GitHub Copilot:** Kişiselleştirme seçenekleri çok sınırlı.
- **OpenAI Codex:** Henüz çok yeni ve kapalı.

---

## Soru 3: Bilgi Tabanı (Knowledge) Nasıl Taşınacak?

### Kararım: **Küçük dosyalar gömülü, büyük dosyalar referans (A+C Hibrit)**

Mantık şu: Bir `.aipack` dosyasının **taşınabilir, hafif ve hızlı** olması lazım. Ama bazı paketler ciddi bilgi tabanı gerektiriyor.

#### Küçük dosyalar (< 5MB toplam): Pakete gömülü
```
my-pack.aipack/
  └── knowledge/
      ├── coding-standards.md    (12KB)
      ├── api-reference.md       (45KB)
      └── faq.md                 (8KB)
```
- Paket self-contained kalır, internet olmadan da çalışır
- İndirme hızlı, deneyim pürüzsüz

#### Büyük dosyalar (> 5MB): Referans ile
```json
{
  "knowledge": [
    {
      "name": "legal-database",
      "type": "reference",
      "url": "https://cdn.aipack.dev/packs/legal-pro/knowledge/laws.zip",
      "size_mb": 150,
      "hash": "sha256:abc123..."
    }
  ]
}
```
- Paket dosyası küçük kalır (birkaç KB)
- Büyük veri bizim CDN'den veya harici kaynaktan çekilir
- Hash ile bütünlük kontrolü yapılır (güvenlik)

#### Neden kullanıcının cihazında kocaman dosyalar istemiyoruz:
- Mobil kullanıcılar 200MB paket indiremez
- Marketplace'de "hızlı dene, beğenmezsen sil" deneyimi şart
- Docker da bunu böyle yapıyor: Dockerfile küçük, image layer'ları registry'den çekiliyor

---

## Soru 4: Paket Oluşturma Deneyimi

### Kararım: **A + basit web form birlikte, sonra C (AI-assisted)**

#### v1: İki yol paralel

**Yol 1 — YAML/JSON + CLI (geliştiriciler için)**
```bash
# Yeni paket oluştur
aipack init my-pack

# Doğrula
aipack validate my-pack/

# Marketplace'e yayınla
aipack publish
```

Neden:
- Geliştiriciler bunu sever (npm publish, docker push ile aynı mental model)
- Git ile versiyon kontrolü yapılabilir
- CI/CD pipeline'larına entegre edilebilir

**Yol 2 — Web formu (herkes için)**
Marketplace web sitesinde basit bir form:
```
Paket Adı: [________________]
Kategori:   [Coding ▼]
Persona:    [Çok satırlı metin alanı]
Kurallar:   [+ Kural Ekle]
MCP:        [+ Araç Ekle]
            [Yayınla]
```

Neden:
- Kod yazmak istemeyen profesyoneller (avukat, pazarlamacı) buradan girecek
- Giriş bariyeri düşük = daha fazla içerik üretici = marketplace daha hızlı dolar
- Arka planda form, aynı `.aipack` JSON'unu üretiyor

#### v2: AI-Assisted Builder

```
Kullanıcı: "3 agentlı bir müşteri destek sistemi istiyorum. 
            Biri yönlendirici, biri iade işlemcisi, biri ürün uzmanı olsun.
            Shopify ve Stripe entegrasyonu olsun."

Sistem:     → .aipack dosyasını otomatik üretir
            → Kullanıcıya önizleme gösterir
            → "Yayınla" veya "Düzenle" seçenekleri sunar
```

Bu özellik marketplace'i **patlatır** çünkü "5 dakikada uzman AI sistemi kur ve sat" demektir. Ama v1 için erken — önce formatın oturması, topluluktan feedback alınması lazım.

> [!TIP]
> **İlk gün stratejisi:** Web formu ile 50-100 tane "seed pack" (tohum paket) biz kendimiz oluşturacağız. Marketplace boş açılmaz — kullanıcı geldiğinde raflar dolu olmalı. Tıpkı bir mağazanın açılışta ürünsüz olmayacağı gibi.

---

## Soru 5: Açık Kaynak Stratejisi

### Kararım: **Format + CLI açık kaynak, Marketplace kapalı (Docker Modeli)**

Bu kararın arkasında kanıtlanmış bir iş modeli var:

| Katman | Açık/Kapalı | Neden |
|---|---|---|
| `.aipack` format spesifikasyonu | ✅ Açık | Standart olması için herkesin kullanabilmesi şart. Kapalı format kimse benimsemez. |
| CLI araç (`aipack` komutu) | ✅ Açık | Geliştiriciler katkı sunar, güven oluşur, benimseme hızlanır. |
| Marketplace web platformu | 🔒 Kapalı | Gelir buradan gelecek. Komisyon, premium özellikler, analytics. |
| Bulut Runtime (v2+) | 🔒 Kapalı | Premium hizmet, ücretli. |

**Emsal şirketler:**
- **Docker:** Runtime açık kaynak → Docker Hub kapalı → milyar dolarlık şirket
- **Terraform:** CLI açık kaynak → Terraform Cloud kapalı → HashiCorp $5B+ exit
- **WordPress:** CMS açık kaynak → WordPress.com hosting kapalı → Automattic $7.5B valuation

**Lisans seçimi:**
- Format spec: Creative Commons (CC-BY-4.0) — herkes kullanabilsin, atıf versin
- CLI: MIT License — en özgür, en çok benimsenen
- Marketplace: Proprietary

Bu model şunu sağlıyor: Format yaygınlaşır → herkes `.aipack` kullanır → ama en iyi paketleri bulmak, yayınlamak, satmak için marketplace'e gelirler. Tıpkı herkesin Git'i bilmesi ama GitHub'a gelmesi gibi.

---

## Soru 6: Kullanıcı Kimliği

### Kararım: **GitHub birincil, Google ikincil. Email+şifre yok.**

#### Neden GitHub önce:
- İlk hedef kitle yazılımcılar → hepsinin GitHub hesabı var
- GitHub profili = güvenilirlik sinyali (katkıları, yıldızları, repoları görünür)
- Pack yayıncısının kimliği doğrulanmış oluyor ("Bu paketi 500 yıldızlı bir Go geliştiricisi mi yaptı, yoksa rastgele biri mi?")
- OAuth entegrasyonu kolay, 30 dakikada kurulur

#### Neden Google ikincil:
- Profesyoneller (avukat, pazarlamacı, öğretmen) GitHub hesabı olmayabilir
- Google hesabı evrensel — herkesin var
- Marketplace genişlediğinde bu kitle büyüyecek

#### Neden Email+Şifre yok:
- Şifre sıfırlama akışı, güvenlik sorunları, brute force koruması → gereksiz mühendislik yükü
- 2026'da kimse yeni bir siteye email+şifre ile kayıt olmak istemiyor
- OAuth ile 2 tıkla giriş → dönüşüm oranı (conversion rate) çok daha yüksek

---

## Soru 7: Tech Stack

### Kararım:

| Katman | Teknoloji | Neden |
|---|---|---|
| **Frontend + Backend** | **Next.js 15 (App Router)** | Tek codebase, SSR (SEO için şart — "best cursor rules" aramasında Google'da çıkmalıyız), React ekosistemi, Vercel ile sorunsuz deployment |
| **Veritabanı** | **Supabase (PostgreSQL)** | Hosted Postgres + Auth (GitHub/Google OAuth dahil) + Storage (paket dosyaları için) + Real-time. MVP hızı için en uygun. Ayrı auth servisi, ayrı storage servisi kurmaya gerek yok. |
| **Paket Depolama** | **Supabase Storage + Cloudflare R2** | Küçük paketler Supabase Storage'da, büyük bilgi tabanları R2'de (ucuz, S3-uyumlu) |
| **Hosting** | **Vercel** | Next.js'in doğal evi, ücretsiz tier MVP'ye yeter, global CDN, otomatik HTTPS |
| **Arama** | **Supabase Full-Text Search** | v1 için yeterli. Büyüyünce Algolia veya Meilisearch'e geçilir |
| **CLI** | **Node.js (npm paketi)** | Web app ile aynı dil = paylaşılan validation logic, tip tanımları, format parserleri. `npx aipack init` ile sıfır kurulumla kullanılabilir |
| **Analytics** | **PostHog (açık kaynak)** | Hangi paketler popüler, kullanıcılar nerede takılıyor, funnel analizi |

#### Neden bu stack:

**Hız:** Supabase + Next.js + Vercel kombinasyonu, tek bir geliştirici (sen) için en hızlı MVP stack'i. Auth, storage, database hepsi hazır. Altyapı yerine ürüne odaklanırsın.

**Maliyet:** v1'de toplam maliyet yaklaşık **$0/ay.** Vercel free tier + Supabase free tier MVP'yi taşır. İlk 10.000 kullanıcıya kadar muhtemelen aylık $20-50 bile harcamazsın.

**Ölçeklenebilirlik:** Bu stack milyonlarca kullanıcıya kadar scale eder. Vercel + Supabase + Cloudflare altyapıda darboğaz oluşturmaz.

> [!NOTE]
> CLI'ı neden Go değil de Node.js yapıyoruz: Go tek binary vererek güzel olurdu ama format validation kodunu, JSON schema'ları, parser'ları web app ile CLI arasında paylaşmak çok büyük avantaj. Aynı kodu iki kere yazmayı önlüyor. `npx aipack validate` dediğinde npm'den çekilip çalışıyor, kurulum bile gerekmiyor.

---

## Özet: Tüm Kararlar Bir Bakışta

| Soru | Karar | Gerekçe |
|---|---|---|
| Runtime | v1: Config export, v1.5: Lokal CLI, v2: Opsiyonel bulut | Sıfır maliyet ile başla |
| Platformlar | Cursor → Claude → ChatGPT | Geliştirici öncelikli |
| Knowledge | Küçük gömülü, büyük referans | Paket hafif kalsın |
| Oluşturma | YAML+CLI + Web form | İki kitle aynı anda |
| Açık kaynak | Format+CLI açık, Marketplace kapalı | Docker modeli |
| Auth | GitHub + Google OAuth | Hızlı, güvenli, sürtünmesiz |
| Stack | Next.js + Supabase + Vercel | Tek kişi ile en hızlı MVP |
