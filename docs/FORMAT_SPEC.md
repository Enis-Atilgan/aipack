# AIPack Format Specification v2.0 (Standartlar-Öncelikli Bundle Mimarisi)

> **Status:** Active (05.10.2026 Stratejik Revizyonu)
> **Authors:** hatred & GÖKBÖRÜ
> **License:** CC-BY-4.0 (Açık Standart)

---

## 1. Genel Bakış

> [!IMPORTANT] [05.10.2026 STRATEJİK REVİZYONU — STANDARTLARIN ÜSTÜNDEKİ BUNDLE KATMANI]
> Pazar araştırması; Linux Foundation AAIF çatısı altındaki `AGENTS.md` ve `MCP` ile açık `SKILL.md` (Agent Skills) standartlarının sektöre yerleştiğini göstermiştir.
> Bu nedenle PackAI **yeni bir format icat etmek yerine, açık standartların üstünde yaşayan bir BUNDLE + ÖNKOŞUL DENETİMİ (PRE-FLIGHT) + CROSS-CLIENT MARKETPLACE KATMANIDIR.**
> İstemcilerin doğrudan tanıdığı standart dosyalar olduğu gibi paketlenir; PackAI'nin kendi manifest'i (`packai.yaml`) ise yalnızca standartların karşılamadığı alanları (sistem gereksinimleri, Level 3 iş akışı, execution komutu ve sandbox tavsiyesi) tanımlar.

### Tasarım İlkeleri

1. **Standart-Öncelikli (Standards-First)** — `AGENTS.md`, `SKILL.md` ve `mcp.json` birinci sınıf girdidir; tekerleği yeniden icat etmiyoruz.
2. **Doğrulanmış Kurulum (Pre-Flight Verified)** — "Bu paket senin makinende çalışır" garantisi (OS, binary, servis, API Key denetimi).
3. **Cross-Client Taşınabilirlik** — Tek paketten Claude Code, Cursor, Windsurf, Roo-Code, Copilot, Zed ve Aider uyumlu provizyon.
4. **Sürtünmesiz Arz (`init --from-existing`)** — Mevcut bir projenin kurulumundan tek tıkla paylaşılabilir bundle üretme.

---

## 2. Paket Seviyeleri (05.10.2026 Güncellendi)

Format, üç karmaşıklık seviyesini standart dosyalar + `packai.yaml` orkestrasyonuyla destekler:

