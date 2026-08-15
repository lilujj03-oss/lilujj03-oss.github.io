# 原始資料與生成資料對照表

本表由 `pizza-data.json` 自動生成。原始資料來自達美樂台灣官方菜單，生成資料則是本專案為推薦排序所衍生的分類。

## 資料來源

| 類型 | 來源 | 更新／擷取日期 | 說明 |
|---|---|---|---|
| 原始資料 | [達美樂台灣官方菜單](https://www.dominos.com.tw/menu/) | 2026-08-15 | 品項名稱、官方描述、產品代碼、詳情頁、訂購連結及圖片網址 |
| 生成資料 | `pizza-data.json` 的 `recommendation` 欄位 | 2026-08-15 | 依官方名稱及描述衍生的口味、推薦路線、辣度與標籤 |

## 欄位對照

| 原始欄位 | 生成欄位 | 轉換方式 |
|---|---|---|
| `name`、`official_description` | `recommendation.flavor` | 依海鮮、肉類、蔬菜與番茄等關鍵內容分類為 `seafood`、`meat`、`fresh` |
| `name`、`official_description` | `recommendation.moods` | 依經典、特殊、起司／奶香／火山等特徵分類為 `classic`、`special`、`cheese` |
| `name`、`official_description` | `recommendation.spicy` | 名稱或描述含辣味、泡菜、韓風或墨西哥等特徵時標示為 `true` |
| `name`、`official_description` | `recommendation.tags` | 擷取海鮮、肉類、清爽、起司／奶香、辣味、四喜及火山等可讀標籤 |
| 官方菜單未提供列表價格 | `price` | 不推測價格，保存為 `null`，以官方結帳頁為準 |

## 53 筆逐項對照

| # | 產品代碼 | 官方名稱 | 官方描述 | 生成口味 | 生成路線 | 生成辣度 | 生成標籤 |
|---:|---|---|---|---|---|:---:|---|
| 1 | 760461 | [買大送大](ttps://order.dominos.com.tw/?vc=760461) | 買大送大 | meat | classic | 否 | 肉類 |
| 2 | PKJT | [日韓半半](https://www.dominos.com.tw/menu-pizza/pizza-pkjt) | 一次享受日韓雙重風味！一半是鹹甜日式章魚燒風味，搭配海苔與柴魚香氣；另一半則是韓式辣醬炸雞的微辣層次，雙拼呈現，豐富又滿足。 | seafood | special | 是 | 海鮮、辣味 |
| 3 | PTYK | [日式章魚燒](https://www.dominos.com.tw/menu-pizza/pizza-ptyk) | 經典日式章魚燒口味，選用鮮甜章魚與滿滿柴魚片，搭配特製美乃滋，每一口都是道地章魚燒風味，用料實在，一口接一口欲罷不能！ | seafood | special | 否 | 海鮮 |
| 4 | PGDH | [金鑽夏威夷](https://www.dominos.com.tw/menu-pizza/pizza-pgdh) | 特別選用台灣本土生產的台農17號金鑽鳳梨，與台灣豬製造的台畜高崎火腿完美融合，營造出絕妙平衡的酸甜風味。每一口都彷彿夏天的陽光和... | meat | classic | 否 | 肉類 |
| 5 | PKSC | [韓風炸雞披薩](https://www.dominos.com.tw/menu-pizza/pizza-pksc) | 外酥內嫩的金黃炸雞，搭配韓式辣醬與滑順美乃滋交錯淋覆，鹹香中帶微辣層次，再以海苔粉點綴，打造香氣與口感兼具的韓風經典。 | meat | special | 是 | 肉類、辣味 |
| 6 | PCBQ | [BBQ雞肉](https://www.dominos.com.tw/menu-pizza/bbq-pcbq) | 加州風味BBQ雞肉披薩，是大人小孩都愛不釋手的美味之選。特調BBQ醬汁搭配國產雞腿肉片，並以洋蔥、玉米和契作杏鮑菇等新鮮蔬菜鋪滿... | fresh | classic | 否 | 清爽 |
| 7 | PJCC | [和風奶油蟹肉披薩](https://www.dominos.com.tw/menu-pizza/pizza-pjcc) | 奶香不膩的日式風味！蟹肉 × 鴻禧菇的滑順口感，一吃就愛上 | seafood | special、cheese | 否 | 海鮮、起司／奶香 |
| 8 | PLBS | [龍蝦舞沙拉](https://www.dominos.com.tw/menu-pizza/pizza-plbs) | 達美樂獨有經典龍蝦舞沙拉披薩，每一口都能感受到豐富的口感和美味。新鮮的洋蔥搭配上小龍蝦肉、花枝、魚卵和日式沙拉醬製作成的日式龍蝦... | seafood | special | 否 | 海鮮 |
| 9 | PSDX | [超級豪華](https://www.dominos.com.tw/menu-pizza/pizza-psdx) | 就是要給你一口咬下即有的大滿足感！超豪華配料包含新鮮洋蔥、青椒、契作杏鮑菇、台灣豬高崎火腿、香腸片、香腸丁，賦予每一口豐富多層次... | meat | classic | 否 | 肉類 |
| 10 | PGDH12V | [金鑽夏威夷(火山)](https://www.dominos.com.tw/menu-pizza/pizza-pgdh12v) | 達美樂獨家起司火山，吸睛火山造型，滿滿起司熔岩，全新披薩體驗，沾著吃更美味更好玩！ 特別選用台灣本土生產的台農17號金鑽鳳梨，與... | meat | special、cheese | 否 | 肉類、起司／奶香、火山 |
| 11 | QSGQ12V | [招牌四喜(火山)](https://www.dominos.com.tw/menu-pizza/pizza-qsgq12v) | 達美樂獨家起司火山，吸睛火山造型，滿滿起司熔岩，全新披薩體驗，沾著吃更美味更好玩！ 招牌四喜一次滿足四種渴望！第一喜為全新的台農... | meat | special、cheese | 否 | 肉類、起司／奶香、四喜、火山 |
| 12 | QSSQ12C | [招牌海鮮四喜奶香火山](https://www.dominos.com.tw/menu-pizza/pizza-qssq12c) | 由主廚特選推薦的海鮮四喜，喜愛海鮮和經典口味的你絕對別錯過！此款四喜披薩給你海鮮和經典的超級大餐。＊使用在地食材 | seafood | special、cheese | 否 | 海鮮、起司／奶香、四喜、火山 |
| 13 | PSEL12E | [海陸金沙起司火山](https://www.dominos.com.tw/menu-pizza/pizza-psel12e) | 首創象徵招財好運噴發的「金沙起司火山」濃郁起司醬融合金黃鹹蛋金沙，披薩上集結厚實干貝、多汁鮮蝦等海味，搭配外酥內嫩的酥脆雞塊，帶... | seafood | special、cheese | 否 | 海鮮、起司／奶香、火山 |
| 14 | PPSS12C | [極致干貝海鮮奶香火山](https://www.dominos.com.tw/menu-pizza/pizza-ppss12c) | 達美樂經典火山造型，沾著吃更美味更好玩！嚴選上等干貝、印度洋大白蝦，搭配新鮮菠菜和香甜洋蔥，每一口都是鮮美滋味和豐富口感的極致享... | seafood | special、cheese | 否 | 海鮮、起司／奶香、火山 |
| 15 | PCBQ12V | [BBQ雞肉(火山)](https://www.dominos.com.tw/menu-pizza/bbq-pcbq12v) | 達美樂獨家起司火山，吸睛火山造型，滿滿起司熔岩，全新披薩體驗，沾著吃更美味更好玩！ 加州風味BBQ雞肉披薩，是大人小孩都愛不釋手... | meat | special、cheese | 否 | 肉類、起司／奶香、火山 |
| 16 | PASS | [極致白醬干貝海鮮](https://www.dominos.com.tw/menu-pizza/pizza-pass) | 在散發迷人香氣的手工拍製餅皮，抹上香醇濃郁的奶油乳酪醬，再以嚴選大干貝、印度洋大白蝦、翠綠菠菜及香甜洋蔥佈滿其上，一口咬下即迸發... | seafood | special、cheese | 否 | 海鮮、起司／奶香 |
| 17 | PPSS | [極致干貝海鮮](https://www.dominos.com.tw/menu-pizza/pizza-ppss) | 極致干貝海鮮披薩全新進化！嚴選上等干貝、印度洋大白蝦，搭配新鮮菠菜和香甜洋蔥，每一口都是鮮美滋味和豐富口感的極致享受。豐富海鮮食... | seafood | special | 否 | 海鮮 |
| 18 | PPDX | [極致豪華](https://www.dominos.com.tw/menu-pizza/pizza-ppdx) | 將口感昇華至極致的頂級豪華盛宴，高達十款極品配料，絕對驚艷您的味蕾！＊此產品有豬肉成分 | meat | special | 否 | 肉類 |
| 19 | QPMQ | [極致四喜](https://www.dominos.com.tw/menu-pizza/pizza-qpmq) | 一次享受尊榮四重奏！首先是在地金鑽鳳梨及台灣豬高崎火腿的升級版夏威夷；其次墨西哥辣椒與香腸交融，帶您走入異國美食之境，包含台灣各... | meat | special | 是 | 肉類、辣味、四喜 |
| 20 | PGSB | [極致蒜香壽喜牛](https://www.dominos.com.tw/menu-pizza/pizza-pgsb) | 邀您品味日本風情的蒜香壽喜牛披薩，親嚐充滿精緻日式風味的極上食材。以濃郁壽喜燒醬汁為基底，配上香氣四溢的壽喜牛肉，再搭配洋蔥、紅... | meat | special | 否 | 肉類 |
| 21 | PJCS12H | [日式奶油鮭魚披薩](https://www.dominos.com.tw/menu-pizza/pizza-pjcs12h) | 以手拍餅皮鋪底，抹上日式奶油鴻禧菇醬，搭配碳烤鮭魚肚與彩椒洋蔥點綴。入口先是柔和滑順的奶香，接著帶出鮭魚的細緻油脂與菇香層次，整... | seafood | special、cheese | 否 | 海鮮、起司／奶香 |
| 22 | PCSB | [頂鮭豪牛雙饗](https://www.dominos.com.tw/menu-pizza/pizza-pcsb) | 炙烤頂級鮭魚肚+炭燒牛肉，海陸美味層層堆疊，一口咬下豪奢滿足感爆發，不論是海鮮派或是肉食派都難以抗拒！ | seafood | special | 否 | 海鮮 |
| 23 | QSEA | [海龍王四喜](https://www.dominos.com.tw/menu-pizza/pizza-qsea) | 海龍王四喜豪氣集結四種海鮮口味！每一口都像在海裡開派對！「照燒花枝」開場，鮮嫩花枝佐上鹹甜照燒醬，鹹香開胃；第二喜「干貝海鮮」嚴... | seafood | special | 否 | 海鮮、四喜 |
| 24 | QSME | [肉魔王四喜](https://www.dominos.com.tw/menu-pizza/pizza-qsme) | 肉魔王四喜匯聚主廚精選的「道地美式」、「蒜香壽喜牛」、「BBQ雞肉」與「超級豪華」四大熱銷風味，牛、豬、雞三重滋味相互碰撞，掀起... | meat | special | 否 | 肉類、四喜 |
| 25 | QPSQ | [極致海鮮四喜](https://www.dominos.com.tw/menu-pizza/pizza-qpsq) | 豪奢海鮮極獻，四種風味層次一次擁有！第一層品嚐香濃照燒醬，搭配鮮嫩花枝、洋蔥、紅椒等鮮蔬的完美融合；第二層迎接台農金鑽17號鳳梨... | seafood | special | 否 | 海鮮、四喜 |
| 26 | PDLS | [金鑽龍蝦沙拉](https://www.dominos.com.tw/menu-pizza/pizza-pdls) | 達美樂獨家呈獻金鑽龍蝦沙拉披薩，採用台農17號金鑽鳳梨、印度洋大白蝦、龍蝦沙拉、蟹肉條，再淋上香甜可口的美乃滋，每一口都散發濃郁... | seafood | special | 否 | 海鮮 |
| 27 | PKJT | [日韓半半](https://www.dominos.com.tw/menu-pizza/pizza-pkjt) | 一次享受日韓雙重風味！一半是鹹甜日式章魚燒風味，搭配海苔與柴魚香氣；另一半則是韓式辣醬炸雞的微辣層次，雙拼呈現，豐富又滿足。 | seafood | special | 是 | 海鮮、辣味 |
| 28 | PTYK | [日式章魚燒](https://www.dominos.com.tw/menu-pizza/pizza-ptyk) | 經典日式章魚燒口味，選用鮮甜章魚與滿滿柴魚片，搭配特製美乃滋，每一口都是道地章魚燒風味，用料實在，一口接一口欲罷不能！ | seafood | special | 否 | 海鮮 |
| 29 | PKSC | [韓風炸雞披薩](https://www.dominos.com.tw/menu-pizza/pizza-pksc) | 外酥內嫩的金黃炸雞，搭配韓式辣醬與滑順美乃滋交錯淋覆，鹹香中帶微辣層次，再以海苔粉點綴，打造香氣與口感兼具的韓風經典。 | meat | special | 是 | 肉類、辣味 |
| 30 | PGDH | [金鑽夏威夷](https://www.dominos.com.tw/menu-pizza/pizza-pgdh) | 特別選用台灣本土生產的台農17號金鑽鳳梨，與台灣豬製造的台畜高崎火腿完美融合，營造出絕妙平衡的酸甜風味。每一口都彷彿夏天的陽光和... | meat | classic | 否 | 肉類 |
| 31 | PLBS | [龍蝦舞沙拉](https://www.dominos.com.tw/menu-pizza/pizza-plbs) | 達美樂獨有經典龍蝦舞沙拉披薩，每一口都能感受到豐富的口感和美味。新鮮的洋蔥搭配上小龍蝦肉、花枝、魚卵和日式沙拉醬製作成的日式龍蝦... | seafood | special | 否 | 海鮮 |
| 32 | PSDX | [超級豪華](https://www.dominos.com.tw/menu-pizza/pizza-psdx) | 就是要給你一口咬下即有的大滿足感！超豪華配料包含新鮮洋蔥、青椒、契作杏鮑菇、台灣豬高崎火腿、香腸片、香腸丁，賦予每一口豐富多層次... | meat | classic | 否 | 肉類 |
| 33 | PSVG | [田園鮮蔬](https://www.dominos.com.tw/menu-pizza/pizza-psvg) | 精選台農17號金鑽鳳梨、契作杏鮑菇、紅椒、玉米、菠菜，以及台灣履歷產銷小蕃茄及巧達丁，將新鮮食材完美烘烤，呈現清爽無負擔的披薩口... | fresh | classic | 否 | 清爽 |
| 34 | PSMX | [超級墨西哥](https://www.dominos.com.tw/menu-pizza/pizza-psmx) | 邀您沈浸在濃郁獨特的墨西哥風味中，嚐嚐由洋蔥和墨西哥辣椒精心調配而成的異國饗宴。 *含豬肉成分 | meat | classic | 是 | 肉類、辣味 |
| 35 | QSSQ | [招牌海鮮四喜](https://www.dominos.com.tw/menu-pizza/pizza-qssq) | 由主廚特選推薦的海鮮四喜，喜愛海鮮和經典口味的你絕對別錯過！第一喜是最經典的瑪格麗特，使用台灣在地產銷履歷小蕃茄，清新爽口；第二... | seafood | special、cheese | 否 | 海鮮、起司／奶香、四喜 |
| 36 | QSGQ | [招牌四喜](https://www.dominos.com.tw/menu-pizza/pizza-qsgq) | 美味特賞的四喜組合，一次滿足四種渴望！第一喜為全新的台農17號金鑽夏威夷披薩，搭配台灣豬高崎火腿美味更升級；第二喜是大小孩都愛的... | meat | special | 否 | 肉類、四喜 |
| 37 | PCBQ | [BBQ雞肉](https://www.dominos.com.tw/menu-pizza/bbq-pcbq) | 加州風味BBQ雞肉披薩，是大人小孩都愛不釋手的美味之選。特調BBQ醬汁搭配國產雞腿肉片，並以洋蔥、玉米和契作杏鮑菇等新鮮蔬菜鋪滿... | fresh | classic | 否 | 清爽 |
| 38 | PKMP | [韓風泡菜豬肉](https://www.dominos.com.tw/menu-pizza/pizza-pkmp) | 嚴選台灣豬肉搭配泡菜，每一口都吃得到料實味美的台韓精髓，保證一試難忘！ *含豬肉成分 | meat | special | 是 | 肉類、辣味 |
| 39 | PSUS | [超級美國](https://www.dominos.com.tw/menu-pizza/pizza-psus) | 極致美味的道地美國披薩，經典再升級！這款純粹傳統的美國風味披薩，現在更加豐富，近2倍的美式臘腸片讓每一口都充滿濃郁肉香，再搭配上... | meat | special | 否 | 肉類 |
| 40 | PTSQ | [照燒花枝](https://www.dominos.com.tw/menu-pizza/pizza-ptsq) | 這款美味披薩以香氣濃郁的照燒醬汁為底，覆蓋上鮮嫩花枝、搭配爽脆的洋蔥和紅椒。最後，撒上開胃的海苔粉和輕柔美乃滋，呈現令人難以抗拒... | seafood | special | 否 | 海鮮 |
| 41 | PGDH9T | [薄脆金鑽夏威夷小披薩](https://www.dominos.com.tw/menu-pizza/pizza-pgdh9t) | 限時免費升級薄脆餅皮 | meat | special | 否 | 肉類 |
| 42 | PJCC | [和風奶油蟹肉披薩](https://www.dominos.com.tw/menu-pizza/pizza-pjcc) | 奶香不膩的日式風味！蟹肉 × 鴻禧菇的滑順口感，一吃就愛上 | seafood | special、cheese | 否 | 海鮮、起司／奶香 |
| 43 | PDLX | [在地食鮮總匯](https://www.dominos.com.tw/menu-pizza/pizza-pdlx) | 總匯披薩融合義式香腸丁、台灣豬肉製造的高崎火腿、美式臘腸片、契作杏鮑菇等在地新鮮食材。這是一道絕對經典的組合，每一種食材都是精挑... | meat | classic | 否 | 肉類 |
| 44 | PPMG | [番茄瑪格麗特](https://www.dominos.com.tw/menu-pizza/pizza-ppmg) | 瑪格麗特披薩，以經典披薩醬為底，搭配香濃的莫札瑞拉起司和新鮮台灣產銷履歷小蕃茄，搭配手工拍製餅皮，口口都能吃到清新而豐富的多層次... | fresh | classic、cheese | 否 | 清爽、起司／奶香 |
| 45 | PCCH | [香草奶油烤雞](https://www.dominos.com.tw/menu-pizza/pizza-pcch) | 以克里昂白醬為基底，蒜香濃郁、奶香滑順。搭配嫩口雞腿肉丁 與菠菜，出爐再撒上羅勒葉，溫潤不膩，是白醬披薩愛好者必點口味。 | meat | classic、cheese | 否 | 肉類、起司／奶香 |
| 46 | PCSS | [蟹肉鮮蝦沙拉](https://www.dominos.com.tw/menu-pizza/pizza-pcss) | 以 經典披薩醬打底，鋪上蟹肉絲與印度洋大白蝦。出爐後加上酸甜美乃滋與海苔粉提香，清爽開胃，海鮮風味層次分明。 | seafood | classic | 否 | 海鮮 |
| 47 | PUSA | [道地美國](https://www.dominos.com.tw/menu-pizza/pizza-pusa) | 極致美味的道地美國風味披薩，絕對美式的傳統味道，呈現濃郁起司與香腸片的完美結合。讓您彷彿置身於美國街頭小店，身歷其境經典美式風情... | meat | special、cheese | 否 | 肉類、起司／奶香 |
| 48 | PCSV | [白醬彩蔬](https://www.dominos.com.tw/menu-pizza/pizza-pcsv) | 絕佳素食饗宴！脆甜紅椒、香甜玉米、契作杏鮑菇，搭配濃郁白醬和手工拍製的柔彈披薩餅皮，一咬滿溢幸福感。濃郁白醬奶香和彩蔬清新對比，... | fresh | classic、cheese | 否 | 清爽、起司／奶香 |
| 49 | QACN | [經典四喜](https://www.dominos.com.tw/menu-pizza/pizza-qacn) | 經典之選四喜，一次就能擁有四種不同的美味享受。第一喜嚐嚐使用在地產銷履歷小蕃茄製作的清新風味瑪格麗特；第二喜則是結合在地食鮮台灣... | fresh | special、cheese | 否 | 清爽、起司／奶香、四喜 |
| 50 | PECC | [增量起司餅](https://www.dominos.com.tw/menu-pizza/pizza-pecc) | 純粹、增量的起司餅絕對是讓起司愛好者心馳神往的美味披薩。以豐富的起司為唯一配料，現點現做，精心手工拍打的餅皮，撒上滿滿濃郁起司，... | meat | classic、cheese | 否 | 肉類、起司／奶香 |
| 51 | PPMG9T | [薄脆小農番茄瑪格麗特小披薩](https://www.dominos.com.tw/menu-pizza/pizza-ppmg9t) | 免費升級薄脆餅皮 | fresh | special、cheese | 否 | 清爽、起司／奶香 |
| 52 | PKJT16I | [日韓半半披薩](https://www.dominos.com.tw/menu-pizza/pizza-pkjt16i) | 一次享受日韓雙重風味！一半是鹹甜日式章魚燒風味，搭配海苔與柴魚香氣；另一半則是韓式辣醬炸雞的微辣層次，雙拼呈現，豐富又滿足。 | seafood | special | 是 | 海鮮、辣味 |
| 53 | PKSC16I | [韓風炸雞披薩 (巨)](https://www.dominos.com.tw/menu-pizza/pizza-pksc16i) | 外酥內嫩的金黃炸雞，搭配韓式辣醬與滑順美乃滋交錯淋覆，鹹香中帶微辣層次，再以海苔粉點綴，打造香氣與口感兼具的韓風經典。 | meat | special | 是 | 肉類、辣味 |

## 驗證結果

- 官方產品卡：53 筆
- 對照表資料列：53 筆
- 品項名稱、代碼與官方順序均直接取自 JSON 的官方原始欄位。
- 生成欄位僅用於推薦，不會覆寫官方原始欄位。
