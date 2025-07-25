import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/public/placeholder.svg')" }}
    >
      <div className="bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 p-10 rounded-lg shadow-lg text-center">
        <img src="/public/lovable.svg" alt="Aura Bloom Therapy Logo" className="w-32 h-32 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Aura Bloom Therapy</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          Your journey to mental wellness starts here.
        </p>
        <div className="space-x-4">
          <Link to="/signin">
            <button className="px-8 py-3 font-semibold text-black bg-aura-yellow rounded-full hover:bg-amber-400 transition-colors">
              Sign In
            </button>
          </Link>
          <Link to="/signup">
            <button className="px-8 py-3 font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