```
┌────────────────────────────────────────────────────────┐
│  Level 3: SYSTEM                                       │
│  AGENTS.md + skills/ + mcp.json + packai.yaml          │
│  (Multi-Agent Mesh + State Machine Workflow + Sandbox) │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Level 2: ENHANCED                               │  │
│  │  AGENTS.md + skills/ + mcp.json + packai.yaml    │  │
│  │  (Skills + MCP Tools + Secrets/Binaries Preflight│  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Level 1: SIMPLE                           │  │  │
│  │  │  AGENTS.md (Standart Kural ve Personolar)  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

| Seviye | Standart Dosyalar + PackAI Katmanı | Kullanım Amacı |
|---|---|---|
| **Simple** | `AGENTS.md` (Persona + Kurallar) | "Cursor için Go kuralları", "Temel kodlama anayasası" |
| **Enhanced** | `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` | "Gereksinimli Shopify e-ticaret asistanı", "Veritabanı denetçisi" |
| **System** | `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` (Workflow + Sandbox) | "3 ajanlı müşteri destek timi", "Otonom Red Team / Pentest timi" |

---

## 3. Dizin Yapısı (05.10.2026 Yeni Standart-Öncelikli Yapı)

Bir `.packai` paketi aşağıdaki dosya yapısına sahip bir dizin veya ZIP arşivdir:

```
my-pack.packai (ZIP veya dizin)
├── AGENTS.md                 # Standart (AAIF): Kural ve personolar
├── skills/                   # Standart (Agent Skills): Prosedürel yetenekler
│   └── <skill-ad>/
│       └── SKILL.md
├── mcp.json                  # Standart (MCP): Araç ve sunucu tanımları
├── knowledge/                # Opsiyonel: Bilgi bankası dokümanları
├── agents/                   # Level 3: Uzman alt ajan sistem promptları
│   └── <agent-id>/
│       └── system.md
└── packai.yaml               # Bizim Katman: requirements, execution, workflow, sandbox etiketi
```

> [!NOTE]
> `.packai` uzantılı dosya, bu dizinin `.zip` olarak sıkıştırılmış halidir. CLI aracı bunu otomatik yapar:
> ```bash
> packai pack ./my-pack/        # → my-pack-1.0.0.packai üretir
> packai unpack my-pack.packai  # → ./my-pack/ dizinine açar
> ```

---

## 4. Manifest Şeması (`manifest.json`)

Manifest, paketin kalbidir. Tüm metadata ve yapılandırma burada tanımlanır.

### 4.1 Üst Düzey Alanlar

```jsonc
{
  // ─── Zorunlu Alanlar ───
  "spec_version": "1.0",                    // Format versiyonu
  "name": "senior-go-backend",              // Benzersiz paket adı (slug formatı)
  "version": "1.0.0",                       // Semantic versioning (semver)
  "description": "Idiomatic Go, DDD ve katı test kuralları içeren mühendis personası",
  "author": {
    "name": "hatred",
    "github": "hatred"                      // GitHub kullanıcı adı
  },
  "level": "simple",                        // "simple" | "enhanced" | "system"

  // ─── Opsiyonel Alanlar ───
  "license": "MIT",                         // Paket lisansı
  "category": "coding",                     // Ana kategori
  "tags": ["go", "backend", "ddd"],         // Aranabilir etiketler
  "language": "tr",                         // Hedef dil (ISO 639-1)
  "icon": "./assets/icon.png",              // Paket ikonu
  "repository": "https://github.com/...",   // Kaynak kodu

  // ─── İçerik Blokları (aşağıda detaylı) ───
  "persona": { ... },
  "rules": { ... },
  "knowledge": { ... },
  "tools": { ... },
  "agents": { ... },
  "workflow": { ... },
  "exports": { ... }
}
```

### 4.2 Kategori Değerleri

```
coding          — Yazılım geliştirme
writing         — Yazarlık, blog, içerik üretimi
business        — İş, strateji, danışmanlık
legal           — Hukuk
education       — Eğitim, öğretim
marketing       — Pazarlama, SEO, sosyal medya
data            — Veri analizi, veri bilimi
design          — Tasarım, UX/UI
productivity    — Üretkenlik, planlama, zaman yönetimi
lifestyle       — Yaşam koçluğu, sağlık, fitness
finance         — Finans, muhasebe, yatırım
support         — Müşteri destek sistemleri
research        — Araştırma, akademik
other           — Diğer
```

---

## 5. İçerik Blokları — Detay

### 5.1 Persona

Yapay zekanın kim olduğunu, nasıl konuştuğunu ve nasıl düşündüğünü tanımlar.

```jsonc
"persona": {
  // Seçenek A: Inline tanım
  "role": "Senior Go Backend Engineer",
  "tone": "Direct, concise, no fluff",
  "expertise": ["Go", "DDD", "Distributed Systems", "PostgreSQL"],
  "language": "tr",
  "instructions": "Her zaman önce problemi analiz et, sonra çözüm sun..."

  // Seçenek B: Harici dosya referansı (daha uzun/detaylı personalar için)
  // "file": "./persona/system.md"
}
```

`file` alanı kullanıldığında, `./persona/system.md` dosyasının içeriği system prompt olarak kullanılır. Inline `instructions` ile `file` birlikte kullanılamaz.

### 5.2 Rules

Yapay zekanın **mutlaka uyması gereken** katı davranış kurallarını tanımlar.

```jsonc
"rules": {
  // Seçenek A: Inline liste
  "items": [
    "Her zaman standart kütüphaneyi üçüncü parti paketlere tercih et",
    "Hata yönetiminde asla panic() kullanma, error wrapping yap",
    "Fonksiyonlarda 3'ten fazla parametre varsa options struct kullan",
    "Her public fonksiyon için table-driven test yaz"
  ]

  // Seçenek B: Harici dosya referansı
  // "file": "./rules/rules.md"
}
```

### 5.3 Knowledge (Level 2+)

Yapay zekanın referans olarak kullanacağı bilgi tabanını tanımlar.

```jsonc
"knowledge": [
  {
    "name": "coding-standards",
    "description": "Şirketin Go kodlama standartları",
    "type": "embedded",                     // Pakete gömülü
    "path": "./knowledge/coding-standards.md"
  },
  {
    "name": "legal-database",
    "description": "Türk Ticaret Kanunu tam metin",
    "type": "reference",                    // Harici referans
    "url": "https://cdn.aipack.dev/knowledge/ttk-2025.zip",
    "size_mb": 85,
    "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb924..."
  },
  {
    "name": "product-catalog",
    "description": "Ürün kataloğu (JSON)",
    "type": "embedded",
    "path": "./knowledge/catalog.json",
    "format": "json"                        // "markdown" | "json" | "csv" | "text"
  }
]
```

### 5.4 Tools (Level 2+)

Yapay zekanın kullanabileceği araçları ve entegrasyonları tanımlar.

```jsonc
"tools": {
  "mcp_servers": [
    {
      "name": "github",
      "description": "GitHub repo yönetimi",
      "source": "npm:@modelcontextprotocol/server-github",
      "config": {
        "owner": "${GITHUB_OWNER}",         // Ortam değişkeni referansı
        "repo": "${GITHUB_REPO}"
      },
      "required": true                      // Paket bu araç olmadan çalışmaz
    },
    {
      "name": "postgres",
      "description": "PostgreSQL veritabanı sorguları",
      "source": "npm:@modelcontextprotocol/server-postgres",
      "config": {
        "connection_string": "${DATABASE_URL}"
      },
      "required": false                     // Opsiyonel, olmasa da çalışır
    }
  ],

  // Basit fonksiyon tanımları (MCP olmayan araçlar)
  "functions": [
    {
      "name": "calculate_tax",
      "description": "Vergi hesaplama",
      "endpoint": "https://api.example.com/tax",
      "method": "POST",
      "auth": "bearer:${TAX_API_KEY}"
    }
  ]
}
```

> [!IMPORTANT]
> **Ortam Değişkenleri:** `${VARIABLE_NAME}` sözdizimi ile config değerleri ortam değişkenlerinden okunur. API key'ler, şifreler ve kullanıcıya özel değerler ASLA pakete gömülmez. Kurulum sırasında kullanıcıdan istenir.

### 5.5 Agents (Level 3)

Çok ajanlı sistemlerde her bir ajanı tanımlar.

```jsonc
"agents": [
  {
    "id": "router",
    "name": "Yönlendirici",
    "description": "Gelen mesajı analiz eder, doğru ajana yönlendirir",
    "model_preference": "fast",             // "fast" | "balanced" | "smart"
    "persona": {
      "file": "./agents/router/system.md"
    },
    "rules": {
      "items": [
        "Sadece yönlendirme yap, soruyu kendin cevaplama",
        "Belirsiz durumlarda kullanıcıya sor"
      ]
    }
  },
  {
    "id": "refund-handler",
    "name": "İade İşlemcisi",
    "description": "İade ve geri ödeme taleplerini işler",
    "model_preference": "smart",
    "persona": {
      "file": "./agents/refund/system.md"
    },
    "tools": {
      "mcp_servers": [
        { "ref": "shopify" },               // Üst düzey tools'tan referans
        { "ref": "stripe" }
      ]
    },
    "knowledge": [
      { "ref": "refund-policy" }            // Üst düzey knowledge'dan referans
    ]
  },
  {
    "id": "product-expert",
    "name": "Ürün Uzmanı",
    "description": "Ürün soruları ve öneriler",
    "model_preference": "balanced",
    "persona": {
      "file": "./agents/product/system.md"
    },
    "knowledge": [
      { "ref": "product-catalog" }
    ]
  }
]
```

**`model_preference` değerleri:**

| Değer | Anlam | Örnek Kullanım |
|---|---|---|
| `fast` | Hızlı ve ucuz model yeterli | Yönlendirme, sınıflandırma, basit sorular |
| `balanced` | Orta seviye model | Genel sohbet, bilgi sorgulama |
| `smart` | En yetenekli model | Karmaşık analiz, kod yazma, hukuki değerlendirme |

> [!NOTE]
> `model_preference` spesifik bir model adı değil, bir **niyet** belirtir. Runtime, kullanıcının sahip olduğu API key'lere ve tercihlere göre uygun modeli seçer. Örneğin `"smart"` = kullanıcının OpenAI key'i varsa GPT-4o, Anthropic key'i varsa Claude Sonnet.

### 5.6 Workflow (Level 3)

Ajanlar arası mesaj akışını ve yönlendirme mantığını tanımlar.

```jsonc
"workflow": {
  "entry": "router",                        // İlk mesajı alan ajan

  "routes": [
    {
      "from": "router",
      "to": "refund-handler",
      "condition": "intent == 'refund' || intent == 'return'"
    },
    {
      "from": "router",
      "to": "product-expert",
      "condition": "intent == 'product_question' || intent == 'recommendation'"
    },
    {
      "from": "router",
      "to": "router",
      "condition": "default",               // Eşleşme yoksa router kendisi yanıtlar
      "fallback": true
    }
  ],

  // Ajanlar arası paylaşılan bağlam
  "shared_context": {
    "pass_conversation_history": true,       // Önceki mesajları aktar
    "max_history_messages": 20              // Son N mesajı aktar (token tasarrufu)
  }
}
```

### 5.7 Execution (Framework & Runner Katmanı)

Kod tabanlı otonom ajanları (CrewAI, LangGraph, AutoGen, Python/Node betikleri) tek komutla (`packai run`) ateşlemek için yürütme komutunu tanımlar.

```yaml
execution:
  command: "python -m crewai run"          # Çalıştırılacak kabuk komutu
  entrypoint: "crew.py"                    # Giriş noktası betiği
  cwd: "."                                 # Çalışma dizini
  env:                                     # İsteğe bağlı özel ortam değişkenleri
    PYTHONUNBUFFERED: "1"
