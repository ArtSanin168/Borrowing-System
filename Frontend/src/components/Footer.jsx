export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-4 text-center text-sm text-gray-500">
      <p>© {currentYear} Borrowing System. All rights reserved.</p>
    </footer>
  )
}
