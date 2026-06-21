# Executive Summary  
A mix of open-device specs and e-commerce datasets can cover most electronics categories. Key free sources include **DBpedia/Wikidata** (Wikipedia-derived specs and CC-licensed images for phones, cameras, etc. via SPARQL dumps); **MobileAPI.dev** (free API tier for 31,000+ smartphones, tablets, laptops, wearables, with JSON specs and base64 images); and **GSMArena scrapers** (open-source API wrappers like *gsmarena2api* returning JSON brand/device specs and thumbnails). Supplement with **Kaggle datasets** (static CSVs of phones, cameras, headphones; e.g. GSMArena phones) and **Wikimedia Commons** images (CC BY-SA photos via DBpedia thumbnails).  Together these cover mobiles, wearables, tablets, laptops, cameras, and some accessories.  Categories like headphones/speakers can use niche Kaggle dumps (e.g. a global headphones spec set) or resort to public APIs (Amazon/eBay PA/affiliate) as a fallback. No fully free source exists for basic accessories (cases, chargers, cables, power banks) – in practice one would integrate vendor/affiliate feeds for those.  

# Sources & Integration Options  

- **DBpedia/Wikidata (Open-Data RDF)** – Contains device models and specs extracted from Wikipedia infoboxes (smartphones, cameras, etc.).  e.g. the *Smartphone* entry lists hundreds of models with specs as RDF/JSON/CSV.  Licenced CC BY-SA (free to reuse).  Images: provides Wikimedia thumbnail URLs (CC BY-SA) for many devices.  Update: monthly with Wikipedia.  Integration: via SPARQL or nightly DBpedia dumps; ease=medium.  *Sample*: SPARQL query to list smartphone models (WD Q19723451) and retrieve labels/specs.

- **MobileAPI.dev (Public REST API)** – SaaS device database (free tier) for **phones, tablets, laptops, smartwatches**. Provides JSON specs (structured by categories) and images (base64). Covers ~31,500 devices (global brands). Free tier ~200 calls/month. Update: continuous (daily content sync by provider).  Integration: easy (HTTP GET); embed in cron jobs. *Sample endpoint*: `GET https://api.mobileapi.dev/devices/search?name=Galaxy+S24&key=APIKEY`.  *Caveats*: limited free calls; images may require attribution per terms.  

- **GSMArena scrapers/APIs (Community code)** – GSMArena’s phone/tablet database (unofficial) via open-source projects. For example, *gsmarena2api* exposes endpoints:  
  - `/brands` – lists all brands and counts (JSON).  
  - `/brands/{id}` – lists devices under a brand (with thumbnail URLs, summaries).  
  - `/devices/{id}` – full specs of a device (with thumbnail).  
  Covers **phones and tablets**. Images: GSMArena-hosted JPEGs (no reuse license). Update: as often as scraper runs (recommend nightly). Integration: run the Python scraper locally or deploy (cron). Ease=medium. *Note*: GSMArena’s terms forbid scraping, so use judiciously or consider these solutions as examples.

- **Kaggle/Open Datasets (Static CSV/JSON)** – Various electronics datasets: e.g. *GSMArena Phones* (≈12K devices, 108 brands, images via URL), *DPReview Cameras* (1,700 cameras with specs/images), *Amazon Electronics* (10K products) and *Global Headphones Specs* (3K headphones). These yield product lists and attributes. Images: some link to Amazon or scraped images (license usually not CC). Update: usually none (static snapshot). Integration: one-time import (download CSV); ease=easy for data load. Caveat: stale data, mixed licensing.  

- **Wikimedia Commons (Images)** – High-quality CC-licensed product photos. Many device models (phones, cameras, watches) have images on Commons. Example thumbnails via DBpedia: Xiaomi Mi 11, Samsung Watch 7. Integration: fetch image URLs from DBpedia/Commons or search Commons API; ease=easy. License: CC BY-SA 4.0 (free with attribution). Use only CC images for public products.  

- **(Optional) Public Retailer APIs** – No truly open API for accessories; paid/affiliate routes exist. For **broad coverage including speakers/headphones**, consider Amazon Product Advertising API or eBay Finding API (free limited calls, returns product info and images, subject to usage terms). These require developer keys and have usage limits, making integration moderate/hard. Images obtained are copyrighted (use only via permitted contexts).  

