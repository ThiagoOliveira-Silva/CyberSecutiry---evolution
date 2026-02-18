const form = document.getElementById('calculator-form');
const resultEl = document.getElementById('result');
const historyEl = document.getElementById('history');
const feedbackEl = document.getElementById('feedback');

async function loadHistory() {
  const response = await fetch('/api/history');
  const history = await response.json();

  historyEl.innerHTML = '';

  if (!history.length) {
    const li = document.createElement('li');
    li.textContent = 'Nenhuma operação realizada ainda.';
    historyEl.append(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.expression} = ${item.result}`;
    historyEl.append(li);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedbackEl.textContent = 'Processando cálculo...';

  const formData = new FormData(form);
  const payload = {
    a: formData.get('a'),
    b: formData.get('b'),
    operator: formData.get('operator')
  };

  try {
    const response = await fetch('/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao calcular.');
    }

    resultEl.textContent = data.result;
    feedbackEl.textContent = `Cálculo concluído: ${data.expression}`;
    await loadHistory();
  } catch (error) {
    feedbackEl.textContent = error.message;
  }
});

loadHistory().catch(() => {
  feedbackEl.textContent = 'Não foi possível carregar o histórico.';
});
