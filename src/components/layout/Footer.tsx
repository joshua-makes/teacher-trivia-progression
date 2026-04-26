export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
        Built with ❤️ for classrooms ·{' '}
        <a
          href="https://ladderquiz.com"
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          ladderquiz.com
        </a>{' '}
        ·{' '}
        <a
          href="https://github.com/joshua-makes/teacher-trivia-progression"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}
