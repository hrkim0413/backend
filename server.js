// 기존 express 설정
const express = require('express'); // express 기본 라우팅
const app = express(); // express 기본 라우팅
const port = 9070; // 통신포트 설정
const bcrypt = require('bcrypt'); // 해시 암호화를 위함
const jwt = require('jsonwebtoken'); // 토큰 생성을 위함
const SECRET_KEY = 'test'; // JWT 서명 시 사용할 비밀 키

// 다른 시스템간 통신을 임시 허용(교차 출처 공유)
const cors = require('cors');
app.use(cors());

// mysql db정보 설정하기
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'kdt'
});

// mysql db정보 연결 실패/성공시
connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패', err);
    return;
  }
  console.log('MySQL 연결 성공!');
});

// npm run dev 백엔드 서버 실행시 콘솔모드에 내용 출력하기
app.listen(port, () => {
  console.log('Listening...');
});

// [goods]
// 1. 조회
// 방법1. app.get통신을 통해 테스트 해보기
// app.get('/', (req, res) => {
//   res.json('Excused from Backend!');
// });

//방법2. sql쿼리문을 작성하여 데이터를 조회한 값을 화면에 출력하기
// express서버를 통해 get요청하기 http://localhost:9070/데이블명 => mysql 테이블 자료 가져옴
app.get('/goods', (req, res) => {
  connection.query('SELECT * FROM goods', (err, results) => {
    if (err) {
      console.error('쿼리 오류 : ', err);
      res.status(500).json({ error: 'DB 쿼리 오류' });
      return;
    }
    res.json(results);
  });
});

// [fruits]
// 1. 조회
app.get('/fruits', (req, res) => {
  connection.query('SELECT * FROM fruits ORDER BY fruits.num DESC', (err, results) => {
    if (err) {
      console.error('쿼리 오류 : ', err);
      res.status(500).json({ error: 'DB 쿼리 오류' });
      return
    }

    // json 데이터로 결과를 저장
    res.json(results);
  })
})

// 2. 삭제
app.delete('/fruits/:num', (req, res) => {
  const num = req.params.num

  connection.query(
    'DELETE FROM fruits WHERE num= ?',
    [num],
    (err, result) => {
      if (err) {
        console.log('삭제 오류 : ', err);
        res.status(500).json({ error: '상품삭제 실패' });
        return;
      }

      res.json({ success: true });
    })
})

// 3. 입력
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/fruits', (req, res) => {
  const { name, price, color, country } = req.body; // 값을 넘겨받음

  if (!name || !price || !color || !country) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' })
  }

  // 이상이 없다면 쿼리문을 작성하여 db에 입력한다
  connection.query(
    'INSERT INTO fruits(name, price, color, country) VALUES (?, ?, ?, ?)',
    [name, price, color, country],
    (err, result) => {
      if (err) {
        console.log('등록 오류 : ', err);
        res.status(500).json({ error: '상품 등록 실패' });
        return;
      }

      res.json({ success: true, insertId: result.insertId });
    }
  )
})

// 4. 수정
// 4-1. 조회하기
app.get('/fruits/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM fruits WHERE num = ?',
    [num],
    (err, result) => {
      if (err) {
        console.log('조회 오류 : ', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (result.length == 0) {
        res.status(404).json({ error: '해당 상품이 존재하지 않습니다.' });
        return;
      }

      res.json(result[0]); // 단일 객체를 반환한다. (1개)
    }
  )
})

// 4-2. 수정하기
app.put('/fruits/fruitsupdate/:num', (req, res) => {
  const num = req.params.num;
  const { name, price, color, country } = req.body;

  // 필수 유효성 검사
  if (!name || !price || !color || !country) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' })
  }

  // 업데이트 쿼리문 실행
  connection.query(
    'UPDATE fruits SET name = ?, price = ?, color = ?, country = ? WHERE num = ?',
    [name, price, color, country, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' })
        return
      }

      res.json({ success: true });
    }
  )
})