```

### 5.8 Skills (Agent Skills Açık Standardı)

Linux Foundation AAIF ve Anthropic standardı olan `skills/<ad>/SKILL.md` yeteneklerini bağlar.

```yaml
skills:
  - name: "nmap-audit"
    description: "Ağ tarama ve port keşif yeteneği"
    path: "./skills/nmap-audit/SKILL.md"
  - name: "sqlmap-exploit"
    description: "Otomatik SQL injection denetimi"
    path: "./skills/sqlmap-exploit/SKILL.md"
```

### 5.9 Requirements & Pre-Flight (Doğrulanmış Kurulum)

Paketin hedef sistemde çalışabilmesi için gereken işletim sistemi, RAM, ikili dosyalar (binaries), servisler ve API sırlarını (secrets) tanımlar.

```yaml
requirements:
  platform:
    os: ["darwin", "linux"]                # "darwin", "linux", "win32"
    min_ram_gb: 16                         # Asgari RAM ihtiyacı
    gpu:
      type: "metal"                        # "metal" | "cuda" | "rocm" | "any"
      required: false

  binaries:
    - name: "python3"
      min_version: ">=3.11.0"
      install:
        brew: "brew install python@3.11"
        apt: "apt-get install -y python3"
    - name: "nmap"
      install:
        brew: "brew install nmap"
        apt: "apt-get install -y nmap"

  services:
    - name: "docker"
      probe_command: "docker info"
      auto_start:
        darwin: "open -a Docker"
        linux: "systemctl start docker"

  secrets:
    - id: "ANTHROPIC_API_KEY"
      label: "Anthropic API Anahtarı"
      required: true
      validation_regex: "^sk-ant-[a-zA-Z0-9_-]{32,}$"
    - id: "SHODAN_API_KEY"
      label: "Shodan API Anahtarı"
      required: false

  sandbox: "container-recommended"         # "advisory" | "container-recommended" | "microvm"
