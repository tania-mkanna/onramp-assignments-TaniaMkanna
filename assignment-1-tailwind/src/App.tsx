import { useState, useEffect } from "react";
import "./App.css";

function App() {

  const [darkMode, setDarkMode] = useState(false);


  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  }

  return (
    <div id="root" className="min-h-screen bg-bg-default text-text-primary">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-10 py-6 border-b">
        <h1 className="text-2xl font-bold">Tania Mkanna</h1>

        <ul className="flex gap-6 text-sm">
          <li className="hover:text-text-secondary cursor-pointer">Home</li>
          <li className="hover:text-text-secondary cursor-pointer">About</li>
          <li className="hover:text-text-secondary cursor-pointer">Projects</li>
          <li className="hover:text-text-secondary cursor-pointer">Contact</li>
        </ul>
      </nav>

      {/* HERO SECTION */}
      <section className=" bg-bg-surface text-center py-20 px-6">
        <h2 className="text-5xl font-bold mb-4">
          Hi, I'm Tania
        </h2>

        <p className="text-xl opacity-80 mb-6">
          Computer Science Student at Lebanese University
        </p>

        <p className="max-w-xl mx-auto opacity-70">
          I’m a Computer Science student passionate about building clean,
          responsive, and user-friendly web applications using modern tools
          like React, TypeScript, and Tailwind CSS.
        </p>

      
      </section>

      {/* ABOUT SECTION */}
      <section className="px-10 py-16 bg-bg-surface">
        <h3 className="text-3xl font-bold mb-6">About Me</h3>

        <p className="opacity-80 leading-relaxed max-w-3xl">
          I am currently studying Computer Science at the Lebanese University.
          I have a strong passion for web development and enjoy creating
          intuitive and efficient applications. I have experience working with
          various frontend technologies and am always eager to learn new tools
          and frameworks to enhance my skills.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="px-3 py-1 border rounded-full text-sm">HTML</span>
          <span className="px-3 py-1 border rounded-full text-sm">CSS</span>
          <span className="px-3 py-1 border rounded-full text-sm">JavaScript</span>
          <span className="px-3 py-1 border rounded-full text-sm">React</span>
          <span className="px-3 py-1 border rounded-full text-sm">Tailwind</span>
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section className="px-10 py-16 bg-bg-surface">
        <h3 className="text-3xl font-bold mb-8">Projects</h3>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="border p-6 rounded-xl">
            <h4 className="font-bold text-xl mb-2">Doctor Booking System</h4>
            <p className="opacity-70 text-sm">
              A website to display doctor information and allow bookings appointments.
            </p>
          </div>

          <div className="border p-6 rounded-xl">
            <h4 className="font-bold text-xl mb-2">Car Rental UI</h4>
            <p className="opacity-70 text-sm">
              A frontend UI for renting and browsing cars using React.
            </p>
          </div>

          <div className="border p-6 rounded-xl">
            <h4 className="font-bold text-xl mb-2">Portfolio Website</h4>
            <p className="opacity-70 text-sm">
              This portfolio built with React and Tailwind CSS.
            </p>
          </div>

        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="px-10 py-16 bg-bg-surface border-t">
        <h3 className="text-3xl font-bold mb-6">Contact</h3>


        <div className="space-y-2">
          <p>Email: taniamkanna@hotmail.com</p>
          <p>GitHub: github.com/tania-mkanna</p>
          <p>LinkedIn: linkedin.com/in/tania-mkanna-b21091239</p>
        </div>
      </section>

      {/* toggle btn */}
      <button onClick={toggleDarkMode} className="fixed bottom-4 right-4 bg-bg-accent dark:text-primary text-white px-4 py-2 rounded-full">
        {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>

      {/* FOOTER */}
      <footer className="text-center py-6 text-sm opacity-60 border-t">
        © 2026 Tania Mkanna. All rights reserved.
      </footer>

    </div>
  );
}

export default App;