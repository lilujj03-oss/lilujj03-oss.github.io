# 披薩推薦機器人資料

此文件與 `pizza-data.json` 使用同一份官方菜單資料。推薦網站直接載入 JSON，不另外維護品項清單。

## 資料來源

- 官方菜單：https://www.dominos.com.tw/menu/
- 擷取日期：2026-08-15
- 官方頁面產品卡數：53
- 價格：官方菜單列表頁未提供可直接擷取的價格，JSON 中以 `null` 表示，實際價格以官方結帳頁為準。
- 注意：同一產品可能因一般版、尺寸、火山版或不同菜單區段而有重複名稱；為保持原始資料完整，JSON 依官方產品卡逐筆保留。推薦結果會避免顯示完全相同名稱。

## 欄位說明

| 欄位 | 說明 |
|---|---|
| `id` | 產品代碼加官方頁面順序所形成的唯一識別碼 |
| `product_code` | 達美樂產品代碼 |
| `name` | 官方品項名稱 |
| `official_description` | 官方菜單描述 |
| `price` | 價格；無法由列表頁取得時為 `null` |
| `official_detail_url` | 官方產品詳情頁 |
| `official_order_url` | 官方訂購入口 |
| `official_image_url` | 官方產品圖片網址，僅作資料引用 |
| `recommendation` | 推薦器衍生分類：口味、路線、辣度與標籤 |

## 完整品項