```

### 5.10 Exports

Paketin hangi platformlara nasıl export edileceğini tanımlar. Bu alan **opsiyoneldir** — tanımlanmazsa CLI varsayılan export mantığını kullanır.

```jsonc
"exports": {
  "cursor": {
    "target_file": ".cursorrules",          // Çıktı dosya adı
    "include": ["persona", "rules"],        // Hangi blokları dahil et
    "format": "markdown"                    // "markdown" | "text" | "json"
  },
  "claude": {
    "target_file": "CLAUDE.md",
    "include": ["persona", "rules", "knowledge"],
    "format": "markdown"
  },
  "chatgpt": {
    "target_file": "custom_instructions.txt",
    "include": ["persona", "rules"],
    "format": "text",
    "max_chars": 1500                       // ChatGPT karakter limiti
  }
}
```

---

## 6. Ortam Değişkenleri ve Kurulum

Paketler hassas bilgileri (API key, şifre) **asla** içermez. Bunun yerine `${VARIABLE}` sözdizimi kullanılır.

Kullanıcı bir paketi ilk kez kurduğunda, CLI veya web arayüzü gerekli değişkenleri sorar:

```
$ aipack install e-commerce-support

Bu paket aşağıdaki yapılandırma bilgilerini gerektiriyor:

  SHOPIFY_API_KEY:    [____________________]
  STRIPE_SECRET_KEY:  [____________________]
  DATABASE_URL:       [____________________]

