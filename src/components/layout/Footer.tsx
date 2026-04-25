export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Built with ❤️ by{' '}
        <a
          href="https://github.com/bestacles"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors underline"
        >
          bestacles
        </a>{' '}
        ·{' '}
        <a
          href="https://github.com/bestacles/teacher-trivia-progression"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors underline"
        >
          View source
        </a>
      </div>
    </footer>
  )
}
