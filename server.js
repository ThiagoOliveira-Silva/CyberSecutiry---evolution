const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const history = [];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const operations = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => {
    if (b === 0) {
      throw new Error('Não é possível dividir por zero.');
    }
    return a / b;
  }
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': mimeTypes['.json'] });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const safePath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: 'Acesso negado.' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'Arquivo não encontrado.' });
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
    res.end(data);
  });
}

function handleCalculate(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { a, b, operator } = JSON.parse(body || '{}');
      const n1 = Number(a);
      const n2 = Number(b);

      if (!Number.isFinite(n1) || !Number.isFinite(n2)) {
        sendJson(res, 400, { error: 'Os valores informados precisam ser numéricos.' });
        return;
      }

      if (!Object.hasOwn(operations, operator)) {
        sendJson(res, 400, { error: 'Operação inválida.' });
        return;
      }

      const result = operations[operator](n1, n2);
      const calculation = {
        id: Date.now(),
        expression: `${n1} ${operator} ${n2}`,
        result,
        createdAt: new Date().toISOString()
      };

      history.unshift(calculation);
      history.splice(10);

      sendJson(res, 200, calculation);
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Erro ao processar requisição.' });
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/history') {
    sendJson(res, 200, history);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/calculate') {
    handleCalculate(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Método não permitido.' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