Bu değerler yerel olarak saklanacak ve asla paylaşılmayacaktır.
```

Değerler kullanıcının makinesinde `~/.aipack/credentials.json` dosyasında (şifrelenmiş) saklanır.

---

## 7. Versiyon Yönetimi

### Semantic Versioning (SemVer)

Tüm paketler [Semantic Versioning 2.0](https://semver.org/) kullanır:

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Hata düzeltmeleri, küçük iyileştirmeler
  │     └──────── Geriye uyumlu yeni özellikler
  └────────────── Kırıcı (breaking) değişiklikler
```

**Örnekler:**
- `1.0.0 → 1.0.1`: Bir kuralda yazım hatası düzeltildi
- `1.0.0 → 1.1.0`: Yeni bir bilgi tabanı eklendi
- `1.0.0 → 2.0.0`: Ajanların yapısı tamamen değişti

### Güncelleme Mekanizması

```bash
# Kurulu paketleri güncelle
aipack update senior-go-backend

# Tüm paketleri güncelle
aipack update --all

# Belirli versiyona sabitle
aipack install senior-go-backend@1.2.0
```

---

## 8. Tam Örnekler

### Örnek 1: Level 1 — Simple Pack

```jsonc
// manifest.json
{
  "spec_version": "1.0",
  "name": "senior-go-backend",
  "version": "1.0.0",
  "description": "Idiomatic Go backend geliştirici. DDD, clean architecture, table-driven test.",
  "author": { "name": "hatred", "github": "hatred" },
  "level": "simple",
  "category": "coding",
  "tags": ["go", "golang", "backend", "ddd", "clean-architecture"],
  "language": "en",

  "persona": {
    "role": "Senior Go Backend Engineer",
    "tone": "Direct, concise, opinionated. No fluff.",
    "expertise": ["Go", "PostgreSQL", "gRPC", "DDD", "Docker"],
    "instructions": "You are a senior Go engineer with 10+ years of experience. You write idiomatic Go that prioritizes readability and maintainability over cleverness."
  },

  "rules": {
    "items": [
      "Always prefer stdlib over third-party packages unless there's a compelling reason",
      "Never use panic() for error handling — always wrap errors with fmt.Errorf or custom error types",
      "Use table-driven tests for all public functions",
      "If a function has more than 3 parameters, use an options struct",
      "All SQL queries must use parameterized queries — no string concatenation",
      "Context (ctx) must be the first parameter in any function that does I/O"
    ]
  }
}
```

