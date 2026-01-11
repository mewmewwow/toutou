import { DataSource } from 'typeorm';
import { Book } from '../modules/books/entities/book.entity';
import { Word } from '../modules/books/entities/word.entity';
import { Sentence } from '../modules/books/entities/sentence.entity';

interface WordDefinition {
  pos: string;
  meaning: string;
}

interface SeedWord {
  word: string;
  phoneticUs: string;
  phoneticUk: string;
  definitions: WordDefinition[];
  sentences: Array<{
    contentEn: string;
    contentCn: string;
    isPrimary?: boolean;
  }>;
}

interface SeedUnit {
  unitNumber: number;
  words: SeedWord[];
}

interface SeedBook {
  name: string;
  code: string;
  description: string;
  isFree: boolean;
  coverImage?: string;
  sortOrder: number;
  units: SeedUnit[];
}

// CET-4 Sample vocabulary (Unit 1 for guest trial)
const cet4Book: SeedBook = {
  name: '大学英语四级词汇',
  code: 'CET4',
  description: '大学英语四级考试核心词汇，共约4500词',
  isFree: false,
  sortOrder: 1,
  units: [
    {
      unitNumber: 1,
      words: [
        {
          word: 'abandon',
          phoneticUs: '/əˈbændən/',
          phoneticUk: '/əˈbændən/',
          definitions: [
            { pos: 'v.', meaning: '放弃；抛弃；遗弃' },
            { pos: 'n.', meaning: '放任；狂热' },
          ],
          sentences: [
            {
              contentEn: 'He abandoned his wife and children.',
              contentCn: '他抛弃了妻子和孩子。',
              isPrimary: true,
            },
            {
              contentEn: 'The crew abandoned ship.',
              contentCn: '船员们弃船了。',
            },
          ],
        },
        {
          word: 'ability',
          phoneticUs: '/əˈbɪləti/',
          phoneticUk: '/əˈbɪlɪti/',
          definitions: [
            { pos: 'n.', meaning: '能力；才能；本领' },
          ],
          sentences: [
            {
              contentEn: 'She has the ability to solve complex problems.',
              contentCn: '她有解决复杂问题的能力。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abnormal',
          phoneticUs: '/æbˈnɔːrml/',
          phoneticUk: '/æbˈnɔːml/',
          definitions: [
            { pos: 'adj.', meaning: '不正常的；异常的' },
          ],
          sentences: [
            {
              contentEn: 'The test results were abnormal.',
              contentCn: '测试结果异常。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'aboard',
          phoneticUs: '/əˈbɔːrd/',
          phoneticUk: '/əˈbɔːd/',
          definitions: [
            { pos: 'adv.', meaning: '在船上；在飞机上' },
            { pos: 'prep.', meaning: '上船；上飞机' },
          ],
          sentences: [
            {
              contentEn: 'Welcome aboard the flight.',
              contentCn: '欢迎登机。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abolish',
          phoneticUs: '/əˈbɑːlɪʃ/',
          phoneticUk: '/əˈbɒlɪʃ/',
          definitions: [
            { pos: 'v.', meaning: '废除；废止；取消' },
          ],
          sentences: [
            {
              contentEn: 'The law was abolished in 1998.',
              contentCn: '该法律于1998年被废除。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abortion',
          phoneticUs: '/əˈbɔːrʃn/',
          phoneticUk: '/əˈbɔːʃn/',
          definitions: [
            { pos: 'n.', meaning: '流产；堕胎；中止' },
          ],
          sentences: [
            {
              contentEn: 'The project was an abortion.',
              contentCn: '该项目以失败告终。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abound',
          phoneticUs: '/əˈbaʊnd/',
          phoneticUk: '/əˈbaʊnd/',
          definitions: [
            { pos: 'v.', meaning: '大量存在；充满' },
          ],
          sentences: [
            {
              contentEn: 'Fish abound in the lake.',
              contentCn: '湖里鱼很多。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abroad',
          phoneticUs: '/əˈbrɔːd/',
          phoneticUk: '/əˈbrɔːd/',
          definitions: [
            { pos: 'adv.', meaning: '在国外；到国外' },
          ],
          sentences: [
            {
              contentEn: 'She went abroad to study.',
              contentCn: '她出国留学了。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abrupt',
          phoneticUs: '/əˈbrʌpt/',
          phoneticUk: '/əˈbrʌpt/',
          definitions: [
            { pos: 'adj.', meaning: '突然的；意外的；粗鲁的' },
          ],
          sentences: [
            {
              contentEn: 'His abrupt manner offended people.',
              contentCn: '他粗鲁的态度冒犯了人们。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'absence',
          phoneticUs: '/ˈæbsəns/',
          phoneticUk: '/ˈæbsəns/',
          definitions: [
            { pos: 'n.', meaning: '缺席；不在；缺乏' },
          ],
          sentences: [
            {
              contentEn: 'His absence was noticed by everyone.',
              contentCn: '每个人都注意到他不在场。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'absent',
          phoneticUs: '/ˈæbsənt/',
          phoneticUk: '/ˈæbsənt/',
          definitions: [
            { pos: 'adj.', meaning: '缺席的；不在的' },
            { pos: 'v.', meaning: '缺席；不参加' },
          ],
          sentences: [
            {
              contentEn: 'He was absent from the meeting.',
              contentCn: '他没有出席会议。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'absolute',
          phoneticUs: '/ˈæbsəluːt/',
          phoneticUk: '/ˈæbsəluːt/',
          definitions: [
            { pos: 'adj.', meaning: '绝对的；完全的' },
          ],
          sentences: [
            {
              contentEn: 'I have absolute confidence in you.',
              contentCn: '我对你有绝对的信心。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'absorb',
          phoneticUs: '/əbˈzɔːrb/',
          phoneticUk: '/əbˈzɔːb/',
          definitions: [
            { pos: 'v.', meaning: '吸收；吸引；使全神贯注' },
          ],
          sentences: [
            {
              contentEn: 'Plants absorb carbon dioxide.',
              contentCn: '植物吸收二氧化碳。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abstract',
          phoneticUs: '/ˈæbstrækt/',
          phoneticUk: '/ˈæbstrækt/',
          definitions: [
            { pos: 'adj.', meaning: '抽象的' },
            { pos: 'n.', meaning: '摘要；抽象概念' },
          ],
          sentences: [
            {
              contentEn: 'The concept is too abstract.',
              contentCn: '这个概念太抽象了。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abundant',
          phoneticUs: '/əˈbʌndənt/',
          phoneticUk: '/əˈbʌndənt/',
          definitions: [
            { pos: 'adj.', meaning: '丰富的；充裕的' },
          ],
          sentences: [
            {
              contentEn: 'The country has abundant natural resources.',
              contentCn: '这个国家自然资源丰富。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'abuse',
          phoneticUs: '/əˈbjuːs/',
          phoneticUk: '/əˈbjuːs/',
          definitions: [
            { pos: 'n.', meaning: '滥用；虐待；辱骂' },
            { pos: 'v.', meaning: '滥用；虐待；辱骂' },
          ],
          sentences: [
            {
              contentEn: 'Drug abuse is a serious problem.',
              contentCn: '滥用药物是一个严重的问题。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'academic',
          phoneticUs: '/ˌækəˈdemɪk/',
          phoneticUk: '/ˌækəˈdemɪk/',
          definitions: [
            { pos: 'adj.', meaning: '学术的；学院的' },
            { pos: 'n.', meaning: '大学教师；学者' },
          ],
          sentences: [
            {
              contentEn: 'His academic performance is excellent.',
              contentCn: '他的学业成绩优秀。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accelerate',
          phoneticUs: '/əkˈseləreɪt/',
          phoneticUk: '/əkˈseləreɪt/',
          definitions: [
            { pos: 'v.', meaning: '加速；促进' },
          ],
          sentences: [
            {
              contentEn: 'The car began to accelerate.',
              contentCn: '汽车开始加速。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accent',
          phoneticUs: '/ˈæksent/',
          phoneticUk: '/ˈæksent/',
          definitions: [
            { pos: 'n.', meaning: '口音；重音；强调' },
          ],
          sentences: [
            {
              contentEn: 'She speaks English with a French accent.',
              contentCn: '她说英语带有法国口音。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accept',
          phoneticUs: '/əkˈsept/',
          phoneticUk: '/əkˈsept/',
          definitions: [
            { pos: 'v.', meaning: '接受；承认；同意' },
          ],
          sentences: [
            {
              contentEn: 'I accept your apology.',
              contentCn: '我接受你的道歉。',
              isPrimary: true,
            },
          ],
        },
      ],
    },
    {
      unitNumber: 2,
      words: [
        {
          word: 'access',
          phoneticUs: '/ˈækses/',
          phoneticUk: '/ˈækses/',
          definitions: [
            { pos: 'n.', meaning: '入口；通道；接近的机会' },
            { pos: 'v.', meaning: '访问；存取' },
          ],
          sentences: [
            {
              contentEn: 'Students have access to the library.',
              contentCn: '学生可以使用图书馆。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accident',
          phoneticUs: '/ˈæksɪdənt/',
          phoneticUk: '/ˈæksɪdənt/',
          definitions: [
            { pos: 'n.', meaning: '事故；意外' },
          ],
          sentences: [
            {
              contentEn: 'The accident happened yesterday.',
              contentCn: '事故发生在昨天。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accommodate',
          phoneticUs: '/əˈkɑːmədeɪt/',
          phoneticUk: '/əˈkɒmədeɪt/',
          definitions: [
            { pos: 'v.', meaning: '容纳；提供住宿；适应' },
          ],
          sentences: [
            {
              contentEn: 'The hotel can accommodate 500 guests.',
              contentCn: '这家酒店可以容纳500位客人。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accompany',
          phoneticUs: '/əˈkʌmpəni/',
          phoneticUk: '/əˈkʌmpəni/',
          definitions: [
            { pos: 'v.', meaning: '陪伴；伴随；为...伴奏' },
          ],
          sentences: [
            {
              contentEn: 'May I accompany you home?',
              contentCn: '我可以送你回家吗？',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accomplish',
          phoneticUs: '/əˈkɑːmplɪʃ/',
          phoneticUk: '/əˈkʌmplɪʃ/',
          definitions: [
            { pos: 'v.', meaning: '完成；实现；达到' },
          ],
          sentences: [
            {
              contentEn: 'She accomplished her goal.',
              contentCn: '她实现了她的目标。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'according',
          phoneticUs: '/əˈkɔːrdɪŋ/',
          phoneticUk: '/əˈkɔːdɪŋ/',
          definitions: [
            { pos: 'adv.', meaning: '依照；根据' },
          ],
          sentences: [
            {
              contentEn: 'According to the report, sales increased.',
              contentCn: '根据报告，销售额增加了。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'account',
          phoneticUs: '/əˈkaʊnt/',
          phoneticUk: '/əˈkaʊnt/',
          definitions: [
            { pos: 'n.', meaning: '账户；叙述；理由' },
            { pos: 'v.', meaning: '解释；说明' },
          ],
          sentences: [
            {
              contentEn: 'I opened a bank account.',
              contentCn: '我开了一个银行账户。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accumulate',
          phoneticUs: '/əˈkjuːmjəleɪt/',
          phoneticUk: '/əˈkjuːmjəleɪt/',
          definitions: [
            { pos: 'v.', meaning: '积累；累积' },
          ],
          sentences: [
            {
              contentEn: 'Dust accumulates if you don\'t clean.',
              contentCn: '如果不打扫，灰尘就会积累。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accurate',
          phoneticUs: '/ˈækjərət/',
          phoneticUk: '/ˈækjərət/',
          definitions: [
            { pos: 'adj.', meaning: '准确的；精确的' },
          ],
          sentences: [
            {
              contentEn: 'The data is accurate.',
              contentCn: '数据是准确的。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'accuse',
          phoneticUs: '/əˈkjuːz/',
          phoneticUk: '/əˈkjuːz/',
          definitions: [
            { pos: 'v.', meaning: '指控；指责；归咎于' },
          ],
          sentences: [
            {
              contentEn: 'He was accused of theft.',
              contentCn: '他被指控盗窃。',
              isPrimary: true,
            },
          ],
        },
      ],
    },
  ],
};

// High School vocabulary (for variety)
const highSchoolBook: SeedBook = {
  name: '高中英语词汇',
  code: 'HIGH_SCHOOL',
  description: '高中英语核心词汇，共约3500词',
  isFree: true,
  sortOrder: 2,
  units: [
    {
      unitNumber: 1,
      words: [
        {
          word: 'apple',
          phoneticUs: '/ˈæpl/',
          phoneticUk: '/ˈæpl/',
          definitions: [
            { pos: 'n.', meaning: '苹果' },
          ],
          sentences: [
            {
              contentEn: 'An apple a day keeps the doctor away.',
              contentCn: '一天一苹果，医生远离我。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'book',
          phoneticUs: '/bʊk/',
          phoneticUk: '/bʊk/',
          definitions: [
            { pos: 'n.', meaning: '书；书本' },
            { pos: 'v.', meaning: '预订' },
          ],
          sentences: [
            {
              contentEn: 'I like reading books.',
              contentCn: '我喜欢读书。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'computer',
          phoneticUs: '/kəmˈpjuːtər/',
          phoneticUk: '/kəmˈpjuːtə/',
          definitions: [
            { pos: 'n.', meaning: '计算机；电脑' },
          ],
          sentences: [
            {
              contentEn: 'I use a computer every day.',
              contentCn: '我每天都用电脑。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'develop',
          phoneticUs: '/dɪˈveləp/',
          phoneticUk: '/dɪˈveləp/',
          definitions: [
            { pos: 'v.', meaning: '发展；开发；培养' },
          ],
          sentences: [
            {
              contentEn: 'We need to develop new skills.',
              contentCn: '我们需要培养新技能。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'environment',
          phoneticUs: '/ɪnˈvaɪrənmənt/',
          phoneticUk: '/ɪnˈvaɪrənmənt/',
          definitions: [
            { pos: 'n.', meaning: '环境' },
          ],
          sentences: [
            {
              contentEn: 'We must protect the environment.',
              contentCn: '我们必须保护环境。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'friend',
          phoneticUs: '/frend/',
          phoneticUk: '/frend/',
          definitions: [
            { pos: 'n.', meaning: '朋友' },
          ],
          sentences: [
            {
              contentEn: 'She is my best friend.',
              contentCn: '她是我最好的朋友。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'government',
          phoneticUs: '/ˈɡʌvərnmənt/',
          phoneticUk: '/ˈɡʌvənmənt/',
          definitions: [
            { pos: 'n.', meaning: '政府' },
          ],
          sentences: [
            {
              contentEn: 'The government made a new policy.',
              contentCn: '政府制定了新政策。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'health',
          phoneticUs: '/helθ/',
          phoneticUk: '/helθ/',
          definitions: [
            { pos: 'n.', meaning: '健康' },
          ],
          sentences: [
            {
              contentEn: 'Health is more important than wealth.',
              contentCn: '健康比财富更重要。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'important',
          phoneticUs: '/ɪmˈpɔːrtnt/',
          phoneticUk: '/ɪmˈpɔːtnt/',
          definitions: [
            { pos: 'adj.', meaning: '重要的' },
          ],
          sentences: [
            {
              contentEn: 'This is an important decision.',
              contentCn: '这是一个重要的决定。',
              isPrimary: true,
            },
          ],
        },
        {
          word: 'journey',
          phoneticUs: '/ˈdʒɜːrni/',
          phoneticUk: '/ˈdʒɜːni/',
          definitions: [
            { pos: 'n.', meaning: '旅行；旅程' },
          ],
          sentences: [
            {
              contentEn: 'Life is a journey.',
              contentCn: '人生是一场旅程。',
              isPrimary: true,
            },
          ],
        },
      ],
    },
  ],
};

export async function seedVocabulary(dataSource: DataSource): Promise<void> {
  const bookRepository = dataSource.getRepository(Book);
  const wordRepository = dataSource.getRepository(Word);
  const sentenceRepository = dataSource.getRepository(Sentence);

  const booksToSeed = [cet4Book, highSchoolBook];

  for (const bookData of booksToSeed) {
    // Check if book already exists
    const existingBook = await bookRepository.findOne({
      where: { code: bookData.code },
    });

    if (existingBook) {
      console.log(`Book ${bookData.code} already exists, skipping...`);
      continue;
    }

    // Calculate totals
    const totalWords = bookData.units.reduce(
      (sum, unit) => sum + unit.words.length,
      0,
    );
    const totalUnits = bookData.units.length;

    // Create book
    const book = bookRepository.create({
      name: bookData.name,
      code: bookData.code,
      description: bookData.description,
      isFree: bookData.isFree,
      coverImage: bookData.coverImage || null,
      sortOrder: bookData.sortOrder,
      totalWords,
      totalUnits,
    });

    await bookRepository.save(book);
    console.log(`Created book: ${book.name}`);

    // Create words and sentences
    for (const unitData of bookData.units) {
      for (let i = 0; i < unitData.words.length; i++) {
        const wordData = unitData.words[i];

        const word = wordRepository.create({
          bookId: book.id,
          unitNumber: unitData.unitNumber,
          word: wordData.word,
          phoneticUs: wordData.phoneticUs,
          phoneticUk: wordData.phoneticUk,
          definitions: wordData.definitions,
          sortOrder: i,
        });

        await wordRepository.save(word);

        // Create sentences
        for (let j = 0; j < wordData.sentences.length; j++) {
          const sentenceData = wordData.sentences[j];
          const sentence = sentenceRepository.create({
            wordId: word.id,
            contentEn: sentenceData.contentEn,
            contentCn: sentenceData.contentCn,
            isPrimary: sentenceData.isPrimary || false,
            sortOrder: j,
          });

          await sentenceRepository.save(sentence);
        }
      }

      console.log(`  Created ${unitData.words.length} words for Unit ${unitData.unitNumber}`);
    }
  }

  console.log('Vocabulary seeding completed!');
}

// Run seed if called directly
async function main(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'cishanjia_dev',
    entities: [Book, Word, Sentence],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    await seedVocabulary(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  main();
}
