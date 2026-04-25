export function Footer() {
  return (
    <footer className="border-t border-gray-200/80 dark:border-gray-800/80 mt-auto bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
        Built with ❤️ for classrooms ·{' '}
        <a
          href="https://trivialevels.com"
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          trivialevels.com
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