// [book_store]
// 1. 조회
app.get('/bookstore', (req, res) => {
  connection.query('SELECT * FROM book_store ORDER BY code DESC', (err, results) => {
    if (err) {
      console.error('쿼리오류 : ', err);
      res.status(500).json({ error: 'DB쿼리 오류' });
      return;
    }
    res.json(results); //오류가 없으면 json객체로 반환
  });
});

// 2. 삭제
app.delete('/bookstore/:code', (req, res) => {
  const code = req.params.code;
  connection.query(
    'DELETE FROM book_store WHERE code = ?',
    [code],
    (err, result) => {
      if (err) {
        console.log('삭제 오류 : ', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true })
    }
  );
});

// 3. 등록
app.post('/bookstore', (req, res) => {
  const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;

  // 유효성 검사
  if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' })
  }

  // 쿼리문 작성
  connection.query(
    'INSERT INTO book_store(name, area1, area2, area3, book_cnt, owner_nm, tel_num) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num],
    (err, result) => {
      if (err) {
        console.log('등록 오류 : ', err);
        res.status(500).json({ error: '상품 등록 실패' });
        return;
      }

      res.json({ success: true, insertId: result.insertId });
    }
  )
})

// 4. 수정
// 4-1. 조회
app.get('/bookstore/:code', (req, res) => {
  const code = req.params.code;

  connection.query(
    'SELECT * FROM book_store WHERE code = ?',
    [code],
    (err, result) => {
      if (err) {
        console.log('조회 오류 : ', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      // 해당 상품이 없는 경우
      if (result.length == 0) {
        res.status(404).json({ error: '해당 상품이 존재하지 않습니다.' });
        return;
      }

      res.json(result[0]);
    }
  )
})

// 4-2. 수정
app.put('/bookstore/bookstoreupdate/:code', (req, res) => {
  const code = req.params.code;
  const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;

  // 유효성 검사
  if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' })
  }

  connection.query(
    'UPDATE book_store SET name = ?, area1 = ?, area2 = ?, area3 = ?, book_cnt = ?, owner_nm = ?, tel_num = ? WHERE code = ?',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num, code],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' });
        return;
      }

      res.json({ success: true });
    }
  )
})

// [noodle]
// 1. 조회
app.get('/noodle', (req, res) => {
  connection.query(
    'SELECT * FROM noodle ORDER BY num DESC',
    (err, result) => {
      if (err) {
        console.error('조회 오류 : ', err);
        res.status(500).json({ error: 'DB 조회 오류' });
        return;
      }

      res.json(result);
    }
  )
})

// 2. 삭제
app.delete('/noodle/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'DELETE FROM noodle WHERE num = ?',
    [num],
    (err, result) => {
      if (err) {
        console.error('삭제 오류', err);
        res.status(500).json({ error: 'DB 삭제 오류' });
        return
      }

      res.json({ success: true });
    }
  )
})

// 3. 등록
app.post('/noodle', (req, res) => {
  const { name, company, kind, price, e_date } = req.body;

  connection.query(
    'INSERT INTO noodle(name, company, kind, price, e_date) VALUES(?, ?, ?, ?, ?)',
    [name, company, kind, price, e_date],
    (err, result) => {
      if (err) {
        console.log('등록 오류 : ', err);
        res.status(500).json({ error: 'DB 등록 오류' });
        return;
      }

      res.json({ success: true, insertId: result.insertId });
    }
  )
})

// 4. 수정
// 4-1. 조회
app.get('/noodle/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM noodle WHERE num = ?',
    [num],
    (err, result) => {
      if (err) {
        console.log('수정_조회 오류', err)
        res.status(500).json({ error: 'DB 수정_조회 오류' })
        return;
      }

      // 해당 상품이 없는 경우
      if (result.length === 0) {
        res.status(404).json({ error: '해당 상품이 존재하지 않습니다.' })
        return;
      }

      res.json(result[0]);
    }
  )
})

