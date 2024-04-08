'use client';
import Landing from "./components/Landing.jsx";
import Header from "./components/Header.jsx";
import Projects from "./components/Projects.jsx";
import AboutMe from "./components/AboutMe.jsx";
import ScrollNav from "./components/ScrollNav.jsx";
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
      <div className="header top-0 z-40 lg-desktop:px-300px desktop:px-108px w-full bg-shale-grey">
        <Header />
      </div>
      <ScrollNav />
      <div className="main-sub-container lg-desktop:px-300px bg-deep-blue flex-grow w-full relative min-h-screen">
        <Landing />
      </div>
      <div id="projects" className="projects-container w-full relative lg-desktop:px-300px min-h-screen bg-shale-grey">
        <Projects />
      </div>
      <div id="aboutMe" className="about-me-container w-full relative lg-desktop:px-300px min-h-screen bg-white">
        <AboutMe />
      </div>
    </div>
  );
}