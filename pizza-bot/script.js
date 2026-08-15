let pizzas = [];

const form = document.querySelector('#picker-form');
const results = document.querySelector('#results');
const grid = document.querySelector('#result-grid');
const servingTip = document.querySelector('#serving-tip');
const recommendButton = form.querySelector('.recommend');
const randomButton = document.querySelector('#random-button');

function setLoading(loading, message = '') {
  recommendButton.disabled = loading;
  randomButton.disabled = loading;
  if (message) recommendButton.firstChild.textContent = message;
}

async function loadPizzaData() {
  try {
    const response = await fetch('pizza-data.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    pizzas = data.products
      .filter((product) => product.name !== '買大送大')
      .map((product) => ({
        ...product,
        flavor: product.recommendation.flavor,
        moods: product.recommendation.moods,
        spicy: product.recommendation.spicy,
        tags: product.recommendation.tags,
        desc: product.official_description || `${product.name}，詳細內容請查看官方產品頁。`
      }));
    setLoading(false, '幫我選披薩 ');
  } catch (error) {
    setLoading(true, '資料載入失敗 ');
    console.error('無法載入 pizza-data.json：', error);
  }
}

function uniqueByName(items) {
  const names = new Set();
  return items.filter((item) => {
    if (names.has(item.name)) return false;
    names.add(item.name);
    return true;
  });
}

function pick(formData, random = false) {
  if (!pizzas.length) return;
  const flavor = formData.get('flavor');
  const spicy = formData.get('spicy');
  const mood = formData.get('mood');
  let candidates = pizzas;
  if (!random && mood === 'cheese') {
    candidates = pizzas.filter((pizza) => pizza.moods.includes('cheese'));
  }
  const ranked = uniqueByName(candidates.map((pizza) => {
    let score = Math.random() * (random ? 10 : 1);
    if (!random && (flavor === 'surprise' || pizza.flavor === flavor)) score += 5;
    if (!random && pizza.moods.includes(mood)) score += mood === 'cheese' ? 7 : 3;
    if (!random && spicy === 'yes' && pizza.spicy) score += 2;
    if (!random && spicy === 'no' && pizza.spicy) score -= 8;
    return { ...pizza, score };
  }).sort((a, b) => b.score - a.score)).slice(0, 3);
  render(ranked, formData.get('people'), { flavor, spicy, mood, random });
}

function recommendationReason(pizza, choices) {
  if (choices.random) return '命運選中了它，今天就勇敢試試這一款。';
  const reasons = [];
  const flavorNames = { meat: '肉肉派', seafood: '海鮮派', fresh: '清爽派' };
  if (choices.flavor !== 'surprise' && pizza.flavor === choices.flavor) reasons.push(`符合你選的「${flavorNames[choices.flavor]}」`);
  if (choices.mood === 'cheese' && pizza.moods.includes('cheese')) reasons.push('有明顯的奶香或起司特色');
  if (choices.mood === 'special' && pizza.moods.includes('special')) reasons.push('口味較有特色');
  if (choices.mood === 'classic' && pizza.moods.includes('classic')) reasons.push('是接受度高的經典選擇');
  if (choices.spicy === 'yes' && pizza.spicy) reasons.push('也能滿足你想來點辣的偏好');
  if (choices.spicy === 'no' && !pizza.spicy) reasons.push('而且不是辣味品項');
  return reasons.length ? `推薦原因：${reasons.join('，')}。` : '推薦原因：它是最接近你目前條件的候選。';
}

function render(items, people, choices) {
  const tips = { solo: '1 人建議先查看小披薩或個人優惠，份量與價格以官方頁面為準。', pair: '2–3 人可從 1 個大披薩搭配副食開始考慮。', party: '4 人以上建議選不同口味，並依食量搭配多個披薩與副食。' };
  servingTip.textContent = tips[people];
  grid.innerHTML = items.map((pizza, index) => `
    <article class="result-card">
      <span class="rank">${index + 1}</span>
      <h3>${pizza.name}</h3>
      <p>${pizza.desc}</p>
      <p class="reason">${recommendationReason(pizza, choices)}</p>
      <div class="tags">${pizza.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
      <a class="product-link" href="${pizza.official_order_url}" target="_blank" rel="noreferrer">查看官方訂購頁 ↗</a>
    </article>`).join('');
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', (event) => { event.preventDefault(); pick(new FormData(form)); });
randomButton.addEventListener('click', () => pick(new FormData(form), true));
document.querySelector('#again-button').addEventListener('click', () => { results.hidden = true; form.scrollIntoView({ behavior: 'smooth' }); });

setLoading(true, '載入菜單中 ');
loadPizzaData();
