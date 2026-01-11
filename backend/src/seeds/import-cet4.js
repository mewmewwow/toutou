#!/usr/bin/env node
/**
 * CET4 词汇导入脚本 (JavaScript 版本)
 * 直接在宿主机运行，连接到 localhost:5432
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 数据库配置
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cishanjia_dev',
  user: 'postgres',
  password: 'postgres',
});

// 每批处理的单词数量
const BATCH_SIZE = 100;
// 每个单元的单词数量
const WORDS_PER_UNIT = 50;

/**
 * 获取或创建词书
 */
async function getOrCreateBook(bookCode) {
  const client = await pool.connect();
  try {
    const existingBook = await client.query(
      'SELECT id FROM books WHERE code = $1',
      [bookCode]
    );
    
    if (existingBook.rows.length > 0) {
      console.log(`词书 ${bookCode} 已存在，ID: ${existingBook.rows[0].id}`);
      return existingBook.rows[0].id;
    }
    
    const result = await client.query(
      `INSERT INTO books (name, code, description, cover_image, total_words, total_units, is_free, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      [
        '大学英语四级核心词汇',
        bookCode,
        'CET4 核心词汇，包含丰富的例句和释义',
        '/images/books/cet4.png',
        0,
        0,
        true,
      ]
    );
    
    console.log(`创建新词书 ${bookCode}，ID: ${result.rows[0].id}`);
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

/**
 * 清理现有数据
 */
async function clearExistingData(bookId) {
  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM sentences WHERE word_id IN (SELECT id FROM words WHERE book_id = $1)`,
      [bookId]
    );
    await client.query('DELETE FROM words WHERE book_id = $1', [bookId]);
    console.log(`已清理词书 ${bookId} 的现有数据`);
  } finally {
    client.release();
  }
}

/**
 * 批量插入单词
 */
async function insertWordsBatch(bookId, words, startRank) {
  const client = await pool.connect();
  const wordIdMap = new Map();
  
  try {
    await client.query('BEGIN');
    
    for (const word of words) {
      const unitNumber = Math.ceil(word.wordRank / WORDS_PER_UNIT);
      const sortOrder = word.wordRank;
      
      const content = word.content?.word?.content || {};
      const phoneticUs = content.usphone || null;
      const phoneticUk = content.ukphone || null;
      const audioUs = content.usspeech || null;
      const audioUk = content.ukspeech || null;
      
      // 处理释义
      const definitions = (content.trans || []).map((t) => ({
        pos: t.pos || '',
        meaning: t.tranCn || t.descCn || '',
      }));
      
      if (definitions.length === 0) {
        definitions.push({ pos: '', meaning: '' });
      }
      
      const result = await client.query(
        `INSERT INTO words (book_id, unit_number, word, phonetic_us, phonetic_uk, audio_us, audio_uk, definitions, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id`,
        [
          bookId,
          unitNumber,
          word.headWord,
          phoneticUs,
          phoneticUk,
          audioUs,
          audioUk,
          JSON.stringify(definitions),
          sortOrder,
        ]
      );
      
      wordIdMap.set(word.wordRank, result.rows[0].id);
    }
    
    await client.query('COMMIT');
    console.log(`已插入 ${words.length} 个单词 (rank ${startRank} - ${startRank + words.length - 1})`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  
  return wordIdMap;
}

/**
 * 批量插入例句
 */
async function insertSentencesBatch(words, wordIdMap) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const word of words) {
      const wordId = wordIdMap.get(word.wordRank);
      if (!wordId) continue;
      
      const content = word.content?.word?.content || {};
      const sentences = content.sentence?.sentences || [];
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        await client.query(
          `INSERT INTO sentences (word_id, content_en, content_cn, is_primary, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            wordId,
            sentence.sContent || '',
            sentence.sCn || '',
            i === 0,
            i,
          ]
        );
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 更新词书统计信息
 */
async function updateBookStats(bookId) {
  const client = await pool.connect();
  try {
    const countResult = await client.query(
      'SELECT COUNT(*) as total, MAX(unit_number) as max_unit FROM words WHERE book_id = $1',
      [bookId]
    );
    
    const totalWords = parseInt(countResult.rows[0].total);
    const totalUnits = parseInt(countResult.rows[0].max_unit) || 0;
    
    await client.query(
      'UPDATE books SET total_words = $1, total_units = $2, updated_at = NOW() WHERE id = $3',
      [totalWords, totalUnits, bookId]
    );
    
    console.log(`词书统计已更新：${totalWords} 个单词，${totalUnits} 个单元`);
  } finally {
    client.release();
  }
}

/**
 * 解析 JSON 文件
 */
function parseJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const words = [];
  
  // 按行解析（NDJSON 格式）
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      try {
        words.push(JSON.parse(trimmed));
      } catch {
        // 跳过无法解析的行
      }
    }
  }
  
  return words;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== CET4 词汇导入脚本 ===\n');
  
  const jsonFiles = [
    path.join(__dirname, '../../CET4luan_1.json'),
    path.join(__dirname, '../../CET4luan_2.json'),
  ];
  
  const filesToProcess = jsonFiles.filter(f => fs.existsSync(f));
  
  if (filesToProcess.length === 0) {
    console.error('未找到 JSON 文件！');
    process.exit(1);
  }
  
  console.log(`找到 ${filesToProcess.length} 个文件：`);
  filesToProcess.forEach(f => console.log(`  - ${f}`));
  console.log();
  
  try {
    const bookId = await getOrCreateBook('CET4');
    await clearExistingData(bookId);
    
    let totalWords = 0;
    
    for (const file of filesToProcess) {
      console.log(`\n处理文件: ${file}`);
      const words = parseJsonFile(file);
      console.log(`解析出 ${words.length} 个单词`);
      
      for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE);
        const startRank = batch[0]?.wordRank || i;
        
        const wordIdMap = await insertWordsBatch(bookId, batch, startRank);
        await insertSentencesBatch(batch, wordIdMap);
        
        totalWords += batch.length;
      }
    }
    
    await updateBookStats(bookId);
    
    console.log(`\n=== 导入完成 ===`);
    console.log(`总计导入 ${totalWords} 个单词`);
    
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