# Category-to-Source Mapping  

| Category                 | Primary Source(s)                   | Notes                                                                   |  
|--------------------------|-------------------------------------|-------------------------------------------------------------------------|
| **Mobile Phones**        | MobileAPI.dev (API); GSMArena2API (scraper); DBpedia/Wikidata (RDF)  | e.g. MobileAPI “search” by name, GSMArena by brand list; Wikimedia images via DBpedia. |
| **Smart Watches**        | MobileAPI.dev; DBpedia (Wikidata entries for watches, e.g. Galaxy Watch) | MobileAPI covers many wearables; DBpedia has individual watch pages.      |
| **Tablets**              | MobileAPI.dev; GSMArena2API (see Apple iPad example); DBpedia (e.g. iPad models) |  
| **Laptops**              | MobileAPI.dev; DBpedia (Laptop models)   | MobileAPI claims ~5K laptops; Wikimedia has some images; else scant free data. |
| **Cameras & Tripods**    | Kaggle DPReview dataset; DBpedia (“Digital camera” pages); Wikimedia Commons (camera images) | Kaggle DPReview (1,700 DSLRs, mirrorless) with specs and sample images. Tripods: no free catalog (use generic market data). |
| **Buds & Headphones**    | Kaggle Headphones dataset; (Optionally Amazon/eBay API) | Example: Kaggle “Global Headphones Specs” (3K products, ANC, ratings). Otherwise retailer API. |
| **Speakers & Sound**     | Limited free options – see **Public APIs**. | No central free source; rely on Amazon/BestBuy APIs or crawling (subject to license). |
| **Cases & Covers**       | None known free – use product feeds. | No open dataset; potential use of affiliate feeds or custom scraping.      |
| **Power Banks**          | None – product feeds required. | As above; possibly Wikipedia “Power bank” list (small).                 |
| **Cables & Chargers**    | None – product feeds required. | Very few open sources; typically manual vendor lists.                   |
| **Computer Accessories** | Limited (Keyboards/mice on some retailer APIs) | Eg. use eBay/Alibaba listing API or vendor catalogs for keyboards/mice, etc. |

# Recommended Integration Pipeline  

- **Data Storage**: One unified **Products** table/collection (with fields: category, brand, model, specs) plus an **Images** table (URL or binary data, plus license). Optionally split by category (e.g. `Devices`, `Accessories`).  
- **Sync Schedule**:  
  - **Daily/weekly pulls** from dynamic sources: run MobileAPI calls (brand/year loops) and GSMArena scraper (brand pages).  
  - **Weekly DBpedia/Wikidata update**: refresh RDF dumps or SPARQL queries (gives new Wikipedia devices).  
  - **One-time import** of static Kaggle CSVs (cameras, headphones), then occasional refresh (e.g. quarterly) if new releases appear.  
  - **Images**: after new product entries, fetch Wikimedia Commons images by querying DBpedia/Wikidata thumbnail properties or Commons API. Store images per CC license.  
- **Normalization**: Map fields to common schema (e.g. `device.name`, `brand`, `release_date`, specs per category, `image_url`). Use transformation scripts (e.g. Python) to parse JSON/CSV into DB format.  
- **Sample Request (curl)**:  
  ```bash
  # Example: search device via MobileAPI
  curl -G "https://api.mobileapi.dev/devices/search" \
    --data-urlencode "name=Galaxy S24 Ultra" \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```  
  ```bash
  # Example: fetch Samsung devices via GSMArena2API
  curl "http://localhost:8000/brands/samsung-phones-9.php"
  ```  
- **Architecture Notes**: Use a relational DB or document store. Tables/collections could include: **Brands**, **Devices**, **Categories**, **Specs**, **Images**. Schedule sync jobs (cron/Airflow) per source. Ensure rate limits (e.g. honor MobileAPI free tier, Wikipedia’s robot rules).  

By combining these sources as above, you get a continuously updating seed inventory of products across the requested categories.  (For missing categories like cables/chargers, plan to either manually curate or use general retail APIs, as no free open dataset exists.)  

**Sources:** DBpedia/Wikidata (phones/watches); MobileAPI.dev (device specs API); GSMArena (via open scrapers); Kaggle (phones/cameras); Wikimedia Commons (CC images).