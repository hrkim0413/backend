// =====================
// 기본 설정
// =====================
const express = require('express');
const app = express();
const port = 9070;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test';

const cors = require('cors');
app.use(cors());

// body 파서 (🔥 반드시 위에)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// MySQL 설정
// =====================
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'database',
  user: 'root',
  password: '1234',
  database: 'kdt'
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  console.log('✅ MySQL 연결 성공!');
});

// =====================
// 서버 실행
// =====================
app.listen(port, () => {
  console.log(`🚀 서버 실행중 : ${port}`);
});

// =====================
// GOODS
// =====================
app.get('/goods', (req, res) => {
  connection.query('SELECT * FROM goods', (err, result) => {
    if (err) return res.status(500).json({ error: 'DB 오류' });
    res.json(result);
  });
});

// =====================
// FRUITS
// =====================
app.get('/fruits', (req, res) => {
  connection.query('SELECT * FROM fruits ORDER BY num DESC', (err, result) => {
    if (err) return res.status(500).json({ error: '조회 오류' });
    res.json(result);
  });
});

app.post('/fruits', (req, res) => {
  const { name, price, color, country } = req.body;
  connection.query(
    'INSERT INTO fruits VALUES (null, ?, ?, ?, ?)',
    [name, price, color, country],
    (err, result) => {
      if (err) return res.status(500).json({ error: '등록 실패' });
      res.json({ success: true });
    }
  );
});

app.delete('/fruits/:num', (req, res) => {
  connection.query(
    'DELETE FROM fruits WHERE num = ?',
    [req.params.num],
    err => {
      if (err) return res.status(500).json({ error: '삭제 실패' });
      res.json({ success: true });
    }
  );
});

// =====================
// QUESTION
// =====================
app.post('/api/question', (req, res) => {
  const { name, phone, email, content } = req.body;
  connection.query(
    'INSERT INTO question(name, phone, email, content) VALUES (?, ?, ?, ?)',
    [name, phone, email, content],
    err => {
      if (err) return res.status(500).json({ error: '문의 등록 실패' });
      res.json({ success: true });
    }
  );
});

app.get('/question', (req, res) => {
  connection.query(
    'SELECT * FROM question ORDER BY id DESC',
    (err, result) => {
      if (err) return res.status(500).json({ error: '조회 실패' });
      res.json(result);
    }
  );
});

// =====================
// GINIPET - 회원가입 / 로그인
// =====================

// 아이디 중복 확인
app.post('/check-username', (req, res) => {
  const { username } = req.body;
  connection.query(
    'SELECT * FROM ginipet_users WHERE username = ?',
    [username],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ exists: result.length > 0 });
    }
  );
});

// 회원가입
app.post('/ginipet-register', async (req, res) => {
  const { username, password, email, tel } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    connection.query(
      'INSERT INTO ginipet_users(username, password, email, tel) VALUES (?, ?, ?, ?)',
      [username, hash, email, tel],
      err => {
        if (err) return res.status(500).json({ error: '회원가입 실패' });
        res.json({ message: '회원가입 성공' });
      }
    );
  } catch (err) {
    res.status(500).send(err);
  }
});

// 로그인
app.post('/ginipet-login', (req, res) => {
  const { username, password } = req.body;

  connection.query(
    'SELECT * FROM ginipet_users WHERE username = ?',
    [username],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ message: '아이디 없음' });
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: '비밀번호 틀림' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.json({ token });
    }
  );
});