### Örnek 2: Level 2 — Enhanced Pack

```jsonc
// manifest.json
{
  "spec_version": "1.0",
  "name": "turkish-tax-advisor",
  "version": "2.1.0",
  "description": "Türk vergi mevzuatı uzmanı. KDV, Gelir Vergisi, Kurumlar Vergisi danışmanlığı.",
  "author": { "name": "vergi_ustasi", "github": "vergiustasi" },
  "level": "enhanced",
  "category": "finance",
  "tags": ["vergi", "tax", "turkey", "muhasebe", "kdv"],
  "language": "tr",

  "persona": {
    "file": "./persona/system.md"
  },

  "rules": {
    "items": [
      "Her zaman ilgili kanun madde numarasını belirt (VUK, GVK, KVK, KDVK)",
      "Asla kesin hukuki garanti verme, 'mevzuata göre değerlendirilmelidir' uyarısı ekle",
      "Vergi oranları ve hadler yıla göre değişir, hangi yılın değerlerini kullandığını belirt",
      "Mükellefin lehine yorumla ama riskleri de açıkla"
    ]
  },

  "knowledge": [
    {
      "name": "tax-laws-2025",
      "description": "2025 yılı Türk vergi mevzuatı özeti",
      "type": "embedded",
      "path": "./knowledge/tax-laws-2025.md",
      "format": "markdown"
    },
    {
      "name": "tax-rates",
      "description": "Güncel vergi oranları ve hadler tablosu",
      "type": "embedded",
      "path": "./knowledge/rates.json",
      "format": "json"
    }
  ],

  "tools": {
    "mcp_servers": [
      {
        "name": "calculator",
        "description": "Vergi hesaplama aracı",
        "source": "npm:aipack-tax-calculator-tr",
        "config": {},
        "required": false
      }
    ]
  }
}
```

### Örnek 3: Level 3 — System Pack

```jsonc
// manifest.json
{
  "spec_version": "1.0",
  "name": "ecommerce-support-system",
  "version": "1.0.0",
  "description": "Tam otomatik e-ticaret müşteri destek sistemi. Yönlendirici + İade + Ürün Uzmanı.",
  "author": { "name": "hatred", "github": "hatred" },
  "level": "system",
  "category": "support",
  "tags": ["e-commerce", "customer-support", "multi-agent", "shopify"],
  "language": "tr",

  "knowledge": [
    {
      "name": "refund-policy",
      "type": "embedded",
      "path": "./knowledge/refund-policy.md"
    },
    {
      "name": "product-catalog",
      "type": "embedded",
      "path": "./knowledge/catalog.json",
      "format": "json"
    }
  ],

  "tools": {
    "mcp_servers": [
      {
        "name": "shopify",
        "source": "npm:@mcp/server-shopify",
        "config": { "store_url": "${SHOPIFY_STORE_URL}", "api_key": "${SHOPIFY_API_KEY}" },
        "required": true
      },
      {
        "name": "stripe",
        "source": "npm:@mcp/server-stripe",
        "config": { "secret_key": "${STRIPE_SECRET_KEY}" },
        "required": true
      }
    ]
  },

  "agents": [
    {
      "id": "router",
      "name": "Yönlendirici",
      "description": "Gelen mesajı analiz eder, doğru ajana yönlendirir",
      "model_preference": "fast",
      "persona": { "file": "./agents/router/system.md" },
      "rules": {
        "items": [
          "Sadece yönlendirme yap, soruyu kendin cevaplama",
          "Emin değilsen kullanıcıya sor"
        ]
      }
    },
    {
      "id": "refund-handler",
      "name": "İade İşlemcisi",
      "model_preference": "smart",
      "persona": { "file": "./agents/refund/system.md" },
      "tools": { "mcp_servers": [{ "ref": "shopify" }, { "ref": "stripe" }] },
      "knowledge": [{ "ref": "refund-policy" }]
    },
    {
      "id": "product-expert",
      "name": "Ürün Uzmanı",
      "model_preference": "balanced",
      "persona": { "file": "./agents/product/system.md" },
      "knowledge": [{ "ref": "product-catalog" }]
    }
  ],

  "workflow": {
    "entry": "router",
    "routes": [
      { "from": "router", "to": "refund-handler", "condition": "intent == 'refund'" },
      { "from": "router", "to": "product-expert", "condition": "intent == 'product'" },
      { "from": "router", "to": "router", "condition": "default", "fallback": true }
    ],
    "shared_context": {
      "pass_conversation_history": true,
      "max_history_messages": 20
    }
  }
}
```

