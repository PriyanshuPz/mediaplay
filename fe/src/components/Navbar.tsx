import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center space-x-2 group">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span className="text-base font-semibold text-gray-800 group-hover:text-gray-600 transition-colors">
              Media Library
            </span>
          </Link>

          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              Home
            </Link>
            <Link
              to="/manage/media"
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors font-medium"
            >
              Add Media
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
