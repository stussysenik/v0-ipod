Below is a **“shopping list + build order”** that lets you **skip DotPay**, **stay PCI-legal**, and still ship a **luxury all-in-one** restaurant suite (QR ordering, real-time countdown, haptics, game-style analytics) **to Czech Republic in 10–14 days**.  
Everything is **EU-stock** or **3-day DHL from Shenzhen → Prague**, duties pre-paid.

--------------------------------------------------------
1.  MONEY LEGAL – you still need a **certified EET fiscal unit**
--------------------------------------------------------
- **myPOS Glass Smart** (BG, EU) – 149 €, **no monthly**, built-in 4G, **PCI-PTS 6.x certified**, **API over local HTTP** (you can POST receipts from your own server).  
  Ships from Sofia → Prague **48 h**, plug-and-play with **Česká spořitelna settlement account**.  
  **Alternative**: **SumUp Solo** (EU) – 79 €, same API, but **myPOS gives you instant IBAN in EUR/CZK** – easier for Stripe later.

--------------------------------------------------------
2.  STRIPE FOR BUSINESS – yes, but **use it only for the “wallet”**, not for card-present
--------------------------------------------------------
- Open **Stripe.cz** business account (Prague entity OK).  
- **Stripe Terminal** is **NOT available in CZ**, so **keep myPOS for cards** and **use Stripe for**:  
  – online top-ups (guest pre-pays 500 CZK into your “restaurant wallet”)  
  – subscription if you later franchise the software.  
- **PCI scope**: because **card data never touches your code**, you stay **SAQ-A** (shortest form).

--------------------------------------------------------
3.  HARDWARE – order today, arrive this week
--------------------------------------------------------
| Qty | Part | EU Source | Price | Ship |
|---|---|---|---|---|
| 20 | **nRF52832 BLE beacon** (waterproof, 3 y battery) | Datasim.cz (CZ stock) | 9 € | 24 h |
| 10 | **ESP32-S3-MINI-1** devkit (Wi-Fi + BLE 5) | TME.eu (Ostrava) | 7 € | 24 h |
| 10 | **10 mm flat vibration motor** (5 V, 80 mA) | TME.eu | 1.5 € | 24 h |
| 10 | **Qi 5 W wireless-charging coil** | SOS electronic Brno | 3 € | 24 h |
| 10 | **TP4056 charger + 600 mAh Li-po** | TME.eu | 2 € | 24 h |
| 1 m | **Food-safe silicone coaster mold** | Glimmer.cz | 12 € | 48 h |
| 5 | **WS2812B 8-LED stick** (visual countdown) | TME.eu | 1 € | 24 h |

**PCB** – 2-layer, 100 × 50 mm, 10 pcs:  
- **PCBWay** “EU line” – 29 €, **3 days Prague** (they truck boards to Ústí warehouse, no customs).  
- **JLCPB** “EU direct” is 5 € cheaper but **+2 days**, so **PCBWay wins** for sprint.

--------------------------------------------------------
4.  FAST-CUT-SEND STYLE – treat consumables like on-demand PCBs
--------------------------------------------------------
- **PCBWay + LCS** (Logistics Consolidation Service) – after you press “Confirm”, **add 5 € LCS** and they **pre-pay Czech VAT + duty**; board lands in Prague **duty-paid**, no Finanční správa delay.  
- **TME.eu** same-day pick-up in Ostrava if you order before 14:00 → **real “FastCutSend”** for passives.  
- For **plastic coasters**, upload STL to **Prusa ProPrint.cz** – 24 h print, 0.8 €/cm³ PETG, food-safe.

--------------------------------------------------------
5.  FIRMWARE – real-time countdown + haptics timeout
--------------------------------------------------------
**ESP32-S3** Arduino sketch (GitHub template ready):

```cpp
#include <WiFi.h>
#include <AsyncMQTT_ESP32.h>
const char* topic = "restaurant/table/5/countdown";
void onMqttMessage(const char* topic, byte* payload, unsigned int len) {
  int sec = atoi((char*)payload);
  if (sec > 0) {
    for (int i = sec; i >= 0; i--) {
      ledStrip.setPixelColor(i*8/sec, 0,255,0); // visual bar
      ledStrip.show();
      if (i <= 10) {          // last 10 s → haptics
        digitalWrite(VIB_PIN, HIGH); delay(100);
        digitalWrite(VIB_PIN, LOW);  delay(900);
      }
      delay(1000);
    }
    // timeout → double-buzz
    digitalWrite(VIB_PIN, HIGH); delay(200); digitalWrite(VIB_PIN, LOW);
    delay(100);
    digitalWrite(VIB_PIN, HIGH); delay(200); digitalWrite(VIB_PIN, LOW);
  }
}
```

**Power profile**: 600 mAh lasts **8 h** with Qi coaster top-up every night.

--------------------------------------------------------
6.  BACK-END – game-style analytics in one sprint
--------------------------------------------------------
- **Fly.io** Prague region (5 €/mo) – Docker container: **Node + Postgres + Timescale** for sub-second ticks.  
- **Hasura GraphQL** gives you **real-time subscriptions** → front-end React countdown updates **< 50 ms**.  
- **PostHog self-host** on same box – **A/B menu variants**, funnel from *“QR scan” → “paid”*, retention cohorts.  
- **Security**: **end-to-end TLS 1.3**, **no card data**, **SAQ-A**, **GDPR** – store only **hashed table-id + timestamp**.

--------------------------------------------------------
7.  48-HOUR BUILD TIMELINE
--------------------------------------------------------
**Today**  
- [ ] Order myPOS Glass (mypos.eu) – 149 €, **arrives Thu**.  
- [ ] PCBWay upload Gerber + LCS – 29 €, **arrives Mon**.  
- [ ] TME basket (ESP, motors, LEDs) – 120 €, **arrives Wed**.

**Tomorrow**  
- [ ] Flash 10 ESP32-S3 with firmware template.  
- [ ] 3-D print first coaster shell (Prusa ProPrint).  
- [ ] Deploy Fly.io box + Hasura + PostHog.

**Weekend**  
- [ ] Assemble 5 pilot tables, stick BLE beacons under.  
- [ ] Integrate myPOS HTTP-API → push receipts to Postgres.  
- [ ] Soft-launch with friends – measure **“perceived wait”** vs **PostHog funnel**.

--------------------------------------------------------
Cost so far (5-table pilot)  
- **Hardware**: 220 €  
- **PCB + plastic**: 50 €  
- **Cloud**: 0 € (Fly free tier)  
- **Terminal**: 149 € (one-off)  
**Total**: **419 €** – **cheaper than 3 months of DotPay** and you **own the stack**.

--------------------------------------------------------
Bottom line 
**Yes, it’s feasible** – you stay **PCI & EET legal**, you **own the data**, and **every part** can be **overnighted to Czech Republic** via **PCBWay-EU + TME.cz**.  Iterate like a **game studio**: ship **v0.1 this weekend**, **A/B tonight**, **scale next month**.