// 4-2. 수정
app.put('/noodle/noodleupdate/:num', (req, res) => {
  const num = req.params.num;
  const { name, company, kind, price, e_date } = req.body;

  connection.query(
    'UPDATE noodle SET name = ?, company = ?, kind = ?, price = ?, e_date = ? WHERE num = ?',
    [name, company, kind, price, e_date, num],
    (err, result) => {
      if (err) {
        console.log('수정_수정 오류', err);
        res.status(500).json({ error: 'DB 수정_수정 오류' });
        return;
      }

      res.json({ success: true });
    }
  )
})

// [question]
// 1. 입력
app.post('/api/question', (req, res) => {
  const { name, phone, email, content } = req.body;

  connection.query(
    'INSERT INTO question(name, phone, email, content) VALUES(?, ?, ?, ?)',
    [name, phone, email, content],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'question 입력 오류' });
        return;
      }

      res.json({ success: true, insertId: result.insertId });
    }
  )
})

// 2. 출력
app.get('/question', (req, res) => {
  connection.query(
    'SELECT * FROM question ORDER BY id DESC',
    (err, result) => {
      if (err) {
        console.log('쿼리 오류', err);
        res.json({ error: 'DB 쿼리 오류' });
        return;
      }

      res.json(result);
    }
  )
})

// [join] - 회원가입
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  connection.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hash],
    (err) => {
      if (err) {
        if (err.code == 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: '이미 존재하는 아이디입니다.' })
        }
        return res.status(500).json({ error: '회원가입 실패' });
      }

      res.json({ success: true });
    }
  )
})

// [login] - 로그인 조회
// (여태까지 get으로만 조회를 배웠지만 사실 post도 조회 가능함)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  connection.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' })
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password); // DB에 있는 암호화된 패스워드와 사용자가 입력한 패스워드를 비교

      if (!isMatch) {
        return res.status(401).json({ error: '비밀번호가 틀렸습니다.' })
      }

      // id, pw가 맞으면 토큰을 생성(1시간)
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

      // 토큰 발급
      res.json({ token });
    }
  )
})

// [login] - 전체 회원가입수 조회
app.get('/usercount', (req, res) => {
  connection.query(
    'SELECT * FROM users',
    (err, result) => {
      if (err) {
        console.log('쿼리 오류', err);
        res.json({ error: 'DB 쿼리 오류' });
        return;
      }

      res.json(result);
    }
  )
})

// [ginipet]
// 1. 회원가입 => 아이디 중복 확인
app.post('/check-username', (req, res) => {
  const { username } = req.body;

  const sql = 'SELECT * FROM ginipet_users WHERE username = ?';

  connection.query(sql, [username], (err, result) => {
    if (err) return res.status(500).send(err);

    res.json({ exists: result.length > 0 });
  });
});


// 2. 회원가입 => 입력
app.post('/ginipet-register', async (req, res) => {
  const { username, password, email, tel } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO ginipet_users(username, password, email, tel) VALUE(?, ?, ?, ?)`;

    connection.query(sql, [username, hash, email, tel], err => {
      if (err) return res.status(500).send(err);

      res.json({ message: '회원가입 성공' });
    }
    )
  } catch (err) {
    res.status(500).send(err);
  }
})

// 3. 로그인 => 조회
app.post('/ginipet-login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM ginipet_users WHERE username = ?'

  connection.query(sql, [username], async (err, result) => {
    if (err || result.length == 0) {
      return res.status(401).json({ message: '존재하지 않는 아이디입니다.' })
    }

    // 비밀번호 검사
    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다. 확인 부탁드립니다.' })
    }

    // 토큰 생성
    const token = jwt.sign({ id: user.id, name: user.username }, SECRET_KEY, { expiresIn: '1h' });
    // 토큰 발급
    res.json({ token });
  })
})