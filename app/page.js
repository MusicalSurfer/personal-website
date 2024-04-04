'use client';
import Landing from "./components/Landing.jsx";
import Header from "./components/Header.jsx";
import Projects from "./components/Projects.jsx";
import AboutMe from "./components/AboutMe.jsx";
import AOS from 'aos';
import { useEffect } from 'react';
import 'aos/dist/aos.css'; // You can also use <link> for styles


export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 2000
    });
  }, []);

  return (
    <div className="main-container flex flex-col min-h-screen justify-between items-center font-sans antialiased">
      <div className="header sticky top-0 z-50 px-300px w-full bg-shale-grey">
        <Header />
      </div>
      <div className="main-sub-container bg-custom-gradient flex-grow w-full relative px-300px min-h-screen">
        <Landing />
      </div>
      <div id="projects" className="projects-container w-full relative px-300px min-h-screen bg-shale-grey">
        <Projects />
      </div>
      <div className="about-me-container w-full relative px-300px min-h-screen bg-light-blue">
        <AboutMe />
      </div>
    </div>
  );
}