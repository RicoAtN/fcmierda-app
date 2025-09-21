export default function Footer() {
  return (
    <footer className="w-full py-6 px-4 bg-gray-900">
      <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} FC Mierda. All rights reserved.
      </div>
    </footer>
  );
}