| # | 代碼 | 官方品項 | 類型 | 辣 | 推薦路線 |
|---:|---|---|---|:---:|---|
| 1 | 760461 | [買大送大](ttps://order.dominos.com.tw/?vc=760461) | meat | 否 | classic |
| 2 | PKJT | [日韓半半](https://www.dominos.com.tw/menu-pizza/pizza-pkjt) | seafood | 是 | special |
| 3 | PTYK | [日式章魚燒](https://www.dominos.com.tw/menu-pizza/pizza-ptyk) | seafood | 否 | special |
| 4 | PGDH | [金鑽夏威夷](https://www.dominos.com.tw/menu-pizza/pizza-pgdh) | meat | 否 | classic |
| 5 | PKSC | [韓風炸雞披薩](https://www.dominos.com.tw/menu-pizza/pizza-pksc) | meat | 是 | special |
| 6 | PCBQ | [BBQ雞肉](https://www.dominos.com.tw/menu-pizza/bbq-pcbq) | fresh | 否 | classic |
| 7 | PJCC | [和風奶油蟹肉披薩](https://www.dominos.com.tw/menu-pizza/pizza-pjcc) | seafood | 否 | special、cheese |
| 8 | PLBS | [龍蝦舞沙拉](https://www.dominos.com.tw/menu-pizza/pizza-plbs) | seafood | 否 | special |
| 9 | PSDX | [超級豪華](https://www.dominos.com.tw/menu-pizza/pizza-psdx) | meat | 否 | classic |
| 10 | PGDH12V | [金鑽夏威夷(火山)](https://www.dominos.com.tw/menu-pizza/pizza-pgdh12v) | meat | 否 | special、cheese |
| 11 | QSGQ12V | [招牌四喜(火山)](https://www.dominos.com.tw/menu-pizza/pizza-qsgq12v) | meat | 否 | special、cheese |
| 12 | QSSQ12C | [招牌海鮮四喜奶香火山](https://www.dominos.com.tw/menu-pizza/pizza-qssq12c) | seafood | 否 | special、cheese |
| 13 | PSEL12E | [海陸金沙起司火山](https://www.dominos.com.tw/menu-pizza/pizza-psel12e) | seafood | 否 | special、cheese |
| 14 | PPSS12C | [極致干貝海鮮奶香火山](https://www.dominos.com.tw/menu-pizza/pizza-ppss12c) | seafood | 否 | special、cheese |
| 15 | PCBQ12V | [BBQ雞肉(火山)](https://www.dominos.com.tw/menu-pizza/bbq-pcbq12v) | meat | 否 | special、cheese |
| 16 | PASS | [極致白醬干貝海鮮](https://www.dominos.com.tw/menu-pizza/pizza-pass) | seafood | 否 | special、cheese |
| 17 | PPSS | [極致干貝海鮮](https://www.dominos.com.tw/menu-pizza/pizza-ppss) | seafood | 否 | special |
| 18 | PPDX | [極致豪華](https://www.dominos.com.tw/menu-pizza/pizza-ppdx) | meat | 否 | special |
| 19 | QPMQ | [極致四喜](https://www.dominos.com.tw/menu-pizza/pizza-qpmq) | meat | 是 | special |
| 20 | PGSB | [極致蒜香壽喜牛](https://www.dominos.com.tw/menu-pizza/pizza-pgsb) | meat | 否 | special |
| 21 | PJCS12H | [日式奶油鮭魚披薩](https://www.dominos.com.tw/menu-pizza/pizza-pjcs12h) | seafood | 否 | special、cheese |
| 22 | PCSB | [頂鮭豪牛雙饗](https://www.dominos.com.tw/menu-pizza/pizza-pcsb) | seafood | 否 | special |
| 23 | QSEA | [海龍王四喜](https://www.dominos.com.tw/menu-pizza/pizza-qsea) | seafood | 否 | special |
| 24 | QSME | [肉魔王四喜](https://www.dominos.com.tw/menu-pizza/pizza-qsme) | meat | 否 | special |
| 25 | QPSQ | [極致海鮮四喜](https://www.dominos.com.tw/menu-pizza/pizza-qpsq) | seafood | 否 | special |
| 26 | PDLS | [金鑽龍蝦沙拉](https://www.dominos.com.tw/menu-pizza/pizza-pdls) | seafood | 否 | special |
| 27 | PKJT | [日韓半半](https://www.dominos.com.tw/menu-pizza/pizza-pkjt) | seafood | 是 | special |
| 28 | PTYK | [日式章魚燒](https://www.dominos.com.tw/menu-pizza/pizza-ptyk) | seafood | 否 | special |
| 29 | PKSC | [韓風炸雞披薩](https://www.dominos.com.tw/menu-pizza/pizza-pksc) | meat | 是 | special |
| 30 | PGDH | [金鑽夏威夷](https://www.dominos.com.tw/menu-pizza/pizza-pgdh) | meat | 否 | classic |
| 31 | PLBS | [龍蝦舞沙拉](https://www.dominos.com.tw/menu-pizza/pizza-plbs) | seafood | 否 | special |
| 32 | PSDX | [超級豪華](https://www.dominos.com.tw/menu-pizza/pizza-psdx) | meat | 否 | classic |
| 33 | PSVG | [田園鮮蔬](https://www.dominos.com.tw/menu-pizza/pizza-psvg) | fresh | 否 | classic |
| 34 | PSMX | [超級墨西哥](https://www.dominos.com.tw/menu-pizza/pizza-psmx) | meat | 是 | classic |
| 35 | QSSQ | [招牌海鮮四喜](https://www.dominos.com.tw/menu-pizza/pizza-qssq) | seafood | 否 | special、cheese |
| 36 | QSGQ | [招牌四喜](https://www.dominos.com.tw/menu-pizza/pizza-qsgq) | meat | 否 | special |
| 37 | PCBQ | [BBQ雞肉](https://www.dominos.com.tw/menu-pizza/bbq-pcbq) | fresh | 否 | classic |
| 38 | PKMP | [韓風泡菜豬肉](https://www.dominos.com.tw/menu-pizza/pizza-pkmp) | meat | 是 | special |
| 39 | PSUS | [超級美國](https://www.dominos.com.tw/menu-pizza/pizza-psus) | meat | 否 | special |
| 40 | PTSQ | [照燒花枝](https://www.dominos.com.tw/menu-pizza/pizza-ptsq) | seafood | 否 | special |
| 41 | PGDH9T | [薄脆金鑽夏威夷小披薩](https://www.dominos.com.tw/menu-pizza/pizza-pgdh9t) | meat | 否 | special |
| 42 | PJCC | [和風奶油蟹肉披薩](https://www.dominos.com.tw/menu-pizza/pizza-pjcc) | seafood | 否 | special、cheese |
| 43 | PDLX | [在地食鮮總匯](https://www.dominos.com.tw/menu-pizza/pizza-pdlx) | meat | 否 | classic |
| 44 | PPMG | [番茄瑪格麗特](https://www.dominos.com.tw/menu-pizza/pizza-ppmg) | fresh | 否 | classic、cheese |
| 45 | PCCH | [香草奶油烤雞](https://www.dominos.com.tw/menu-pizza/pizza-pcch) | meat | 否 | classic、cheese |
| 46 | PCSS | [蟹肉鮮蝦沙拉](https://www.dominos.com.tw/menu-pizza/pizza-pcss) | seafood | 否 | classic |
| 47 | PUSA | [道地美國](https://www.dominos.com.tw/menu-pizza/pizza-pusa) | meat | 否 | special、cheese |
| 48 | PCSV | [白醬彩蔬](https://www.dominos.com.tw/menu-pizza/pizza-pcsv) | fresh | 否 | classic、cheese |
| 49 | QACN | [經典四喜](https://www.dominos.com.tw/menu-pizza/pizza-qacn) | fresh | 否 | special、cheese |
| 50 | PECC | [增量起司餅](https://www.dominos.com.tw/menu-pizza/pizza-pecc) | meat | 否 | classic、cheese |
| 51 | PPMG9T | [薄脆小農番茄瑪格麗特小披薩](https://www.dominos.com.tw/menu-pizza/pizza-ppmg9t) | fresh | 否 | special、cheese |
| 52 | PKJT16I | [日韓半半披薩](https://www.dominos.com.tw/menu-pizza/pizza-pkjt16i) | seafood | 是 | special |
| 53 | PKSC16I | [韓風炸雞披薩 (巨)](https://www.dominos.com.tw/menu-pizza/pizza-pksc16i) | meat | 是 | special |

## 一致性規則

1. 官方欄位只來自達美樂菜單頁，不自行改寫品項名稱或官方描述。
2. `recommendation` 是依名稱與官方描述衍生的本機分類，供篩選與排序使用。
3. 網頁的推薦結果直接讀取 `pizza-data.json`；更新品項時只需重新生成 JSON 與本文件。
4. 本專案不是達美樂官方服務，不處理付款、地址、電話或會員資料。
