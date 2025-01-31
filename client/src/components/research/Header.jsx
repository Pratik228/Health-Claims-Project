import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const Header = () => {
  return (
    <div className="flex items-center mb-8">
      <Link
        to="/"
        className="flex items-center text-emerald-500 hover:text-emerald-400"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-white ml-4">Research Tasks</h1>
    </div>
  );
};

export default Header;
