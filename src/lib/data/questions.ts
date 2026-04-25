export type Difficulty = 'easy' | 'medium' | 'hard'

export type Question = {
  id: string
  question: string
  correct: string
  incorrect: string[]
  category: number
  difficulty: Difficulty
}

export const QUESTIONS: Question[] = [
  // General Knowledge (9) - Easy
  {
    id: 'gk-e-1',
    question: 'What is the capital of France?',
    correct: 'Paris',
    incorrect: ['London', 'Berlin', 'Madrid'],
    category: 9,
    difficulty: 'easy',
  },
  {
    id: 'gk-e-2',
    question: 'How many sides does a hexagon have?',
    correct: '6',
    incorrect: ['5', '7', '8'],
    category: 9,
    difficulty: 'easy',
  },
  {
    id: 'gk-e-3',
    question: 'What color do you get when you mix red and white?',
    correct: 'Pink',
    incorrect: ['Orange', 'Purple', 'Yellow'],
    category: 9,
    difficulty: 'easy',
  },
  {
    id: 'gk-e-4',
    question: 'What is the largest planet in our solar system?',
    correct: 'Jupiter',
    incorrect: ['Saturn', 'Neptune', 'Earth'],
    category: 9,
    difficulty: 'easy',
  },
  {
    id: 'gk-e-5',
    question: 'How many minutes are in an hour?',
    correct: '60',
    incorrect: ['30', '100', '45'],
    category: 9,
    difficulty: 'easy',
  },
  // General Knowledge - Medium
  {
    id: 'gk-m-1',
    question: 'Which element has the chemical symbol Au?',
    correct: 'Gold',
    incorrect: ['Silver', 'Copper', 'Iron'],
    category: 9,
    difficulty: 'medium',
  },
  {
    id: 'gk-m-2',
    question: 'In which year did World War II end?',
    correct: '1945',
    incorrect: ['1944', '1943', '1946'],
    category: 9,
    difficulty: 'medium',
  },
  {
    id: 'gk-m-3',
    question: 'Which country has the most natural lakes?',
    correct: 'Canada',
    incorrect: ['Russia', 'USA', 'Brazil'],
    category: 9,
    difficulty: 'medium',
  },
  // General Knowledge - Hard
  {
    id: 'gk-h-1',
    question: 'What is the speed of light in a vacuum (approximately)?',
    correct: '299,792,458 m/s',
    incorrect: ['300,000,000 m/s', '186,000 m/s', '150,000,000 m/s'],
    category: 9,
    difficulty: 'hard',
  },
  {
    id: 'gk-h-2',
    question: 'Which organ produces insulin in the human body?',
    correct: 'Pancreas',
    incorrect: ['Liver', 'Kidney', 'Spleen'],
    category: 9,
    difficulty: 'hard',
  },
  // Science & Nature (17) - Easy
  {
    id: 'sci-e-1',
    question: 'What gas do plants absorb from the atmosphere?',
    correct: 'Carbon dioxide',
    incorrect: ['Oxygen', 'Nitrogen', 'Hydrogen'],
    category: 17,
    difficulty: 'easy',
  },
  {
    id: 'sci-e-2',
    question: 'How many legs does a spider have?',
    correct: '8',
    incorrect: ['6', '10', '4'],
    category: 17,
    difficulty: 'easy',
  },
  // Science - Medium
  {
    id: 'sci-m-1',
    question: 'What is the powerhouse of the cell?',
    correct: 'Mitochondria',
    incorrect: ['Nucleus', 'Ribosome', 'Vacuole'],
    category: 17,
    difficulty: 'medium',
  },
  {
    id: 'sci-m-2',
    question: 'What is the atomic number of Carbon?',
    correct: '6',
    incorrect: ['8', '12', '4'],
    category: 17,
    difficulty: 'medium',
  },
  // Science - Hard
  {
    id: 'sci-h-1',
    question: 'What is the Heisenberg Uncertainty Principle about?',
    correct: 'You cannot simultaneously know the exact position and momentum of a particle',
    incorrect: [
      'Energy cannot be created or destroyed',
      'Every action has an equal and opposite reaction',
      'Objects in motion stay in motion',
    ],
    category: 17,
    difficulty: 'hard',
  },
  // Computers (18) - Easy
  {
    id: 'comp-e-1',
    question: 'What does CPU stand for?',
    correct: 'Central Processing Unit',
    incorrect: ['Central Power Unit', 'Computer Processing Unit', 'Core Processing Unit'],
    category: 18,
    difficulty: 'easy',
  },
  {
    id: 'comp-e-2',
    question: 'Which company created the iPhone?',
    correct: 'Apple',
    incorrect: ['Samsung', 'Google', 'Microsoft'],
    category: 18,
    difficulty: 'easy',
  },
  // Computers - Medium
  {
    id: 'comp-m-1',
    question: 'What does HTML stand for?',
    correct: 'HyperText Markup Language',
    incorrect: ['HyperText Machine Language', 'HyperText Making Language', 'HighText Markup Language'],
    category: 18,
    difficulty: 'medium',
  },
  {
    id: 'comp-m-2',
    question: 'What programming language is known as the "language of the web"?',
    correct: 'JavaScript',
    incorrect: ['Python', 'Java', 'C++'],
    category: 18,
    difficulty: 'medium',
  },
  // Computers - Hard
  {
    id: 'comp-h-1',
    question: 'What is the time complexity of a binary search algorithm?',
    correct: 'O(log n)',
    incorrect: ['O(n)', 'O(n²)', 'O(1)'],
    category: 18,
    difficulty: 'hard',
  },
  // Sports (21) - Easy
  {
    id: 'sport-e-1',
    question: 'How many players are on a standard soccer team?',
    correct: '11',
    incorrect: ['9', '10', '12'],
    category: 21,
    difficulty: 'easy',
  },
  {
    id: 'sport-e-2',
    question: 'Which sport uses a shuttlecock?',
    correct: 'Badminton',
    incorrect: ['Tennis', 'Squash', 'Volleyball'],
    category: 21,
    difficulty: 'easy',
  },
  // Sports - Medium
  {
    id: 'sport-m-1',
    question: 'In which country did the 2016 Summer Olympics take place?',
    correct: 'Brazil',
    incorrect: ['UK', 'China', 'Japan'],
    category: 21,
    difficulty: 'medium',
  },
  {
    id: 'sport-m-2',
    question: 'How many points is a touchdown worth in American Football?',
    correct: '6',
    incorrect: ['7', '3', '4'],
    category: 21,
    difficulty: 'medium',
  },
  // Sports - Hard
  {
    id: 'sport-h-1',
    question: 'Which country has won the most FIFA World Cup titles?',
    correct: 'Brazil',
    incorrect: ['Germany', 'Italy', 'Argentina'],
    category: 21,
    difficulty: 'hard',
  },
  // Geography (22) - Easy
  {
    id: 'geo-e-1',
    question: 'What is the largest continent?',
    correct: 'Asia',
    incorrect: ['Africa', 'North America', 'Europe'],
    category: 22,
    difficulty: 'easy',
  },
  {
    id: 'geo-e-2',
    question: 'Which river is the longest in the world?',
    correct: 'The Nile',
    incorrect: ['The Amazon', 'The Mississippi', 'The Yangtze'],
    category: 22,
    difficulty: 'easy',
  },
  // Geography - Medium
  {
    id: 'geo-m-1',
    question: 'What is the smallest country in the world?',
    correct: 'Vatican City',
    incorrect: ['Monaco', 'San Marino', 'Liechtenstein'],
    category: 22,
    difficulty: 'medium',
  },
  // Geography - Hard
  {
    id: 'geo-h-1',
    question: 'What is the capital of Kazakhstan?',
    correct: 'Astana',
    incorrect: ['Almaty', 'Karaganda', 'Shymkent'],
    category: 22,
    difficulty: 'hard',
  },
  // History (23) - Easy
  {
    id: 'hist-e-1',
    question: 'Who was the first President of the United States?',
    correct: 'George Washington',
    incorrect: ['Abraham Lincoln', 'Thomas Jefferson', 'John Adams'],
    category: 23,
    difficulty: 'easy',
  },
  // History - Medium
  {
    id: 'hist-m-1',
    question: 'In which year did the Berlin Wall fall?',
    correct: '1989',
    incorrect: ['1991', '1987', '1993'],
    category: 23,
    difficulty: 'medium',
  },
  // History - Hard
  {
    id: 'hist-h-1',
    question: 'Which empire was ruled by Genghis Khan?',
    correct: 'Mongol Empire',
    incorrect: ['Ottoman Empire', 'Roman Empire', 'Han Dynasty'],
    category: 23,
    difficulty: 'hard',
  },
  // Art (25) - Easy
  {
    id: 'art-e-1',
    question: 'Who painted the Mona Lisa?',
    correct: 'Leonardo da Vinci',
    incorrect: ['Michelangelo', 'Raphael', 'Caravaggio'],
    category: 25,
    difficulty: 'easy',
  },
  // Art - Medium
  {
    id: 'art-m-1',
    question: 'In which museum is the Mona Lisa housed?',
    correct: 'The Louvre',
    incorrect: ['The Uffizi', 'The Prado', 'The Metropolitan'],
    category: 25,
    difficulty: 'medium',
  },
  // Art - Hard
  {
    id: 'art-h-1',
    question: 'Who sculpted "The Thinker"?',
    correct: 'Auguste Rodin',
    incorrect: ['Michelangelo', 'Donatello', 'Bernini'],
    category: 25,
    difficulty: 'hard',
  },
  // Animals (27) - Easy
  {
    id: 'anim-e-1',
    question: 'What is the fastest land animal?',
    correct: 'Cheetah',
    incorrect: ['Lion', 'Horse', 'Greyhound'],
    category: 27,
    difficulty: 'easy',
  },
  {
    id: 'anim-e-2',
    question: 'How many hearts does an octopus have?',
    correct: '3',
    incorrect: ['1', '2', '4'],
    category: 27,
    difficulty: 'easy',
  },
  // Animals - Medium
  {
    id: 'anim-m-1',
    question: 'What is the largest species of shark?',
    correct: 'Whale shark',
    incorrect: ['Great white shark', 'Hammerhead shark', 'Bull shark'],
    category: 27,
    difficulty: 'medium',
  },
  // Animals - Hard
  {
    id: 'anim-h-1',
    question: 'What is the gestation period of an elephant?',
    correct: '22 months',
    incorrect: ['12 months', '18 months', '9 months'],
    category: 27,
    difficulty: 'hard',
  },
  {
    id: 'anim-h-2',
    question: 'Which bird has the largest wingspan?',
    correct: 'Wandering albatross',
    incorrect: ['Condor', 'Eagle', 'Pelican'],
    category: 27,
    difficulty: 'hard',
  },
  // Mathematics (19) - Easy
  {
    id: 'math-e-1',
    question: 'What is 7 × 8?',
    correct: '56',
    incorrect: ['54', '63', '48'],
    category: 19,
    difficulty: 'easy',
  },
  {
    id: 'math-e-2',
    question: 'What is 15 + 27?',
    correct: '42',
    incorrect: ['41', '43', '40'],
    category: 19,
    difficulty: 'easy',
  },
  {
    id: 'math-e-3',
    question: 'How many sides does a triangle have?',
    correct: '3',
    incorrect: ['4', '5', '6'],
    category: 19,
    difficulty: 'easy',
  },
  {
    id: 'math-e-4',
    question: 'What is half of 100?',
    correct: '50',
    incorrect: ['25', '40', '60'],
    category: 19,
    difficulty: 'easy',
  },
  {
    id: 'math-e-5',
    question: 'What is 9 × 9?',
    correct: '81',
    incorrect: ['72', '90', '64'],
    category: 19,
    difficulty: 'easy',
  },
  // Mathematics - Medium
  {
    id: 'math-m-1',
    question: 'What is the square root of 144?',
    correct: '12',
    incorrect: ['11', '13', '14'],
    category: 19,
    difficulty: 'medium',
  },
  {
    id: 'math-m-2',
    question: 'What is 15% of 200?',
    correct: '30',
    incorrect: ['25', '35', '20'],
    category: 19,
    difficulty: 'medium',
  },
  {
    id: 'math-m-3',
    question: 'What is the value of π (pi) to two decimal places?',
    correct: '3.14',
    incorrect: ['3.12', '3.16', '3.18'],
    category: 19,
    difficulty: 'medium',
  },
  {
    id: 'math-m-4',
    question: 'What is 2³ (2 to the power of 3)?',
    correct: '8',
    incorrect: ['6', '9', '12'],
    category: 19,
    difficulty: 'medium',
  },
  {
    id: 'math-m-5',
    question: 'How many degrees are in a right angle?',
    correct: '90',
    incorrect: ['45', '180', '60'],
    category: 19,
    difficulty: 'medium',
  },
  // Mathematics - Hard
  {
    id: 'math-h-1',
    question: 'What is the sum of interior angles of a hexagon?',
    correct: '720°',
    incorrect: ['540°', '900°', '360°'],
    category: 19,
    difficulty: 'hard',
  },
  {
    id: 'math-h-2',
    question: 'If f(x) = x² + 3x + 2, what is f(4)?',
    correct: '30',
    incorrect: ['24', '26', '28'],
    category: 19,
    difficulty: 'hard',
  },
  {
    id: 'math-h-3',
    question: 'What is the least common multiple (LCM) of 8 and 12?',
    correct: '24',
    incorrect: ['16', '48', '96'],
    category: 19,
    difficulty: 'hard',
  },
  // Music (12) - Easy
  {
    id: 'mus-e-1',
    question: 'How many strings does a standard guitar have?',
    correct: '6',
    incorrect: ['4', '5', '7'],
    category: 12,
    difficulty: 'easy',
  },
  {
    id: 'mus-e-2',
    question: 'Which instrument has keys, strings, and hammers inside?',
    correct: 'Piano',
    incorrect: ['Organ', 'Harpsichord', 'Accordion'],
    category: 12,
    difficulty: 'easy',
  },
  // Music - Medium
  {
    id: 'mus-m-1',
    question: 'How many notes are in an octave?',
    correct: '8',
    incorrect: ['7', '10', '12'],
    category: 12,
    difficulty: 'medium',
  },
  {
    id: 'mus-m-2',
    question: 'Which composer wrote "Symphony No. 5" in C minor?',
    correct: 'Beethoven',
    incorrect: ['Mozart', 'Bach', 'Schubert'],
    category: 12,
    difficulty: 'medium',
  },
  // Music - Hard
  {
    id: 'mus-h-1',
    question: 'What time signature is commonly known as "common time"?',
    correct: '4/4',
    incorrect: ['3/4', '6/8', '2/4'],
    category: 12,
    difficulty: 'hard',
  },
  // Mythology (20) - Easy
  {
    id: 'myth-e-1',
    question: 'Who is the king of the Greek gods?',
    correct: 'Zeus',
    incorrect: ['Poseidon', 'Hades', 'Apollo'],
    category: 20,
    difficulty: 'easy',
  },
  // Mythology - Medium
  {
    id: 'myth-m-1',
    question: 'In Greek mythology, who flew too close to the sun with wax wings?',
    correct: 'Icarus',
    incorrect: ['Daedalus', 'Hermes', 'Perseus'],
    category: 20,
    difficulty: 'medium',
  },
  // Mythology - Hard
  {
    id: 'myth-h-1',
    question: 'In Norse mythology, what is the name of the world tree?',
    correct: 'Yggdrasil',
    incorrect: ['Mjolnir', 'Valhalla', 'Bifrost'],
    category: 20,
    difficulty: 'hard',
  },
]