---

## 9. CLI Komutları (Özet)

```bash
# Paket oluşturma & Tersine Mühendislik
packai init <name>              # Yeni paket iskeleti oluştur (--level simple|enhanced|system)
packai init --from-existing     # [05.10.2026] Mevcut projeyi (.claude/, .cursor/, AGENTS.md, mcp.json, skills/, CrewAI) tara ve paket üret
packai validate <path>          # Manifest'i, şemayı ve semantik kuralları doğrula
packai pack <path>              # Dizini .packai arşivine paketle
packai unpack <file>            # .packai arşivini dizine aç
packai info <file|path>         # Paket dosyasının ayrıntılı künyesini incele

# Önkoşul Denetimi, Kurulum ve Çalıştırma (Turnkey Provisioning)
packai apply <path|file>        # Pre-flight sistem denetimi yap, bağımlılıkları kontrol et, Claude/Cursor/OpenCode/Skills kur
packai diff <path|file>         # Değişiklikleri ve istemci yetenek matrisini görsel olarak incele
packai run [target]             # Pre-flight ve secret enjeksiyonuyla framework/script orkestrasyonunu ateşle
packai clean <path|file>        # Enjekte edilen dosyaları, skill'leri ve MCP araçlarını atomik olarak temizle

# İstemci & Eklenti Manifest İhracatı (Exporters)
packai export <path> --target plugins      # Claude Code, Cursor ve Codex eklenti manifestlerini tek tıkla üret
packai export <path> --target cursor       # .cursorrules ve .cursor/rules/*.mdc üret
packai export <path> --target claude       # CLAUDE.md ve .claude/agents/*.md üret
packai export <path> --target chatgpt      # custom_instructions.txt üret
packai export <path> --target agentsmd     # AGENTS.md üret (Linux Foundation AAIF Standardı)
packai export <path> --target windsurf     # .windsurfrules üret (Cascade)
packai export <path> --target roo          # .roomodes üret (Roo-Code / Cline)
```

---

## 10. Dosya Boyutu Limitleri

| Öğe | Limit |
|---|---|
| Tek bir gömülü bilgi tabanı dosyası | 5 MB |
| Toplam gömülü dosya boyutu | 25 MB |
| `manifest.json` boyutu | 256 KB |
| Persona/Rules markdown dosyası | 1 MB |
| Referans (harici) bilgi tabanı | Limitsiz |

---

## 11. Gelecek Versiyonlar (Yol Haritası)

### v1.1 (Planlanan)
- `memory` bloğu: Kullanıcı kişisel hafızası tanımı ve taşınabilirliği
- `voice` bloğu: Ses profili tanımı (provider, voice_id, speed, pitch)

### v1.2 (Planlanan)
- `triggers` bloğu: Olay tabanlı tetikleyiciler ("her sabah 09:00'da çalıştır")
- `compose` bloğu: Birden fazla `.aipack` dosyasını birleştirme kuralları

### v2.0 (Planlanan)
- Paket imzalama (dijital imza ile güvenilirlik doğrulama)
- Şifreli bilgi tabanı desteği (premium paketlerin korunması)
- Custom runtime hooks (paket kurulumunda özel script çalıştırma)
