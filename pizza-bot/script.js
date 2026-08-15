const pizzas = [
  { name: '超級豪華', flavor: 'meat', moods: ['classic'], spicy: false, desc: '經典豐富配料，適合第一次選或大家口味不同的聚餐。', tags: ['經典', '豐富配料'] },
  { name: '肉魔王四喜', flavor: 'meat', moods: ['special'], spicy: false, desc: '肉食系聚會的強力候選，一次享受多種肉類風味。', tags: ['肉食系', '四喜'] },
  { name: 'BBQ雞肉', flavor: 'meat', moods: ['classic'], spicy: false, desc: 'BBQ 香氣明確、接受度高，是不想冒險時的安全牌。', tags: ['雞肉', 'BBQ'] },
  { name: '韓風炸雞披薩', flavor: 'meat', moods: ['special'], spicy: true, desc: '韓式辣醬、炸雞與美乃滋交織，適合今天想吃重口味。', tags: ['新潮', '微辣', '炸雞'] },
  { name: '韓風泡菜豬肉', flavor: 'meat', moods: ['special'], spicy: true, desc: '泡菜的酸辣搭配豬肉，風味鮮明、不容易無聊。', tags: ['泡菜', '辣', '豬肉'] },
  { name: '極致蒜香壽喜牛', flavor: 'meat', moods: ['special', 'cheese'], spicy: false, desc: '蒜香與壽喜燒牛肉的濃郁組合，適合想吃豪華一點。', tags: ['牛肉', '蒜香', '濃郁'] },
  { name: '金鑽夏威夷', flavor: 'fresh', moods: ['classic'], spicy: false, desc: '鳳梨的酸甜帶來清爽感，是長青的甜鹹組合。', tags: ['鳳梨', '甜鹹', '經典'] },
  { name: '番茄瑪格麗特', flavor: 'fresh', moods: ['classic'], spicy: false, desc: '番茄與起司主導的簡單滋味，清爽又耐吃。', tags: ['番茄', '清爽', '起司'] },
  { name: '田園鮮蔬', flavor: 'fresh', moods: ['classic'], spicy: false, desc: '以蔬菜風味為主，適合想讓這餐輕盈一點的時候。', tags: ['蔬菜', '清爽'] },
  { name: '白醬彩蔬', flavor: 'fresh', moods: ['cheese'], spicy: false, desc: '柔和白醬搭配彩蔬，兼顧奶香與清爽口感。', tags: ['白醬', '蔬菜', '奶香'] },
  { name: '極致干貝海鮮', flavor: 'seafood', moods: ['special'], spicy: false, desc: '干貝與海鮮的升級選擇，適合想吃得有儀式感。', tags: ['干貝', '海鮮', '豪華'] },
  { name: '招牌海鮮四喜', flavor: 'seafood', moods: ['classic'], spicy: false, desc: '一次集合多種海鮮風味，聚餐時比較容易照顧不同喜好。', tags: ['海鮮', '四喜'] },
  { name: '日式奶油鮭魚披薩', flavor: 'seafood', moods: ['special', 'cheese'], spicy: false, desc: '奶油與鮭魚的日式風味，濃郁但有海鮮的鮮味。', tags: ['鮭魚', '奶油', '日式'] },
  { name: '照燒花枝', flavor: 'seafood', moods: ['special'], spicy: false, desc: '照燒甜鹹配上花枝口感，適合喜歡日式風味的人。', tags: ['花枝', '照燒', '日式'] },
  { name: '海陸金沙起司火山', flavor: 'surprise', moods: ['cheese', 'special'], spicy: false, desc: '海陸配料、金沙與起司火山，是想要澎湃感時的選擇。', tags: ['海陸', '金沙', '起司'] }
];

const form = document.querySelector('#picker-form');
const results = document.querySelector('#results');
const grid = document.querySelector('#result-grid');
const servingTip = document.querySelector('#serving-tip');

function pick(formData, random = false) {
  const flavor = formData.get('flavor');
  const spicy = formData.get('spicy');
  const mood = formData.get('mood');
  const ranked = pizzas.map((pizza) => {
    let score = Math.random() * (random ? 10 : 1);
    if (!random && (flavor === 'surprise' || pizza.flavor === flavor)) score += 5;
    if (!random && pizza.moods.includes(mood)) score += 3;
    if (!random && spicy === 'yes' && pizza.spicy) score += 2;
    if (!random && spicy === 'no' && pizza.spicy) score -= 8;
    return { ...pizza, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  render(ranked, formData.get('people'));
}

function render(items, people) {
  const tips = { solo: '1 人建議先查看小披薩或個人優惠，份量與價格以官方頁面為準。', pair: '2–3 人可從 1 個大披薩搭配副食開始考慮。', party: '4 人以上建議選不同口味，並依食量搭配多個披薩與副食。' };
  servingTip.textContent = tips[people];
  grid.innerHTML = items.map((pizza, index) => `
    <article class="result-card">
      <span class="rank">${index + 1}</span>
      <h3>${pizza.name}</h3>
      <p>${pizza.desc}</p>
      <div class="tags">${pizza.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
    </article>`).join('');
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', (event) => { event.preventDefault(); pick(new FormData(form)); });
document.querySelector('#random-button').addEventListener('click', () => pick(new FormData(form), true));
document.querySelector('#again-button').addEventListener('click', () => { results.hidden = true; form.scrollIntoView({ behavior: 'smooth' }); });
